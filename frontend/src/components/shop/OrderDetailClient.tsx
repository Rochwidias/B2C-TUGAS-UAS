'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { CopyButton } from '@/components/shop/CopyButton';
import { DraftPreview } from '@/components/shop/DraftPreview';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';
import { Stepper } from '@/components/shop/Stepper';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  THEME_OPTIONS,
  type Brief,
  type Draft,
  type Order,
  type OrderResponse,
  type PackageOption,
  type ThemeColorKey,
  formatRupiah,
  packageEta,
  packageGuarantee,
  packageSummary,
  readJson,
  statusLabel,
} from '@/components/shop/types';
import { API_BASE } from '@/lib/api';
import { fetchCatalog } from '@/lib/catalog';
import { fetchPackages, packageForOrder } from '@/lib/packages';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: OrderResponse; templateName: string | null };

type PackagesState =
  | { phase: 'loading' }
  | { phase: 'ready'; packages: PackageOption[] }
  | { phase: 'error'; message: string };

// Jeda polling disengaja 15 detik: endpoint track dibatasi 20 permintaan per
// menit, jadi polling agresif akan cepat kena 429.
const POLL_MS = 15_000;

// Status yang mengizinkan permintaan revisi (docs/REDESIGN.md §5).
const REVISABLE: Order['status'][] = ['paid', 'in_progress', 'review'];

