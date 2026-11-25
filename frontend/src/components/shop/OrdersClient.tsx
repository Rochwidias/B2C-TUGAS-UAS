'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';
import { LastOrderHint } from '@/components/shop/LastOrderHint';
import { Stepper } from '@/components/shop/Stepper';
import { WhatsAppChat } from '@/components/shop/WhatsAppChat';
import {
  STATUS_STEPS,
  formatRupiah,
  statusLabel,
} from '@/components/shop/types';
import { EmptyBlock } from '@/components/ui/EmptyBlock';
import { CATALOG_TEMPLATES } from '@/lib/catalog';
import {
  ORDER_NUMBER_PATTERN,
  ORDER_STORE_KEY,
  RECENT_EVENT,
  ensureDemoOrder,
  getOrderByNumber,
  remainingOf,
  type StoredOrder,
} from '@/lib/orders-store';

type TrackState =
  | { phase: 'idle' }
  | { phase: 'error'; message: string }
  | { phase: 'found'; order: StoredOrder; templateName: string | null };

// --- store eksternal untuk useSyncExternalStore ---------------------------
// Server dan render pertama klien harus melihat snapshot yang sama (kosong),
// supaya HTML tidak berbeda dan React tidak melempar hydration mismatch.

const EMPTY_SNAPSHOT = '[]';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Mode privat / storage diblokir: perlakukan sebagai kosong.
    return null;
  }
}

// Daftar pesanan dibaca dari store lokal: pembaruan datang dari event
// `craftai:recent-changed` (dipicu store setiap persist) dan dari event
// `storage` (perubahan dari tab lain).
function subscribeStore(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(RECENT_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(RECENT_EVENT, onChange);
  };
}

function getStoreSnapshot(): string {
  return safeGetItem(ORDER_STORE_KEY) ?? EMPTY_SNAPSHOT;
}

function getEmptySnapshot(): string {
  return EMPTY_SNAPSHOT;
}

function parseOrders(raw: string): StoredOrder[] {
  if (raw === EMPTY_SNAPSHOT) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const orders: StoredOrder[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const order = entry as Partial<StoredOrder>;
      if (typeof order.id !== 'string' || typeof order.order_number !== 'string') continue;
      orders.push({
        ...(order as StoredOrder),
        brief: order.brief ?? null,
        logs: Array.isArray(order.logs) ? order.logs : [],
        drafts: Array.isArray(order.drafts) ? order.drafts : [],
      });
    }
    return orders;
  } catch {
    return [];
  }
}

function templateNameOf(order: StoredOrder): string | null {
  return CATALOG_TEMPLATES.find((t) => t.id === order.template_id)?.name ?? null;
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  ...STATUS_STEPS.map((s) => ({ key: s.key, label: s.label })),
];

function TrackForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [number, setNumber] = useState(search.get('number') ?? '');
  const [state, setState] = useState<TrackState>({ phase: 'idle' });

  // Satu jalur pencarian dipakai tombol submit maupun lookup otomatis dari
  // parameter ?number= (docs/REDESIGN.md §12). Sumber data = store lokal.
  const runLookup = (rawValue: string, updateUrl: boolean) => {
    const value = rawValue.trim().toUpperCase();
    if (!ORDER_NUMBER_PATTERN.test(value)) {
      setState({
        phase: 'error',
        message: 'Format nomor pesanan adalah UK-ORD-XXXX, contoh: UK-ORD-8812.',
      });
      return;
    }
    // Benarkan pesanan demo UK-ORD-8812 bila penyimpanan masih kosong.
    ensureDemoOrder();
    const order = getOrderByNumber(value);
    if (!order) {
      setState({
        phase: 'error',
        message: `Nomor pesanan ${value} tidak ditemukan. Coba nomor demo UK-ORD-8812.`,
      });
      return;
    }
    setState({ phase: 'found', order, templateName: templateNameOf(order) });
    if (updateUrl) router.replace(`/orders?number=${encodeURIComponent(value)}`, { scroll: false });
  };

  function lookup(e: { preventDefault: () => void }) {
    e.preventDefault();
    runLookup(number, true);
  }

  // Auto-lookup: membuka /orders?number=UK-ORD-XXXX langsung menampilkan hasil
  // pencarian tanpa menekan tombol. Hanya dijalankan sekali per mount supaya
  // mengetik ulang tidak memicu pencarian ganda.
  const autoRan = useRef(false);
  useEffect(() => {
    const value = (search.get('number') ?? '').trim();
    if (!value || autoRan.current) return;
    autoRan.current = true;
    setNumber(value.toUpperCase());
    runLookup(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Dipakai tombol "Lanjutkan pesanan terakhir": mengisi nomor tanpa langsung
  // mencari, supaya pengguna tetap melihat apa yang akan dilacak.
  const useLastOrder = (lastNumber: string) => {
    setNumber(lastNumber);
    setState({ phase: 'idle' });
    requestAnimationFrame(() => document.getElementById('order-number')?.focus());
  };

  return (
    <>
      <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="order-number"
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft"
          >
            Nomor pesanan
          </label>
          <input
            id="order-number"
            name="orderNumber"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="UK-ORD-8812"
            autoComplete="off"
            className="min-h-12 w-full border border-rule bg-surface px-3 font-mono text-sm uppercase text-ink transition-colors placeholder:text-ink-soft/70 focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border border-ink bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
        >
          <span>Lacak pesanan</span>
        </button>
      </form>

      <div className="mt-8" aria-live="polite">
        {state.phase === 'idle' && (
          <div className="border border-dashed border-rule bg-surface p-6">
            <p className="text-[15px] font-semibold leading-snug">Belum ada pencarian</p>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-soft">
              Nomor pesanan tampil di layar setelah pesanan dikirim, dan pesan WhatsApp terisi
              otomatis saat Anda membukanya. Untuk mencoba alurnya, pakai nomor demo{' '}
              <span className="font-mono text-ink">UK-ORD-8812</span>.
            </p>
            <div className="mt-5 border-t border-rule pt-4">
              <LastOrderHint onUse={useLastOrder} />
            </div>
          </div>
        )}

        {state.phase === 'error' && (
          <div role="alert" className="border border-danger bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-danger">
              Pencarian gagal
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink">{state.message}</p>
            <button
              type="button"
              onClick={() => setState({ phase: 'idle' })}
              className="mt-4 inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
            >
              Coba nomor lain
            </button>
          </div>
        )}

        {state.phase === 'found' && (
          <div className="border border-rule bg-surface" data-testid="track-result">
            <div className="flex flex-col gap-4 border-b border-rule p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-ink-soft">{state.order.order_number}</p>
                <h2 className="mt-2 break-words text-[22px] font-semibold leading-snug tracking-tight">
                  Poster untuk {state.order.contact_name}
                </h2>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
                  {state.templateName ? `Contoh ${state.templateName} / ` : 'Contoh terdaftar / '}
                  Paket {state.order.package_name} / {formatRupiah(state.order.total_price)} / dibuat{' '}
                  {new Date(state.order.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className="w-fit border border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                  {statusLabel(state.order.status)}
                </span>
                <span className="w-fit font-mono text-[10px] text-ink-soft">
                  Sisa kuota: {remainingOf(state.order)} poster
                </span>
                <WhatsAppChat
                  status={state.order.status}
                  orderNumber={state.order.order_number}
                />
              </div>
            </div>

            <div className="p-5">
              <Stepper status={state.order.status} logs={state.order.logs} />
            </div>

            <div className="flex flex-col gap-3 border-t border-rule p-5 sm:flex-row sm:items-center">
              <Link
                href={`/orders/${state.order.id}`}
                className="inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 text-[13px] font-semibold text-paper transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--accent)]"
              >
                Lihat detail pesanan
              </Link>
              <button
                type="button"
                onClick={() => {
                  setNumber('');
                  setState({ phase: 'idle' });
                  router.replace('/orders', { scroll: false });
                }}
                className="inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
              >
                Lacak nomor lain
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Daftar pesanan yang tersimpan di perangkat ini (dari store lokal) + filter status.
function TrackedOrders({ items }: { items: StoredOrder[] }) {
  const [filter, setFilter] = useState('semua');

  const visible = useMemo(
    () => (filter === 'semua' ? items : items.filter((it) => it.status === filter)),
    [items, filter],
  );

  if (items.length === 0) return null;

  const activeLabel = FILTERS.find((f) => f.key === filter)?.label ?? 'Semua';

  return (
    <div className="mt-10 border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          Pesanan yang tersimpan di perangkat ini
        </p>
        <span className="font-mono text-[10px] text-ink-soft">
          {visible.length} dari {items.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter status pesanan">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={[
                'inline-flex min-h-11 items-center justify-center border px-3 text-[12px] font-medium transition-colors',
                active ? 'border-ink bg-ink text-paper' : 'border-rule bg-surface text-ink hover:border-ink',
              ].join(' ')}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyBlock
            title={`Tidak ada pesanan berstatus ${activeLabel.toLowerCase()}`}
            description={`Anda punya ${items.length} pesanan yang tersimpan di perangkat ini, tetapi tidak ada yang berstatus ${activeLabel.toLowerCase()} saat ini. Status bisa berubah setelah halaman dimuat ulang.`}
            actionLabel="Tampilkan semua"
            onAction={() => setFilter('semua')}
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {visible.map((it) => (
            <li key={it.id}>
              <Link
                href={`/orders/${it.id}`}
                className="flex min-h-16 flex-col gap-1 border border-rule bg-surface p-4 transition-colors hover:border-ink sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                    {it.order_number}
                  </span>
                  <span className="mt-1 block truncate text-[14px] font-semibold">
                    {it.contact_name ? `Poster untuk ${it.contact_name}` : 'Pesanan tanpa nama kontak'}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-ink-soft">
                    {[
                      templateNameOf(it),
                      it.package_name ? `Paket ${it.package_name}` : null,
                      typeof it.total_price === 'number' ? formatRupiah(it.total_price) : null,
                    ]
                      .filter(Boolean)
                      .join(' / ') || 'Detail paket tidak tersimpan'}
                  </span>
                </span>
                <span className="w-fit shrink-0 border border-rule px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                  {statusLabel(it.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrdersClient() {
  // Daftar dibaca langsung dari store lokal lewat useSyncExternalStore: server
  // dan render pertama klien sama-sama melihat snapshot kosong, sehingga
  // hydration tidak mismatch. Pembaruan dipicu RECENT_EVENT dan event `storage`.
  const rawStore = useSyncExternalStore(subscribeStore, getStoreSnapshot, getEmptySnapshot);
  const orders = useMemo(() => parseOrders(rawStore), [rawStore]);

  return (
    <>
      <Header />
      <main id="konten" className="flex-1 bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            Meja lacak / tanpa login
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1] tracking-tight sm:text-[48px]">
            Lacak posisi pesanan poster Anda
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Cukup nomor pesanan. Anda akan melihat ringkasan paket, sisa kuota, tahap pengerjaan,
            dan status serah terima tanpa perlu membuat akun. Membuka tautan dengan parameter
            <span className="font-mono text-ink"> ?number= </span> langsung mencari otomatis.
          </p>

          <div className="mt-10 border-t border-ink pt-8">
            <Suspense fallback={<p className="text-[13px] text-ink-soft">Memuat formulir pelacakan...</p>}>
              <TrackForm />
            </Suspense>
            <TrackedOrders items={orders} />
          </div>

          <p className="mt-10 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-rule pt-4 font-mono text-[11px] text-ink-soft">
            <span className="border border-rule px-1.5 py-0.5 uppercase tracking-wide">Belum punya order</span>
            <Link href="/#katalog" className="inline-flex min-h-11 items-center text-ink underline">
              Lihat contoh poster
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
