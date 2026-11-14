'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import JsonBlock from '@/components/admin/JsonBlock';
import StatusBadge from '@/components/admin/StatusBadge';
import StatusUpdateForm from '@/components/admin/StatusUpdateForm';
import DeliveryForm from '@/components/admin/DeliveryForm';
import LogsTimeline from '@/components/admin/LogsTimeline';
import {
  formatDate,
  formatRupiah,
  type AdminDraft,
  type AdminOrder,
  type OrderLog,
} from '@/components/admin/types';

interface OrderPayload {
  order: AdminOrder;
  draft: AdminDraft | null;
  logs: OrderLog[];
}

export default function AdminOrderDetailPage() {
  // useParams hanya berharga di runtime, jadi dibungkus Suspense agar proses
  // prerender halaman ini tidak gagal (lihat docs/messages/blocking-prerender-client-hook).
  return (
    <Suspense
      fallback={
        <AdminShell>
          <p className="text-sm text-slate-500" aria-busy="true">
            Memuat detail order…
          </p>
        </AdminShell>
      }
    >
      <AdminOrderDetailInner />
    </Suspense>
  );
}

function AdminOrderDetailInner() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Semua set-state diundur: effect memanggil fungsi ini langsung, jadi
    // state yang diset sinkron di awal akan memicu render berantai.
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as
        | (OrderPayload & { error?: string })
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Order tidak ditemukan (HTTP ${response.status})`);
      }
      if (!payload?.order) {
        throw new Error('Respons API tidak berisi field order.');
      }
      const next = { order: payload.order, draft: payload.draft ?? null, logs: payload.logs ?? [] };
      // Setelah await saja: menyetel state secara sinkron di dalam effect
      // memicu render berantai (lint react-hooks/set-state-in-effect).
      queueMicrotask(() => setData(next));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
      queueMicrotask(() => setError(message));
    } finally {
      queueMicrotask(() => setLoading(false));
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Form status/delivery memberi tahu halaman ini lewat event agar data segar
  // tanpa memicu navigasi ulang.
  useEffect(() => {
    function onUpdated() {
      void load();
    }
    window.addEventListener('admin:order-updated', onUpdated);
    return () => window.removeEventListener('admin:order-updated', onUpdated);
  }, [load]);

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-4" aria-busy="true">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-900/70" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-900/70" />
          <p className="text-sm text-slate-500">Memuat detail order…</p>
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell>
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6"
        >
          <div>
            <h1 className="text-lg font-semibold text-rose-200">Order gagal dimuat</h1>
            <p className="mt-1 text-sm text-rose-300/80">{error ?? 'Data order tidak tersedia.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Coba lagi
            </button>
            <Link
              href="/admin"
              className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Kembali ke papan
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const { order, draft, logs } = data;
  const brief = draft?.input_prompt_data ?? null;
  const content = draft?.ai_generated_content ?? null;

  return (
    <AdminShell>
      <nav aria-label="Remah roti" className="mb-4 text-xs text-slate-500">
        <Link href="/admin" className="rounded transition hover:text-indigo-300">
          Papan Pesanan
        </Link>
        <span aria-hidden="true" className="mx-1.5">
          /
        </span>
        <span className="text-slate-400">{order.order_number}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-white">
              {order.order_number}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {order.package_name} · {formatRupiah(order.total_price)} ·{' '}
            <span className={order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
              {order.payment_status === 'paid' ? 'Sudah dibayar' : 'Belum dibayar'}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            Dibuat {formatDate(order.created_at)} · Diperbarui {formatDate(order.updated_at)}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Customer</dt>
            <dd className="font-medium text-slate-300">{order.contact_name}</dd>
          </div>
          <div>
            <dt className="text-slate-600">WhatsApp</dt>
            <dd className="font-medium text-slate-300">{order.contact_whatsapp}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Email</dt>
            <dd className="font-medium text-slate-300">{order.contact_email}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Live URL</dt>
            <dd className="font-medium">
              {order.live_website_url ? (
                <a
                  href={order.live_website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded text-indigo-300 underline decoration-indigo-500/40 underline-offset-2 transition hover:text-indigo-200"
                >
                  {order.live_website_url}
                </a>
              ) : (
                <span className="text-slate-500">belum tersedia</span>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold tracking-tight text-slate-200">
            Brief asli customer
          </h2>
          {brief ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Brand</dt>
                <dd className="text-slate-300">{brief.brandName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Tagline</dt>
                <dd className="text-slate-300">{brief.tagline}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Deskripsi</dt>
                <dd className="text-slate-300">{brief.description}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Warna tema</dt>
                <dd className="text-slate-300 capitalize">{brief.themeColor}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">CTA</dt>
                <dd className="text-slate-300">{brief.ctaText}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Tone of voice</dt>
                <dd className="text-slate-300">{brief.toneOfVoice}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-32 shrink-0 text-xs text-slate-600">Template</dt>
                <dd className="font-mono text-xs text-slate-400">{brief.templateId}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Brief tidak tersimpan untuk order ini.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-200">
              Preview hasil draft
            </h2>
            {draft ? (
              <a
                href={`/api/export/${draft.id}`}
                download
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <span aria-hidden="true">⤓</span>
                Export Clean Source Code
              </a>
            ) : null}
          </div>

          {content ? (
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="size-8 rounded-md ring-1 ring-white/10"
                  style={{ backgroundColor: content.theme.primaryColor }}
                />
                <span
                  aria-hidden="true"
                  className="size-8 rounded-md ring-1 ring-white/10"
                  style={{ backgroundColor: content.theme.accentColor }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{content.brand.name}</p>
                  <p className="truncate text-xs text-slate-500">{content.brand.tagline}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-600">Hero</p>
                <p className="mt-1 text-base font-semibold leading-snug text-slate-100">
                  {content.heroSection.headline}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {content.heroSection.subheadline}
                </p>
                <span className="mt-2 inline-block rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {content.heroSection.ctaText}
                </span>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-600">Fitur (3)</p>
                <ul className="mt-1.5 space-y-1.5">
                  {content.features.map((feature) => (
                    <li key={feature.title} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                      <span aria-hidden="true" className="text-slate-600">
                        {feature.icon}
                      </span>
                      <span>
                        <span className="font-medium text-slate-300">{feature.title}</span> —{' '}
                        {feature.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-600">FAQ (2)</p>
                <dl className="mt-1.5 space-y-1.5">
                  {content.faq.map((item) => (
                    <div key={item.q} className="rounded-lg bg-slate-950/50 px-3 py-2">
                      <dt className="text-xs font-medium text-slate-300">{item.q}</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Draft AI belum tersedia untuk order ini.
            </p>
          )}
        </section>
      </div>

      {content ? (
        <div className="mt-5">
          <JsonBlock value={content} label="Payload JSON draft AI" />
        </div>
      ) : null}
      {brief ? (
        <div className="mt-5">
          <JsonBlock value={brief} label="Brief input (input_prompt_data)" />
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StatusUpdateForm order={order} />
        <DeliveryForm order={order} />
      </div>

      <div className="mt-5">
        <LogsTimeline logs={logs} />
      </div>
    </AdminShell>
  );
}