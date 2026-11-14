'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { DraftPreview } from '@/components/shop/DraftPreview';
import { Stepper } from '@/components/shop/Stepper';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import {
  type OrderResponse,
  type Template,
  formatRupiah,
  readJson,
} from '@/components/shop/types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: OrderResponse; templateName: string | null };

// useParams/useSearchParams tidak boleh dipanggil saat prerender di luar Suspense
// (lihat pesan error Next "CLIENT_HOOK_DYNAMIC"), jadi dibungkus di sini.
export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <div className="bg-slate-950 text-slate-100 flex-1">
            <div className="max-w-5xl mx-auto px-4 py-14" aria-busy="true">
              <div className="h-7 w-56 bg-slate-800 rounded animate-pulse" />
              <p className="text-sm text-slate-400 mt-4">Memuat detail pesanan…</p>
            </div>
          </div>
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

  const shell = (body: React.ReactNode) => (
    <>
      <Header />
      <div className="bg-slate-950 text-slate-100 flex-1">{body}</div>
      <Footer />
    </>
  );

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/orders/${encodeURIComponent(orderId)}`).then((r) => readJson<OrderResponse>(r)),
      fetch('/api/templates').then((r) => readJson<{ templates: Template[] }>(r)),
    ])
      .then(([orderRes, tplRes]) => {
        if (!alive) return;
        if (!orderRes.ok) {
          setState({ phase: 'error', message: orderRes.error });
          return;
        }
        const templateName = tplRes.ok
          ? (tplRes.data.templates ?? []).find((t) => t.id === orderRes.data.order.template_id)?.name ?? null
          : null;
        setState({ phase: 'ready', data: orderRes.data, templateName });
      })
      .catch(() => alive && setState({ phase: 'error', message: 'Tidak bisa terhubung ke server.' }));
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (state.phase === 'loading') {
    return shell(
      <div className="max-w-5xl mx-auto px-4 py-14 bg-slate-950 flex-1" aria-busy="true">
        <div className="h-7 w-56 bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-80 bg-slate-800 rounded mt-3 animate-pulse" />
        <div className="h-40 bg-slate-900 border border-slate-800 rounded-2xl mt-6 animate-pulse" />
        <p className="text-sm text-slate-400 mt-4">Memuat detail pesanan…</p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return shell(
      <div className="max-w-3xl mx-auto px-4 py-16 bg-slate-950 flex-1">
        <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-semibold mb-3">Pesanan tidak bisa dimuat: {state.message}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-rose-400/40 font-semibold text-rose-100 hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Muat ulang
            </button>
            <Link href="/orders" className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 font-medium text-slate-200 hover:bg-slate-800 transition">
              Lacak dengan nomor pesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { order, draft, logs } = state.data;
  const completed = order.status === 'completed';
  const draftContent = draft?.ai_generated_content ?? null;

  return shell(
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
          <div>
            <Link href="/orders" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 mb-2">
              <span aria-hidden="true">‹</span> Lacak pesanan lain
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                {order.order_number}
              </span>
              <span>Website {order.contact_name}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              {state.templateName ? `Template dasar: ${state.templateName} · ` : ''}
              Paket {order.package_name} · {formatRupiah(order.total_price)} · Pembayaran {order.payment_status === 'paid' ? 'lunas' : 'belum lunas'}
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Status: {order.status.replace('_', ' ')}
          </span>
        </div>

        {/* Stepper */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6" aria-label="Progres pesanan">
          <Stepper status={order.status} logs={logs} />
        </section>

        {/* Aksi */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Catatan dari tim developer</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {order.dev_note ? `“${order.dev_note}”` : 'Belum ada catatan. Developer akan menulisnya saat pesanan mulai dikerjakan.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
              <a
                href={completed && order.live_website_url ? order.live_website_url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!completed}
                className={`px-4 py-3 rounded-xl text-sm font-semibold text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  completed && order.live_website_url
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                Akses Live URL
              </a>
              <a
                href={completed && order.download_zip_url ? order.download_zip_url : undefined}
                aria-disabled={!completed}
                className={`px-4 py-3 rounded-xl text-sm font-semibold text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  completed && order.download_zip_url
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                Unduh Source Code
              </a>
              <a
                href={draftContent ? `/api/export/${encodeURIComponent(draft?.id ?? '')}` : undefined}
                aria-disabled={!draftContent}
                download
                className={`px-4 py-3 rounded-xl text-sm font-semibold text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  draftContent
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
              >
                Export Draft (HTML)
              </a>
            </div>

            {!completed && (
              <p className="text-xs text-slate-400">
                Tombol live URL &amp; unduh source code aktif setelah pesanan berstatus <strong className="text-slate-400">completed</strong>.
              </p>
            )}
          </div>
        </section>

        {/* Kontak */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Nama', value: order.contact_name },
            { label: 'WhatsApp', value: order.contact_whatsapp },
            { label: 'Email', value: order.contact_email },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
              <p className="text-sm text-slate-200 mt-1 break-words">{c.value}</p>
            </div>
          ))}
        </section>

        {/* Preview draft */}
        {draftContent && (
          <section className="mt-8" aria-label="Preview draft AI">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="text-lg font-bold text-white">Preview draft AI</h2>
              <span className="text-xs text-slate-400">
                Draft ID <span className="font-mono text-slate-400">{draft?.id}</span>
              </span>
            </div>
            <DraftPreview draft={draftContent} />
          </section>
        )}
      </div>
    );
}