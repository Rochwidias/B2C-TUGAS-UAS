'use client';

// Papan pesanan versi frontend-only (docs/FRONTEND-ONLY.md): satu-satunya
// sumber data adalah store lokal `src/lib/orders-store.ts` (localStorage
// `aether-orders`). Order yang dibuat customer di browser yang sama langsung
// muncul di sini lewat event `craftai:recent-changed` + event `storage`
// antar-tab. Statistik dihitung lokal di ./local-orders — tidak ada fetch API.

import { useCallback, useEffect, useMemo, useState } from 'react';
import KanbanBoard from './KanbanBoard';
import StatsRow, { StatusDistribution } from './StatsRow';
import OrderFilterBar from './OrderFilterBar';
import { Skeleton } from '@/components/ui/Feedback';
import {
  ORDER_STORE_KEY,
  RECENT_EVENT,
  ensureDemoOrder,
  listOrders,
  type StoredOrder,
} from '@/lib/orders-store';
import { buildColumns, buildStats } from './local-orders';
import {
  COLUMN_ORDER,
  type AdminOrder,
  type AdminStats,
  type KanbanColumns,
  type StatusFilter,
} from './types';

function emptyColumns(): KanbanColumns {
  return { backlog: [], in_progress: [], review: [], completed: [] };
}

function skeletonBoard() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {COLUMN_ORDER.map((key) => (
        <div key={key} className="border border-rule bg-paper/60">
          <div className="h-[37px] animate-pulse border-b-[1.5px] border-rule bg-rule/40" />
          <div className="space-y-2 p-2">
            <div className="h-28 animate-pulse bg-rule/30" />
            <div className="h-28 animate-pulse bg-rule/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Cocokkan satu order dengan kata kunci pencarian: nama, nomor, email, paket. */
function matchesQuery(order: AdminOrder, needle: string): boolean {
  if (!needle) return true;
  const haystack = [order.order_number, order.contact_name, order.contact_email, order.package_name]
    .join(' ')
    .toLocaleLowerCase('id-ID');
  return haystack.includes(needle);
}

export default function AdminBoard() {
  // null = belum pernah dibaca; [] = penyimpanan memang kosong.
  const [orders, setOrders] = useState<StoredOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const refresh = useCallback(() => {
    setOrders(listOrders());
  }, []);

  useEffect(() => {
    let alive = true;

    // Seed demo + pembacaan awal lewat microtask: setState yang diset sinkron
    // di dalam effect memicu render berantai (lint react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (!alive) return;
      ensureDemoOrder();
      refresh();
      setLoading(false);
    });

    // Perubahan apa pun (kartu pindah, poster disimpan, order baru dari shop)
    // menyebar lewat event store; `storage` mengCover tab lain.
    const onRecent = () => {
      if (alive) refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (alive && (event.key === null || event.key === ORDER_STORE_KEY)) refresh();
    };
    window.addEventListener(RECENT_EVENT, onRecent);
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener(RECENT_EVENT, onRecent);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const columns = useMemo<KanbanColumns>(() => buildColumns(orders ?? []), [orders]);
  const stats = useMemo<AdminStats | null>(() => (orders ? buildStats(orders) : null), [orders]);

  // Filter sisi klien: satu sumber kebenaran untuk papan dan hitungan kolom.
  // `status` memilih satu kolom saja; pencarian menyaring di dalamnya.
  const visible = useMemo<KanbanColumns>(() => {
    const needle = query.trim().toLocaleLowerCase('id-ID');
    const result = emptyColumns();
    for (const key of COLUMN_ORDER) {
      const inScope = status === 'all' || status === key;
      result[key] = inScope
        ? (columns[key] ?? []).filter((order) => matchesQuery(order, needle))
        : [];
    }
    return result;
  }, [columns, query, status]);

  const totalAll = COLUMN_ORDER.reduce((sum, key) => sum + (columns[key]?.length ?? 0), 0);
  const matchCount = COLUMN_ORDER.reduce((sum, key) => sum + visible[key].length, 0);
  const filtering = query.trim() !== '' || status !== 'all';
  const openVisible = COLUMN_ORDER.filter((key) => key !== 'completed').reduce(
    (sum, key) => sum + visible[key].length,
    0,
  );

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
            Aether Creative / papan pesanan poster
          </p>
          <h1 className="mt-1 text-2xl leading-none font-semibold tracking-tight text-ink sm:text-[28px]">
            Papan <span className="font-serif italic">Pesanan</span>
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[12px] leading-relaxed text-ink-soft">
            Pindahkan kartu antar kolom lewat dropdown di kartu. Tiap kartu menampilkan paket dan
            sisa kuota poster; setiap perubahan tersimpan di penyimpanan lokal browser dan langsung
            terlihat customer di tab yang sama.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-stretch justify-between gap-2 sm:w-auto sm:justify-start">
          <dl className="flex flex-1 items-stretch border border-rule bg-surface sm:flex-none">
            <div className="flex-1 px-2.5 py-1.5">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                Total
              </dt>
              <dd className="font-mono text-base leading-tight font-semibold tabular-nums">
                {String(filtering ? matchCount : totalAll).padStart(2, '0')}
              </dd>
            </div>
            <span aria-hidden="true" className="w-px bg-rule" />
            <div className="flex-1 px-2.5 py-1.5">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                Terbuka
              </dt>
              <dd className="font-mono text-base leading-tight font-semibold tabular-nums text-accent">
                {String(openVisible).padStart(2, '0')}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="min-h-11 border border-ink bg-paper px-3 text-[11.5px] font-semibold text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {loading ? 'Memuat…' : 'Muat ulang'}
          </button>
        </div>
      </div>

      <section aria-labelledby="ringkasan-order" className="mt-3">
        <h2 id="ringkasan-order" className="sr-only">
          Ringkasan order Aether Creative
        </h2>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <StatsRow
            stats={stats}
            loading={loading && !stats}
            error={null}
            onRetry={refresh}
          />
          <div className="hidden lg:block">
            {stats ? (
              <StatusDistribution stats={stats} />
            ) : (
              <div className="border border-rule bg-surface px-3 py-2.5" aria-hidden="true">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="mt-3 h-2 w-full" />
                <Skeleton className="mt-2 h-2.5 w-2/3" />
              </div>
            )}
          </div>
        </div>
        {stats ? (
          <div className="mt-3 lg:hidden">
            <StatusDistribution stats={stats} />
          </div>
        ) : null}
      </section>

      <div className="mt-3">
        <OrderFilterBar
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
          matchCount={matchCount}
          totalCount={totalAll}
          onReset={() => {
            setQuery('');
            setStatus('all');
          }}
        />
      </div>

      {loading && orders === null ? (
        <div className="mt-4" aria-busy="true">
          <p className="mb-2 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
            Membaca penyimpanan lokal…
          </p>
          {skeletonBoard()}
        </div>
      ) : null}

      {!loading && orders !== null ? (
        <div className="mt-4">
          <KanbanBoard
            columns={visible}
            filtered={filtering}
            onMoved={refresh}
            keys={status === 'all' ? COLUMN_ORDER : [status]}
          />
          {status !== 'all' ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-1 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
              <span>Menampilkan 1 dari {COLUMN_ORDER.length} kolom</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setStatus('all')}
                className="min-h-11 underline decoration-rule underline-offset-4 transition hover:text-ink hover:decoration-accent"
              >
                Tampilkan semua kolom
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
