'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import KanbanBoard from './KanbanBoard';
import StatsRow, { StatusDistribution } from './StatsRow';
import OrderFilterBar from './OrderFilterBar';
import SessionExpired from './SessionExpired';
import { Skeleton } from '@/components/ui/Feedback';
import {
  COLUMN_ORDER,
  type AdminOrder,
  type AdminStats,
  type KanbanColumns,
  type StatusFilter,
} from './types';
import { API_BASE } from '@/lib/api';

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

// Mengambil papan + statistik dari API admin dan menanganinya sebagai state
// klien supaya status pindah kartu bisa me-refresh tanpa navigasi server.
export default function AdminBoard() {
  const [columns, setColumns] = useState<KanbanColumns | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    // Semua set-state diundur: effect memanggil fungsi ini langsung, jadi
    // state yang diset sinkron di awal akan memicu render berantai.
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/admin/orders`, { cache: 'no-store', credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/stats`, { cache: 'no-store', credentials: 'include' }).catch(() => null),
      ]);

      if (ordersResponse.status === 401) {
        queueMicrotask(() => {
          setColumns(emptyColumns());
          setExpired(true);
        });
        return;
      }

      const payload = (await ordersResponse.json().catch(() => null)) as {
        columns?: Partial<KanbanColumns>;
        error?: string;
      } | null;
      if (!ordersResponse.ok) {
        throw new Error(payload?.error ?? `Gagal memuat papan (HTTP ${ordersResponse.status})`);
      }
      if (!payload?.columns) {
        throw new Error('Respons /api/admin/orders tidak berisi field columns.');
      }

      // Statistik yang gagal tidak menjatuhkan papan: baris angka punya keadaan
      // sendiri, sedangkan papan tetap harus bisa dipakai.
      let nextStats: AdminStats | null = null;
      if (statsResponse?.ok) {
        const statsPayload = (await statsResponse.json().catch(() => null)) as AdminStats | null;
        nextStats = statsPayload ?? null;
      }

      // Setelah await saja: menyetel state secara sinkron di dalam effect
      // memicu render berantai (lint react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        setColumns({ ...emptyColumns(), ...payload.columns });
        setStats(nextStats);
        setExpired(false);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
      queueMicrotask(() => {
        setColumns(emptyColumns());
        setError(message);
      });
    } finally {
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMoved = useCallback(() => {
    void load();
  }, [load]);

  // Filter sisi klien: satu sumber kebenaran untuk papan dan hitungan kolom.
  // `status` memilih satu kolom saja; pencarian menyaring di dalamnya.
  const visible = useMemo<KanbanColumns>(() => {
    const needle = query.trim().toLocaleLowerCase('id-ID');
    const base = columns ?? emptyColumns();
    const result = emptyColumns();
    for (const key of COLUMN_ORDER) {
      const inScope = status === 'all' || status === key;
      result[key] = inScope
        ? (base[key] ?? []).filter((order) => matchesQuery(order, needle))
        : [];
    }
    return result;
  }, [columns, query, status]);

  const totalAll = columns
    ? COLUMN_ORDER.reduce((sum, key) => sum + (columns[key]?.length ?? 0), 0)
    : 0;
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
            Meja produksi / papan pesanan
          </p>
          <h1 className="mt-1 text-2xl leading-none font-semibold tracking-tight text-ink sm:text-[28px]">
            Papan <span className="font-serif italic">Pesanan</span>
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[12px] leading-relaxed text-ink-soft">
            Pindahkan kartu antar kolom lewat dropdown di kartu. Setiap perubahan tercatat di
            riwayat order dan langsung terlihat customer.
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
            onClick={() => void load()}
            disabled={loading}
            className="min-h-11 border border-ink bg-paper px-3 text-[11.5px] font-semibold text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {loading ? 'Memuat…' : 'Muat ulang'}
          </button>
        </div>
      </div>

      <section aria-labelledby="ringkasan-order" className="mt-3">
        <h2 id="ringkasan-order" className="sr-only">
          Ringkasan order
        </h2>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <StatsRow
            stats={stats}
            loading={loading && !stats}
            error={error}
            onRetry={() => void load()}
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

      {expired ? (
        <div className="mt-3">
          <SessionExpired
            from="/admin"
            detail="Daftar order tidak bisa dimuat karena cookie admin sudah tidak berlaku."
          />
        </div>
      ) : null}

      {loading && !columns ? (
        <div className="mt-4" aria-busy="true">
          <p className="mb-2 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
            Mengambil daftar order…
          </p>
          {skeletonBoard()}
        </div>
      ) : null}

      {!loading && !expired && error ? (
        <div role="alert" className="mt-4 border-[1.5px] border-danger bg-surface p-4">
          <h2 className="text-sm font-semibold text-danger">Papan gagal dimuat</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            {error} Periksa sesi admin Anda lalu muat ulang. Data order tidak berubah.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Coba lagi
            </button>
            <a
              href="/admin/login"
              className="flex min-h-11 items-center border border-rule px-3.5 text-[11.5px] font-medium text-ink transition hover:border-ink"
            >
              Masuk ulang
            </a>
          </div>
        </div>
      ) : null}

      {!loading && !expired && !error && columns ? (
        <div className="mt-4">
          <KanbanBoard
            columns={visible}
            filtered={filtering}
            onMoved={handleMoved}
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