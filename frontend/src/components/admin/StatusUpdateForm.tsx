'use client';

import { useState, type FormEvent } from 'react';
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type AdminOrder,
  type OrderStatus,
} from './types';

// Form update status + catatan developer -> PATCH /api/orders/[id].
// Sukses dikomunikasikan lewat event agar halaman induk bisa me-refresh data
// tanpa memuat ulang seluruh dokumen.
export default function StatusUpdateForm({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.dev_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const unchanged = status === order.status && note === (order.dev_note ?? '');

  // Sinkronkan dengan data terbaru dari server setiap kali halaman me-refresh,
  // tanpa me-mount ulang form sehingga pesan sukses tetap terbaca. Disesuaikan
  // saat render, bukan di effect, agar tidak memicu render berantai.
  const [prevOrder, setPrevOrder] = useState(order);
  if (order !== prevOrder) {
    setPrevOrder(order);
    setStatus(order.status);
    setNote(order.dev_note ?? '');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unchanged) {
      setError('Tidak ada perubahan untuk disimpan.');
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, devNote: note }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        order?: AdminOrder;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal menyimpan (HTTP ${response.status})`);
      }
      setSaved(
        payload?.order
          ? `Tersimpan — status ${STATUS_LABEL[payload.order.status]} pada ${new Date().toLocaleTimeString('id-ID')}.`
          : 'Perubahan tersimpan.',
      );
      window.dispatchEvent(new CustomEvent('admin:order-updated', { detail: payload?.order }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-slate-200">Update status & catatan dev</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Setiap perubahan status ditulis ke <code className="font-mono text-slate-400">order_logs</code> dan
        langsung terlihat customer di pelacakan pesanan.
      </p>

      <div className="mt-4 grid gap-4">
        <div>
          <label htmlFor="dev-status" className="mb-1.5 block text-xs font-medium text-slate-300">
            Status pesanan
          </label>
          <select
            id="dev-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OrderStatus);
              setSaved(null);
            }}
            disabled={busy}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {ALL_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dev-note" className="mb-1.5 block text-xs font-medium text-slate-300">
            Catatan developer
          </label>
          <textarea
            id="dev-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(null);
            }}
            rows={4}
            disabled={busy}
            placeholder="Contoh: revisi headline hero sudah diterapkan, tinggal deploy ke Vercel."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          />
          <p className="mt-1 text-[11px] text-slate-600">{note.length}/500 karakter</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || unchanged}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {busy ? 'Menyimpan…' : 'Simpan perubahan'}
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