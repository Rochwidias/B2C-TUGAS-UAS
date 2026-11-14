'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import StatusBadge from './StatusBadge';
import {
  ALL_STATUSES,
  formatDate,
  formatRupiah,
  type AdminOrder,
  type OrderStatus,
} from './types';

// Label per tujuan pemindahan, dipakai di dropdown dan aria-label tombol.
const MOVE_LABEL: Record<OrderStatus, string> = {
  draft: 'Backlog (Draft)',
  paid: 'Backlog (Paid)',
  in_progress: 'In Progress',
  review: 'Need Review',
  completed: 'Completed',
};

// Default dropdown = langkah alur berikutnya (draft -> paid -> in_progress ->
// review -> completed) supaya tombol Pindah aktif begitu kartu tampil dan
// tujuannya masuk akal; order yang sudah selesai mundur ke review.
function firstDestination(status: OrderStatus): OrderStatus {
  const index = ALL_STATUSES.indexOf(status);
  if (index === -1) return ALL_STATUSES[0];
  return ALL_STATUSES[index + 1] ?? ALL_STATUSES[Math.max(index - 1, 0)];
}

// Satu kartu order di papan kanban: membuka detail, menampilkan kontak customer,
// dan memindahkan status lewat PATCH /api/orders/[id] tanpa meninggalkan papan.
export default function KanbanCard({ order }: { order: AdminOrder }) {
  const [selected, setSelected] = useState<OrderStatus>(firstDestination(order.status));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === order.status) {
      setError('Status belum berubah — pilih kolom tujuan lain terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal memperbarui status (HTTP ${response.status})`);
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
      setBusy(false);
    }
  }

  return (
    <article className="group rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-sm transition hover:border-indigo-500/40 hover:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/orders/${order.id}`}
          className="rounded-md font-mono text-[13px] font-semibold tracking-tight text-indigo-300 transition hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {order.order_number}
        </Link>
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-1.5 truncate text-sm font-medium text-slate-200" title={order.contact_name}>
        {order.contact_name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
        {order.package_name} · {formatRupiah(order.total_price)}
      </p>

      <dl className="mt-3 space-y-1 border-t border-slate-800 pt-2.5 text-[11px] text-slate-300">
        <div className="flex justify-between gap-2">
          <dt>WhatsApp</dt>
          <dd className="truncate font-medium text-slate-400">{order.contact_whatsapp}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Dibuat</dt>
          <dd className="font-medium text-slate-400">{formatDate(order.created_at)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Pembayaran</dt>
          <dd
            className={`font-medium ${
              order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {order.payment_status === 'paid' ? 'Lunas' : 'Belum bayar'}
          </dd>
        </div>
      </dl>

      <form onSubmit={moveStatus} className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`status-${order.id}`} className="sr-only">
          Pindahkan {order.order_number} ke kolom lain
        </label>
        <select
          id={`status-${order.id}`}
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value as OrderStatus);
            setError(null);
          }}
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
        >
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status} disabled={status === order.status}>
              {MOVE_LABEL[status]}
              {status === order.status ? ' (posisi sekarang)' : ''}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || selected === order.status}
          aria-label={`Pindahkan ${order.order_number} ke ${MOVE_LABEL[selected]}`}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {busy ? 'Memindahkan…' : 'Pindah'}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 rounded-md bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-300">
          {error}
        </p>
      ) : null}
    </article>
  );
}