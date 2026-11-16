'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CopyButton } from '@/components/shop/CopyButton';
import { DraftPreview } from '@/components/shop/DraftPreview';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';
import { Stepper } from '@/components/shop/Stepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { type OrderResponse, formatRupiah, readJson, statusLabel } from '@/components/shop/types';
import { API_BASE } from '@/lib/api';
import { fetchCatalog } from '@/lib/catalog';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: OrderResponse; templateName: string | null };

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

// Estimasi waktu pengerjaan memakai selisih created_at → updated_at (durasi
// nyata sejauh ini), atau "berjalan sejak X" bila belum ada pembaruan.
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

// useParams tidak boleh dipanggil saat prerender di luar Suspense
// (CLIENT_HOOK_DYNAMIC), jadi isinya dibungkus di sini.
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

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`).then((r) => readJson<OrderResponse>(r)),
      fetchCatalog(),
    ])
      .then(([orderRes, templates]) => {
        if (!alive) return;
        if (!orderRes.ok) {
          setState({ phase: 'error', message: orderRes.error });
          return;
        }
        const templateName =
          templates.find((t) => t.id === orderRes.data.order.template_id)?.name ?? null;
        setState({ phase: 'ready', data: orderRes.data, templateName });
      })
      .catch(() => alive && setState({ phase: 'error', message: 'Tidak bisa terhubung ke server.' }));
    return () => {
      alive = false;
    };
  }, [orderId]);

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

  const { order, draft, logs } = state.data;
  const completed = order.status === 'completed';
  const draftContent = draft?.ai_generated_content ?? null;
  const canOpenLive = Boolean(completed && order.live_website_url);
  const canDownload = Boolean(completed && order.download_zip_url);
  const elapsed = elapsedLabel(order.created_at, order.updated_at);

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
                Website {order.contact_name}
              </h1>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                {state.templateName ? `Template ${state.templateName} / ` : ''}
                Paket {order.package_name} / {formatRupiah(order.total_price)} / pembayaran{' '}
                {order.payment_status === 'paid' ? 'lunas' : 'belum lunas'}
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

          <p className="mt-4 flex items-start gap-2 border border-rule bg-surface px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-soft">
            <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 bg-accent" />
            <span>{elapsed}</span>
          </p>

          <section className="mt-8" aria-label="Progres pesanan">
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-rule pb-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Peta pengerjaan
              </h2>
              <span className="font-mono text-[10px] text-ink-soft">5 tahap</span>
            </div>
            <Stepper status={order.status} logs={logs} />
          </section>

          <section className="mt-10 border-t border-ink pt-6" aria-label="Serah terima">
            <div className="grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:gap-8">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Catatan developer
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed">
                  {order.dev_note
                    ? `“${order.dev_note}”`
                    : 'Belum ada catatan. Developer menuliskannya saat pesanan mulai dikerjakan.'}
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
                  <span>Akses URL live</span>
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
                  <span>Unduh source code</span>
                  <span className="font-mono text-[10px]">{canDownload ? 'zip' : 'terkunci'}</span>
                </a>
                <a
                  href={draftContent ? `${API_BASE}/api/export/${encodeURIComponent(draft?.id ?? '')}` : undefined}
                  aria-disabled={!draftContent}
                  download
                  className={[
                    'flex min-h-12 items-center justify-between gap-3 border px-4 text-[13px] font-semibold',
                    draftContent
                      ? 'border-rule bg-surface hover:-translate-y-0.5 hover:border-ink hover:shadow-[4px_4px_0_0_var(--ink)]'
                      : 'cursor-not-allowed border-rule bg-paper text-ink-soft',
                  ].join(' ')}
                >
                  <span>Export draft (HTML)</span>
                  <span className="font-mono text-[10px]">{draftContent ? 'html' : 'kosong'}</span>
                </a>
              </div>
            </div>

            {!completed && (
              <p className="mt-5 border-t border-rule pt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                URL live dan unduhan source code terbuka setelah status pesanan menjadi Selesai.
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

          {draftContent ? (
            <section className="mt-10 border-t border-ink pt-6" aria-label="Preview draft AI">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Lembar proof draft AI
                </h2>
                <span className="font-mono text-[10px] text-ink-soft">draftId {draft?.id}</span>
              </div>
              <DraftPreview draft={draftContent} />
            </section>
          ) : (
            <section className="mt-10 border-t border-rule pt-6" aria-label="Draft belum tersedia">
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Lembar proof draft AI
              </h2>
              <EmptyState
                icon="—"
                title="Draft belum terlampir pada pesanan ini"
                description="Draft AI dibuat saat brief dikirim. Bila pesanan ini dibuat sebelum fitur draft aktif, tidak ada pratinjau yang bisa ditampilkan. Hubungi developer bila Anda butuh salinan brief."
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
