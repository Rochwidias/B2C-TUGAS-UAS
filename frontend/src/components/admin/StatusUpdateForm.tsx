'use client';

import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/Toast';
import { setStatus } from '@/lib/orders-store';
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type AdminOrder,
  type OrderStatus,
} from './types';

// Form update status + catatan developer -> setStatus dari store lokal.
// Store menulis entri log dan menyebar event `craftai:recent-changed`, sehingga
// halaman induk (yang memantau event itu) menyegarkan data tanpa navigasi,
// plus toast agar umpan baliknya terbaca walau tombol di luar viewport.
export default function StatusUpdateForm({ order }: { order: AdminOrder }) {
  const toast = useToast();
  const [status, setStatusValue] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const unchanged = status === order.status && note.trim() === '';

  // Ikuti nilai terbaru dari store setiap kali halaman me-refresh (mis. setelah
  // simpan poster/delivery), tanpa me-mount ulang form sehingga pesan sukses
  // tetap terbaca. Disesuaikan saat render, bukan di effect, agar tidak memicu
  // render berantai.
  const [prevOrder, setPrevOrder] = useState(order);
  if (order !== prevOrder) {
    setPrevOrder(order);
    setStatusValue(order.status);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unchanged) {
      setError('Tidak ada perubahan untuk disimpan.');
      return;
    }
    setError(null);
    setSaved(null);

    const updated = setStatus(order.id, status, note.trim() || null);
    if (!updated) {
      const message = 'Order tidak ditemukan di penyimpanan lokal.';
      setError(message);
      toast.error('Gagal menyimpan perubahan', message);
      return;
    }

    const detail = `Status ${STATUS_LABEL[updated.status]} tersimpan.`;
    setSaved(detail);
    toast.success('Perubahan tersimpan', detail);
    // Event RECENT_EVENT dari store memicu pembaruan halaman induk.
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
        Setiap perubahan ditulis ke riwayat log order di penyimpanan lokal dan langsung terlihat
        customer di halaman pelacakan.
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
              setStatusValue(event.target.value as OrderStatus);
              setSaved(null);
            }}
            className="min-h-11 w-full border border-rule bg-paper px-2.5 text-[13px] text-ink transition focus:border-ink"
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
            }}
            rows={4}
            maxLength={2000}
            placeholder="Contoh: revisi headline poster sudah diterapkan, tinggal dikirim ke customer."
            className="w-full resize-y border border-rule bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-ink-soft/80 transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule px-3 py-2.5">
        <button
          type="submit"
          disabled={unchanged}
          className="flex min-h-11 items-center justify-center gap-2 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Simpan perubahan
        </button>
        {saved ? (
          <p role="status" className="text-[11px] font-medium text-ok">
            {saved}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[11px] font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
