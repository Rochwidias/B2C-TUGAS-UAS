'use client';

import { useState, type FormEvent } from 'react';
import SessionExpired from './SessionExpired';
import { Spinner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { API_BASE } from '@/lib/api';
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type AdminOrder,
  type OrderStatus,
} from './types';

// Form update status + catatan developer -> PATCH /api/orders/[id].
// Sukses dikomunikasikan lewat event agar halaman induk bisa me-refresh data
// tanpa memuat ulang seluruh dokumen, plus toast agar umpan baliknya terbaca
// walau tombol berada di luar viewport.
export default function StatusUpdateForm({ order }: { order: AdminOrder }) {
  const toast = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.dev_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
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
    setExpired(false);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${order.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status, devNote: note }),
              credentials: 'include',
            });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        order?: AdminOrder;
      } | null;
      if (response.status === 401) {
        setExpired(true);
        toast.error('Sesi berakhir, silakan login ulang', 'Perubahan tidak disimpan.');
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal menyimpan (HTTP ${response.status})`);
      }
      const detail = `Status ${STATUS_LABEL[payload?.order?.status ?? status]} tersimpan.`;
      setSaved(detail);
      toast.success('Perubahan tersimpan', detail);
      window.dispatchEvent(new CustomEvent('admin:order-updated', { detail: payload?.order }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
      setError(message);
      toast.error('Gagal menyimpan perubahan', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-rule px-3 py-2">
        <h2 className="text-xs font-semibold tracking-tight text-ink">Update status &amp; catatan dev</h2>
        <span aria-hidden="true" className="font-mono text-[10px] text-ink-soft">
          01
        </span>
      </div>

      <p className="border-b border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Setiap perubahan ditulis ke <code className="font-mono text-ink">order_logs</code> dan langsung
        terlihat customer di halaman pelacakan.
      </p>

      <div className="grid gap-3 px-3 py-3">
        <div>
          <label
            htmlFor="dev-status"
            className="mb-1 block font-mono text-[10px] tracking-wide text-ink-soft uppercase"
          >
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
            className="min-h-11 w-full border border-rule bg-paper px-2.5 text-[13px] text-ink transition focus:border-ink disabled:opacity-60"
          >
            {ALL_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <label
              htmlFor="dev-note"
              className="font-mono text-[10px] tracking-wide text-ink-soft uppercase"
            >
              Catatan developer
            </label>
            <span
              className={`font-mono text-[10px] tabular-nums ${
                note.length > 2000 ? 'text-danger' : 'text-ink-soft'
              }`}
            >
              {note.length}/2000
            </span>
          </div>
          <textarea
            id="dev-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(null);
              setExpired(false);
            }}
            rows={4}
            disabled={busy}
            maxLength={2000}
            placeholder="Contoh: revisi headline poster sudah diterapkan, tinggal dikirim ke customer."
            className="w-full resize-y border border-rule bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-ink-soft/80 transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule px-3 py-2.5">
        <button
          type="submit"
          disabled={busy || unchanged}
          aria-busy={busy}
          className="flex min-h-11 items-center justify-center gap-2 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy ? <Spinner /> : null}
          {busy ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
        {saved && !expired ? (
          <p role="status" className="text-[11px] font-medium text-ok">
            {saved}
          </p>
        ) : null}
        {error && !expired ? (
          <p role="alert" className="text-[11px] font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {expired ? (
        <div className="border-t border-rule p-3">
          <SessionExpired from={`/admin/orders/${order.id}`} compact />
        </div>
      ) : null}
    </form>
  );
}
