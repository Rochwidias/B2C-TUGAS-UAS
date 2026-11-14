'use client';

import { useState, type FormEvent } from 'react';
import type { AdminOrder } from './types';

// Form delivery -> PUT /api/orders/[id]/delivery.
// URL yang tersimpan di sini yang kemudian mengaktifkan tombol customer di /orders/[id].
export default function DeliveryForm({ order }: { order: AdminOrder }) {
  const [liveUrl, setLiveUrl] = useState(order.live_website_url ?? '');
  const [zipUrl, setZipUrl] = useState(order.download_zip_url ?? '');
  const [note, setNote] = useState(order.dev_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Ikuti nilai terbaru dari server (mis. setelah save pertama kali) tanpa
  // mereset pesan sukses yang sedang ditampilkan. Disesuaikan saat render,
  // bukan di effect, agar tidak memicu render berantai.
  const [prevOrder, setPrevOrder] = useState(order);
  if (order !== prevOrder) {
    setPrevOrder(order);
    setLiveUrl(order.live_website_url ?? '');
    setZipUrl(order.download_zip_url ?? '');
    setNote(order.dev_note ?? '');
  }

  const validLive = liveUrl.trim() === '' || /^https?:\/\/\S+$/i.test(liveUrl.trim());
  const validZip = zipUrl.trim() === '' || /^https?:\/\/\S+$/i.test(zipUrl.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);
    if (!validLive || !validZip) {
      setError('URL harus diawali http:// atau https://.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveWebsiteUrl: liveUrl.trim(),
          downloadZipUrl: zipUrl.trim(),
          devNote: note,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        order?: AdminOrder;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal menyimpan delivery (HTTP ${response.status})`);
      }
      setSaved('Delivery tersimpan — customer sekarang bisa mengakses live URL & source code.');
      window.dispatchEvent(new CustomEvent('admin:order-updated', { detail: payload?.order }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-slate-200">Form delivery</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Isi setelah site di-deploy. Kosongkan bila belum siap — tombol customer tetap nonaktif sampai
        status <span className="text-slate-400">Completed</span>.
      </p>

      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor="live-url" className="mb-1.5 block text-xs font-medium text-slate-300">
            Live URL
          </label>
          <input
            id="live-url"
            type="url"
            inputMode="url"
            value={liveUrl}
            onChange={(event) => {
              setLiveUrl(event.target.value);
              setSaved(null);
            }}
            disabled={busy}
            placeholder="https://artisan-cafe.craftaistudio.my.id"
            aria-invalid={!validLive}
            className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
              validLive
                ? 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/40'
                : 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/40'
            } disabled:opacity-60`}
          />
          {!validLive ? (
            <p className="mt-1 text-[11px] text-rose-400">Format URL tidak valid.</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="zip-url" className="mb-1.5 block text-xs font-medium text-slate-300">
            Source code (zip URL)
          </label>
          <input
            id="zip-url"
            type="url"
            inputMode="url"
            value={zipUrl}
            onChange={(event) => {
              setZipUrl(event.target.value);
              setSaved(null);
            }}
            disabled={busy}
            placeholder="https://cdn.craftaistudio.my.id/export/UK-ORD-8812.zip"
            aria-invalid={!validZip}
            className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
              validZip
                ? 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/40'
                : 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/40'
            } disabled:opacity-60`}
          />
          {!validZip ? (
            <p className="mt-1 text-[11px] text-rose-400">Format URL tidak valid.</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="delivery-note" className="mb-1.5 block text-xs font-medium text-slate-300">
            Catatan delivery
          </label>
          <textarea
            id="delivery-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(null);
            }}
            rows={3}
            disabled={busy}
            placeholder="Contoh: deploy selesai, domain custom sudah terpasang."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {busy ? 'Menyimpan delivery…' : 'Simpan delivery'}
        </button>
        {saved ? (
          <p role="status" className="text-xs font-medium text-emerald-400">
            {saved}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs font-medium text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}