// Format durasi ringkas: "3 hari 4 jam", "5 jam 12 menit", "8 menit".
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'baru saja';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} menit`);
  return parts.join(' ') || 'baru saja';
}

// Estimasi berjalan memakai selisih created_at → updated_at (durasi nyata
// sejauh ini), atau "berjalan sejak X" bila belum ada pembaruan.
function elapsedLabel(createdAt: string, updatedAt: string): string {
  const start = new Date(createdAt).getTime();
  const end = new Date(updatedAt).getTime();
  if (Number.isNaN(start)) return 'Waktu mulai tidak diketahui.';
  const since = new Date(createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (Number.isNaN(end) || end <= start) {
    return `Berjalan sejak ${since}.`;
  }
  return `Berjalan sejak ${since} — ${formatDuration(end - start)} tercatat.`;
}

function fmtTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** useParams tidak boleh dipanggil saat prerender di luar Suspense
 *  (CLIENT_HOOK_DYNAMIC), jadi isinya dibungkus di sini. */
export function OrderDetailClient() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main id="konten" className="flex-1 bg-paper">
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6" aria-busy="true">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                Memuat lembar pesanan
              </p>
              <div className="mt-4 h-8 w-56 animate-pulse bg-rule" />
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [pkgState, setPkgState] = useState<PackagesState>({ phase: 'loading' });
  const toast = useToast();

  // Ref data terakhir: dipakai polling untuk membandingkan status/updatedAt
  // sebelum memutuskan apakah perlu toast.
  const dataRef = useRef<OrderResponse | null>(null);
  const templateNameRef = useRef<string | null>(null);
  const aliveRef = useRef(true);

  const applyData = (next: OrderResponse, templateName: string | null) => {
    dataRef.current = next;
    if (templateName !== null) templateNameRef.current = templateName;
    setState({ phase: 'ready', data: next, templateName: templateNameRef.current });
  };

  // Pembaruan diam-diam untuk polling dan aksi (revisi/brief): hanya menampilkan
  // toast bila status atau updated_at benar-benar berubah.
  const refresh = useCallback(
    async (silent = false) => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`).then((r) =>
          readJson<OrderResponse>(r),
        );
        if (!aliveRef.current || !res.ok) return;
        const prev = dataRef.current;
        if (!prev) return;
        const next = res.data;
        const statusChanged = prev.order.status !== next.order.status;
        const timeChanged = prev.order.updated_at !== next.order.updated_at;
        if (!silent && (statusChanged || timeChanged)) {
          if (statusChanged) {
            toast.info(
              'Status pesanan diperbarui',
              `${statusLabel(prev.order.status)} → ${statusLabel(next.order.status)}`,
            );
          } else {
            toast.info(
              'Pembaruan pesanan masuk',
              `Diperbarui ${fmtTime(next.order.updated_at)} — silakan lihat timeline.`,
            );
          }
        }
        applyData(next, null);
      } catch {
        // Polling gagal: biarkan data terakhir tampil, jangan menimpa state
        // siap dengan layar error karena satu gangguan jaringan.
      }
    },
    [orderId, toast],
  );

  // Polling progres ±15 detik, dijeda saat tab tersembunyi supaya tidak
  // membuang jatah rate limit track.
  // Pemuatan awal memakai rantai promise supaya tidak ada setState sinkron di
  // dalam effect (react-hooks/set-state-in-effect); polling dan aksi memakai
  // refresh() dari callback event.
  useEffect(() => {
    aliveRef.current = true;
    Promise.all([
      fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`).then((r) =>
        readJson<OrderResponse>(r),
      ),
      fetchCatalog(),
      fetchPackages(),
    ])
      .then(([orderRes, templates, pkgResult]) => {
        if (!aliveRef.current) return;
        if (pkgResult.ok) setPkgState({ phase: 'ready', packages: pkgResult.packages });
        else setPkgState({ phase: 'error', message: pkgResult.error ?? 'Daftar paket tidak bisa dimuat.' });
        if (!orderRes.ok) {
          setState({ phase: 'error', message: orderRes.error });
          return;
        }
        const templateName =
          templates.find((t) => t.id === orderRes.data.order.template_id)?.name ?? null;
        applyData(orderRes.data, templateName);
      })
      .catch(() => {
        if (!aliveRef.current) return;
        setState({ phase: 'error', message: 'Tidak bisa terhubung ke server.' });
      });
    return () => {
      aliveRef.current = false;
    };
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // URL halaman ini dibaca setelah mount agar cocok dengan URL browser
  // (hindari hydration mismatch karena URL server bisa berbeda).
  const [pageUrl, setPageUrl] = useState('');
  useEffect(() => {
    const id = requestAnimationFrame(() => setPageUrl(window.location.href));
    return () => cancelAnimationFrame(id);
  }, []);

  if (state.phase === 'loading') {
    return (
      <>
        <Header />
        <main id="konten" className="flex-1 bg-paper">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16" aria-busy="true">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              Memuat lembar pesanan
            </p>
            <div className="mt-4 h-8 w-64 animate-pulse bg-rule" />
            <div className="mt-3 h-3 w-40 animate-pulse bg-rule" />
            <div className="mt-8 h-48 border border-rule bg-surface" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (state.phase === 'error') {
    return (
      <>
        <Header />
        <main id="konten" className="flex-1 bg-paper">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <div role="alert" className="border border-danger bg-surface p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                Pesanan tidak bisa dimuat
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug">{state.message}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                Periksa kembali tautan yang Anda buka, atau cari ulang memakai nomor pesanan.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink"
                >
                  Muat ulang
                </button>
                <Link
                  href="/orders"
                  className="inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
                >
                  Lacak dengan nomor pesanan
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { order, logs } = state.data;
  const completed = order.status === 'completed';
  const quota = order.quota ?? null;
  const draftRows = collectDrafts(state.data);
  const remaining =
    typeof state.data.remaining === 'number'
      ? state.data.remaining
      : quota !== null
        ? Math.max(quota - draftRows.length, 0)
        : null;
  const previewContent: Draft | null =
    state.data.draft?.ai_generated_content ?? draftRows.find((row) => row.content)?.content ?? null;
  const canOpenLive = Boolean(completed && order.live_website_url);
  const canDownload = Boolean(completed && order.download_zip_url);
  const canExport = Boolean(completed && previewContent);
  const elapsed = elapsedLabel(order.created_at, order.updated_at);
  const pkg = pkgState.phase === 'ready' ? packageForOrder(pkgState.packages, order) : null;

  return (
    <>
      <Header />
      <main id="konten" className="flex-1 bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/orders"
            className="inline-flex min-h-11 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft hover:text-ink"
          >
            <span aria-hidden="true">&larr;</span> Lacak pesanan lain
          </Link>

          <header className="mt-2 flex flex-col gap-5 border-b border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[30px] font-semibold leading-[1.02] tracking-tight sm:text-[40px]">
                Poster untuk {order.contact_name}
              </h1>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                {state.templateName ? `Contoh ${state.templateName} / ` : ''}
                Paket {order.package_name} / {formatRupiah(order.total_price)} / pembayaran{' '}
                {order.payment_status === 'paid' ? 'lunas' : 'belum lunas'}
                {quota !== null ? ` / kuota ${quota} poster` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-ink px-2 py-1 font-mono text-sm">
                  {order.order_number}
                </span>
                <CopyButton value={order.order_number} label="Salin nomor order" />
              </div>
              <CopyButton value={pageUrl} label="Salin tautan" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                {statusLabel(order.status)}
              </span>
            </div>
          </header>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="flex min-w-0 items-start gap-2 border border-rule bg-surface px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 bg-accent" />
              <span>{elapsed}</span>
            </p>
            <p
              role="status"
              className="flex shrink-0 items-center gap-2 border border-rule bg-surface px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft"
            >
              <span aria-hidden="true" className="size-1.5 animate-pulse bg-ok motion-reduce:animate-none" />
              Notifikasi progres aktif / tiap 15 detik
            </p>
          </div>

          <section className="mt-8" aria-label="Progres pesanan">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-rule pb-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Peta pengerjaan
              </h2>
              <span className="font-mono text-[10px] text-ink-soft">5 tahap</span>
            </div>
            <Stepper status={order.status} logs={logs} />
          </section>

          {/* Estimasi & garansi sesuai paket: transparansi sebelum dan sesudah
              bayar (docs/REDESIGN.md §2). */}
          <section className="mt-10 border-t border-ink pt-6" aria-label="Estimasi dan garansi">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-rule pb-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Estimasi &amp; garansi paket
              </h2>
              <span className="font-mono text-[10px] text-ink-soft">
                {pkg ? pkg.name : order.package_name}
              </span>
            </div>

            {pkgState.phase === 'loading' && (
              <div aria-busy="true" className="border border-rule bg-surface p-4">
                <div className="h-4 w-40 animate-pulse bg-rule" aria-hidden="true" />
                <div className="mt-3 h-3 w-2/3 animate-pulse bg-rule" aria-hidden="true" />
              </div>
            )}

            {pkgState.phase === 'error' && (
              <div role="alert" className="border border-danger bg-surface p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                  Rincian paket belum bisa dimuat
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  {pkgState.message} Pesanan Anda tetap tercatat dengan paket{' '}
                  <span className="font-mono text-ink">{order.package_name}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPkgState({ phase: 'loading' });
                    void fetchPackages().then((result) => {
                      if (!aliveRef.current) return;
                      if (result.ok) setPkgState({ phase: 'ready', packages: result.packages });
                      else
                        setPkgState({
                          phase: 'error',
                          message: result.error ?? 'Daftar paket tidak bisa dimuat.',
                        });
                    });
                  }}
                  className="mt-3 inline-flex min-h-11 items-center border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {pkgState.phase === 'ready' && pkg && (
              <dl className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-4">
                <div className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Harga
                  </dt>
                  <dd className="mt-1.5 font-mono text-[15px]">
                    {formatRupiah(order.total_price || pkg.price)}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Estimasi
                  </dt>
                  <dd className="mt-1.5 font-mono text-[13px]">{packageEta(pkg) || '—'}</dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Garansi
                  </dt>
                  <dd className="mt-1.5 font-mono text-[13px]">{packageGuarantee(pkg) || '—'}</dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Kuota
                  </dt>
                  <dd className="mt-1.5 font-mono text-[13px]">
                    {typeof remaining === 'number'
                      ? `sisa ${remaining} / ${quota ?? pkg.quota}`
                      : packageSummary(pkg)}
                  </dd>
                </div>
              </dl>
            )}

            {pkgState.phase === 'ready' && !pkg && (
              <p className="border border-rule bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                Paket <span className="font-mono text-ink">{order.package_name}</span> belum cocok
                dengan daftar paket di server, jadi estimasi dan garansinya tidak bisa ditampilkan
                sekarang.
              </p>
            )}
          </section>

          {/* Kuota & daftar draft */}
          <section className="mt-10 border-t border-rule pt-6" aria-label="Kuota dan draft poster">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Draft poster dalam kuota
              </h2>
              <span className="font-mono text-[10px] text-ink-soft">
                {typeof remaining === 'number' ? `sisa ${remaining} brief` : `${draftRows.length} draft`}
              </span>
            </div>

            {draftRows.length === 0 ? (
              <EmptyState
                icon="—"
                title="Belum ada draft terlampir"
                description="Draft dibuat saat brief pertama dikirim. Bila pesanan ini dibuat sebelum fitur draft aktif, tidak ada pratinjau yang bisa ditampilkan."
              />
            ) : (
              <ol className="flex flex-col divide-y divide-rule border-t border-rule">
                {draftRows.map((row, index) => (
                  <li key={row.id} className="grid gap-2 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                    <div className="font-mono text-[11px] text-ink-soft">
                      <span className="block uppercase tracking-[0.12em]">Draft {index + 1}</span>
                      <span className="mt-1 block">{fmtTime(row.generatedAt)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{row.brief?.brandName ?? 'Brief tanpa nama'}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                        {row.brief?.tagline ?? 'Tagline tidak tersimpan pada baris ini.'}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-ink-soft">
                        {row.content ? `draftId ${row.id}` : `id ${row.id}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Aksi pelanggan: revisi + tambah brief dalam kuota */}
          <section className="mt-10 border-t border-ink pt-6" aria-label="Permintaan perubahan">
            <div className="grid gap-6 lg:grid-cols-2">
              <RevisionForm
                orderId={order.id}
                orderNumber={order.order_number}
                allowed={REVISABLE.includes(order.status)}
                statusLabelCurrent={statusLabel(order.status)}
                onDone={() => void refresh(true)}
              />
              <BriefForm
                orderId={order.id}
                orderNumber={order.order_number}
                templateId={order.template_id}
                remaining={remaining}
                onDone={() => void refresh(true)}
              />
            </div>
          </section>

          <section className="mt-10 border-t border-rule pt-6" aria-label="Serah terima">
            <div className="grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:gap-8">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Catatan editor
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed">
                  {order.dev_note
                    ? `“${order.dev_note}”`
                    : 'Belum ada catatan. Editor menuliskannya saat pesanan mulai dikerjakan.'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Berkas &amp; tautan
                </h2>
                <a
                  href={canOpenLive && order.live_website_url ? order.live_website_url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!canOpenLive}
                  className={[
                    'flex min-h-12 items-center justify-between gap-3 border px-4 text-[13px] font-semibold',
                    canOpenLive
                      ? 'border-ink bg-accent text-accent-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]'
                      : 'cursor-not-allowed border-rule bg-paper text-ink-soft',
                  ].join(' ')}
                >
                  <span>Buka poster live</span>
                  <span className="font-mono text-[10px]">{canOpenLive ? 'buka' : 'terkunci'}</span>
                </a>
                <a
                  href={canDownload && order.download_zip_url ? order.download_zip_url : undefined}
                  aria-disabled={!canDownload}
                  className={[
                    'flex min-h-12 items-center justify-between gap-3 border px-4 text-[13px] font-semibold',
                    canDownload
                      ? 'border-ink bg-surface hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]'
                      : 'cursor-not-allowed border-rule bg-paper text-ink-soft',
                  ].join(' ')}
                >
                  <span>Unduh berkas poster</span>
                  <span className="font-mono text-[10px]">{canDownload ? 'zip' : 'terkunci'}</span>
                </a>
                <a
                  href={
                    canExport && state.data.draft
                      ? `${API_BASE}/api/export/${encodeURIComponent(state.data.draft.id)}`
                      : undefined
                  }
                  aria-disabled={!canExport}
                  download
                  className={[
                    'flex min-h-12 items-center justify-between gap-3 border px-4 text-[13px] font-semibold',
                    canExport
                      ? 'border-rule bg-surface hover:-translate-y-0.5 hover:border-ink hover:shadow-[4px_4px_0_0_var(--ink)]'
                      : 'cursor-not-allowed border-rule bg-paper text-ink-soft',
                  ].join(' ')}
                >
                  <span>Export poster (HTML)</span>
                  <span className="font-mono text-[10px]">{canExport ? 'html' : 'terkunci'}</span>
                </a>
              </div>
            </div>

            {!completed && (
              <p className="mt-5 border-t border-rule pt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                Buka poster live, unduhan berkas, dan export terbuka setelah status pesanan menjadi
                Selesai.
              </p>
            )}
          </section>

          <section className="mt-10 border-t border-rule pt-6" aria-label="Data kontak pemesan">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              Kontak pemesan
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-3">
              {[
                { label: 'Nama', value: order.contact_name },
                { label: 'WhatsApp', value: order.contact_whatsapp },
                { label: 'Email', value: order.contact_email },
              ].map((c) => (
                <div key={c.label} className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    {c.label}
                  </dt>
                  <dd className="mt-1.5 break-words text-[13px]">{c.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {previewContent ? (
            <section className="mt-10 border-t border-ink pt-6" aria-label="Pratinjau draft poster">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Pratinjau draft poster
                </h2>
                <span className="font-mono text-[10px] text-ink-soft">
                  draftId {state.data.draft?.id ?? draftRows[0]?.id}
                </span>
              </div>
              <DraftPreview draft={previewContent} />
            </section>
          ) : (
            <section className="mt-10 border-t border-rule pt-6" aria-label="Draft belum tersedia">
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Pratinjau draft poster
              </h2>
              <EmptyState
                icon="—"
                title="Draft belum terlampir pada pesanan ini"
                description="Draft dibuat saat brief dikirim. Bila pesanan ini dibuat sebelum fitur draft aktif, tidak ada pratinjau yang bisa ditampilkan. Hubungi editor bila Anda butuh salinan brief."
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Satu baris draft untuk daftar kuota: memakai `drafts` bila tersedia, dengan
 *  fallback ke `draft` tunggal pada response lama. */
function collectDrafts(data: OrderResponse): {
  id: string;
  generatedAt: string | null;
  brief: Brief | null;
  content: Draft | null;
}[] {
  const rows: { id: string; generatedAt: string | null; brief: Brief | null; content: Draft | null }[] = [];
  (data.drafts ?? []).forEach((item) => {
    rows.push({
      id: item.id,
      generatedAt: item.generated_at ?? null,
      brief: (item.input_prompt_data as Brief | null) ?? null,
      content: item.ai_generated_content ?? null,
    });
  });
  if (data.draft && !rows.some((row) => row.id === data.draft!.id)) {
    rows.push({
      id: data.draft.id,
      generatedAt: null,
      brief: null,
      content: data.draft.ai_generated_content ?? null,
    });
  }
  return rows;
}

const fieldClass =
  'w-full min-h-11 border border-rule bg-paper px-3 py-2 text-sm text-ink transition-colors placeholder:text-ink-soft/70 focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const labelClass = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft';

/** Form "Minta Revisi": POST /api/orders/[id]/revision (docs/REDESIGN.md §5). */
function RevisionForm({
  orderId,
  orderNumber,
  allowed,
  statusLabelCurrent,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  allowed: boolean;
  statusLabelCurrent: string;
  onDone: () => void;
}) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<{ phase: 'idle' | 'loading' | 'error'; message: string }>({
    phase: 'idle',
    message: '',
  });
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 10) {
      setState({ phase: 'error', message: 'Tuliskan minimal 10 karakter agar revisi jelas.' });
      return;
    }
    setState({ phase: 'loading', message: '' });
    try {
      // Path memakai id order (konsisten dengan GET /api/orders/[id]);
      // validasi nomor order terjadi lewat body, sesuai docs/REDESIGN.md §5.
      const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, message: text }),
      });
      const result = await readJson<{ order?: Order }>(res);
      if (!result.ok) {
        setState({ phase: 'error', message: result.error });
        toast.error('Revisi gagal dikirim', result.error);
        return;
      }
      setMessage('');
      setState({ phase: 'idle', message: '' });
      toast.success('Permintaan revisi terkirim', 'Catatan muncul di timeline pesanan ini.');
      onDone();
    } catch {
      setState({ phase: 'error', message: 'Jaringan terputus. Coba beberapa saat lagi.' });
      toast.error('Tidak bisa terhubung', 'Periksa koneksi Anda lalu coba lagi.');
    }
  }

  return (
    <form onSubmit={submit} className="border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
        <h3 className="text-[15px] font-semibold">Minta Revisi</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Garansi paket
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {allowed
            ? 'Tuliskan perubahan yang diminta. Status tidak berubah, catatan masuk ke timeline.'
            : `Permintaan revisi hanya bisa dikirim saat status ${statusLabelCurrent}.`}
        </p>
        <div>
          <label htmlFor="revision-message" className={labelClass}>
            Catatan revisi
          </label>
          <textarea
            id="revision-message"
            name="revisionMessage"
            rows={3}
            required
            disabled={!allowed || state.phase === 'loading'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-describedby="revision-hint"
            className={`${fieldClass} min-h-[96px] resize-y disabled:cursor-not-allowed disabled:opacity-60`}
            placeholder="Contoh: headline dibuat lebih pendek, logo diperbesar."
          />
          <p id="revision-hint" className="mt-1.5 font-mono text-[11px] text-ink-soft">
            Minimal 10 karakter.
          </p>
        </div>

        {state.phase === 'error' && (
          <p role="alert" className="border border-danger bg-paper px-3 py-2 text-[12px] text-danger">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!allowed || state.phase === 'loading'}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-surface px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper disabled:text-ink-soft"
        >
          {state.phase === 'loading' ? 'Mengirim revisi…' : 'Kirim permintaan revisi'}
        </button>
      </div>
    </form>
  );
}

/** Form "Tambah brief poster": POST /api/orders/[id]/briefs, hanya bila
 *  sisa kuota > 0 (docs/REDESIGN.md §5). */
function BriefForm({
  orderId,
  orderNumber,
  templateId,
  remaining,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  templateId: string;
  remaining: number | null;
  onDone: () => void;
}) {
  const [brief, setBrief] = useState<Brief>({
    templateId,
    brandName: '',
    tagline: '',
    description: '',
    themeColor: 'violet',
    ctaText: '',
    toneOfVoice: 'Profesional',
  });
  const [state, setState] = useState<{ phase: 'idle' | 'loading' | 'error'; message: string }>({
    phase: 'idle',
    message: '',
  });
  const toast = useToast();

  const quotaLeft = remaining !== null && remaining > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quotaLeft) return;
    const trimmed = { ...brief, description: brief.description.trim(), brandName: brief.brandName.trim() };
    if (trimmed.brandName.length < 2 || trimmed.tagline.trim().length < 2 || trimmed.description.length < 20) {
      setState({
        phase: 'error',
        message: 'Lengkapi nama brand, tagline, dan deskripsi (minimal 20 karakter).',
      });
      return;
    }
    setState({ phase: 'loading', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, brief: trimmed }),
      });
      const result = await readJson<{ order?: Order }>(res);
      if (!result.ok) {
        setState({ phase: 'error', message: result.error });
        toast.error('Brief tambahan gagal dikirim', result.error);
        return;
      }
      setBrief((prev) => ({ ...prev, brandName: '', tagline: '', description: '', ctaText: '' }));
      setState({ phase: 'idle', message: '' });
      toast.success('Brief poster tambahan terkirim', 'Draft baru dibuat dalam kuota paket.');
      onDone();
    } catch {
      setState({ phase: 'error', message: 'Jaringan terputus. Coba beberapa saat lagi.' });
      toast.error('Tidak bisa terhubung', 'Periksa koneksi Anda lalu coba lagi.');
    }
  }

  return (
    <form onSubmit={submit} className="border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
        <h3 className="text-[15px] font-semibold">Tambah brief poster</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          {remaining === null ? 'kuota' : `sisa ${remaining}`}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {quotaLeft
            ? `Anda masih punya ${remaining} slot poster pada paket ini. Kirim brief baru untuk poster berikutnya.`
            : 'Kuota paket sudah habis. Pilih paket baru bila ingin menambah poster.'}
        </p>

        <div>
          <label htmlFor="brief2-brand" className={labelClass}>
            Nama brand / bisnis
          </label>
          <input
            id="brief2-brand"
            name="brandName"
            type="text"
            required
            disabled={!quotaLeft || state.phase === 'loading'}
            value={brief.brandName}
            onChange={(e) => setBrief({ ...brief, brandName: e.target.value })}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
            placeholder="Contoh: Kopi Senja Utama"
          />
        </div>

        <div>
          <label htmlFor="brief2-tagline" className={labelClass}>
            Tagline singkat
          </label>
          <input
            id="brief2-tagline"
            name="tagline"
            type="text"
            required
            disabled={!quotaLeft || state.phase === 'loading'}
            value={brief.tagline}
            onChange={(e) => setBrief({ ...brief, tagline: e.target.value })}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
            placeholder="Contoh: Rasa Otentik Kopi Nusantara"
          />
        </div>

        <div>
          <label htmlFor="brief2-desc" className={labelClass}>
            Deskripsi &amp; nilai tambah
          </label>
          <textarea
            id="brief2-desc"
            name="description"
            rows={3}
            required
            disabled={!quotaLeft || state.phase === 'loading'}
            value={brief.description}
            onChange={(e) => setBrief({ ...brief, description: e.target.value })}
            className={`${fieldClass} min-h-[96px] resize-y disabled:cursor-not-allowed disabled:opacity-60`}
            placeholder="Ceritakan promo, produk, atau layanan yang ingin ditonjolkan."
          />
          <p className="mt-1.5 font-mono text-[11px] text-ink-soft">Minimal 20 karakter.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="brief2-color" className={labelClass}>
              Warna aksen
            </label>
            <select
              id="brief2-color"
              name="themeColor"
              value={brief.themeColor}
              disabled={!quotaLeft || state.phase === 'loading'}
              onChange={(e) => setBrief({ ...brief, themeColor: e.target.value as ThemeColorKey })}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="brief2-cta" className={labelClass}>
              Teks tombol utama
            </label>
            <input
              id="brief2-cta"
              name="ctaText"
              type="text"
              required
              disabled={!quotaLeft || state.phase === 'loading'}
              value={brief.ctaText}
              onChange={(e) => setBrief({ ...brief, ctaText: e.target.value })}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder="Contoh: Pesan Sekarang"
            />
          </div>
        </div>

        <div>
          <label htmlFor="brief2-tone" className={labelClass}>
            Nada penulisan
          </label>
          <select
            id="brief2-tone"
            name="toneOfVoice"
            value={brief.toneOfVoice}
            disabled={!quotaLeft || state.phase === 'loading'}
            onChange={(e) => setBrief({ ...brief, toneOfVoice: e.target.value })}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {['Profesional', 'Santai & ramah', 'Energik & muda', 'Elegan & premium'].map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </div>

        {state.phase === 'error' && (
          <p role="alert" className="border border-danger bg-paper px-3 py-2 text-[12px] text-danger">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!quotaLeft || state.phase === 'loading'}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)] disabled:translate-y-0 disabled:border-rule disabled:bg-paper disabled:text-ink-soft disabled:shadow-none"
        >
          {state.phase === 'loading' ? 'Mengirim brief…' : 'Kirim brief poster tambahan'}
        </button>
      </div>
    </form>
  );
}