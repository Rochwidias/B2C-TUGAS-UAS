'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { type OrderResponse, type Template, formatRupiah, readJson, statusLabel } from '@/components/shop/types';
import { Stepper } from '@/components/shop/Stepper';

type TrackState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'found'; result: OrderResponse; templateName: string | null };

function TrackForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [number, setNumber] = useState(search.get('number') ?? '');
  const [state, setState] = useState<TrackState>({ phase: 'idle' });

  async function lookup(e: { preventDefault: () => void }) {
    e.preventDefault();
    const value = number.trim().toUpperCase();
    if (!/^UK-ORD-\d{4}$/.test(value)) {
      setState({ phase: 'error', message: 'Format nomor pesanan adalah UK-ORD-XXXX, contoh: UK-ORD-8812.' });
      return;
    }
    setState({ phase: 'loading' });
    try {
      const res = await fetch(`/api/orders?number=${encodeURIComponent(value)}`);
      const result = await readJson<OrderResponse>(res);
      if (!result.ok) {
        setState({ phase: 'error', message: result.error });
        return;
      }
      const tplId = result.data.order.template_id;
      let templateName: string | null = null;
      const tplRes = await fetch('/api/templates').then((r) => readJson<{ templates: Template[] }>(r));
      if (tplRes.ok) templateName = (tplRes.data.templates ?? []).find((t) => t.id === tplId)?.name ?? null;
      setState({ phase: 'found', result: result.data, templateName });
      router.replace(`/orders?number=${encodeURIComponent(value)}`, { scroll: false });
    } catch {
      setState({ phase: 'error', message: 'Jaringan terputus. Coba beberapa saat lagi.' });
    }
  }

  return (
    <>
      <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <div className="flex-1">
          <label htmlFor="order-number" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Nomor Pesanan
          </label>
          <input
            id="order-number"
            name="orderNumber"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="UK-ORD-8812"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={state.phase === 'loading'}
          className="self-end sm:self-auto px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 h-[42px] sm:mt-6"
        >
          {state.phase === 'loading' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
              <span>Mencari…</span>
            </>
          ) : (
            <span>Lacak Pesanan</span>
          )}
        </button>
      </form>

      <div className="mt-8" aria-live="polite">
        {state.phase === 'idle' && (
          <p className="text-sm text-slate-400 border border-dashed border-slate-800 rounded-2xl p-6">
            Belum ada pencarian. Nomor pesanan dikirim ke WhatsApp Anda setelah checkout. Pesanan demo tersedia dengan
            nomor <span className="font-mono text-slate-400">UK-ORD-8812</span>.
          </p>
        )}

        {state.phase === 'error' && (
          <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
            {state.message}
          </div>
        )}

        {state.phase === 'found' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6" data-testid="track-result">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  {state.result.order.order_number}
                </span>
                <h3 className="font-bold text-lg text-white mt-2">
                  Website {state.result.order.contact_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {state.templateName ? `Template dasar: ${state.templateName}` : 'Template terdaftar'} · Paket{' '}
                  {state.result.order.package_name} · {formatRupiah(state.result.order.total_price)} · Dibuat{' '}
                  {new Date(state.result.order.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {statusLabel(state.result.order.status)}
              </span>
            </div>

            <div className="py-6">
              <Stepper status={state.result.order.status} logs={state.result.logs} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/orders/${state.result.order.id}`}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Lihat detail pesanan
              </Link>
              <button
                type="button"
                onClick={() => {
                  setNumber('');
                  setState({ phase: 'idle' });
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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

export default function OrdersPage() {
  return (
    <>
      <Header />
      <div className="bg-slate-950 text-slate-100 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Status Pengerjaan Pesanan</h1>
            <p className="text-sm text-slate-400 mt-1">
              Pantau proses dari draft AI hingga tim kami selesai mengeksekusi website Anda. Tanpa login.
            </p>
          </div>
          <Link
            href="/#katalog"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 border border-slate-700 transition self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            + Buat Pesanan Baru
          </Link>
        </div>

        <Suspense fallback={<p className="text-sm text-slate-400">Memuat formulir pelacakan…</p>}>
          <TrackForm />
        </Suspense>
      </div>
      </div>
      <Footer />
    </>
  );
}