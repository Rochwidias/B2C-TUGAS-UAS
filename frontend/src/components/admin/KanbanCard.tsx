'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import StatusBadge from './StatusBadge';
import SessionExpired from './SessionExpired';
import { Spinner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { API_BASE } from '@/lib/api';
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
// review -> completed) supaya tombol Pindah aktif begitu kartu tampil. Order yang
// sudah selesai tidak punya langkah maju, jadi defaultnya "dikerjakan ulang" —
// bukan mundur ke draft, yang akan menghapus jejak pembayaran.
function firstDestination(status: OrderStatus): OrderStatus {
  const index = ALL_STATUSES.indexOf(status);
  if (index === -1) return ALL_STATUSES[0];
  return ALL_STATUSES[index + 1] ?? 'in_progress';
}

// Satu kartu order di papan kanban: membuka detail, menampilkan kontak customer,
// dan memindahkan status lewat PATCH /api/orders/[id] tanpa meninggalkan papan.
export default function KanbanCard({
  order,
  onMoved,
}: {
  order: AdminOrder;
  /** Dipanggil setelah PATCH sukses supaya induk memuat ulang daftar. */
  onMoved?: () => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<OrderStatus>(firstDestination(order.status));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 401 = cookie sesi habis. Ditandai terpisah supaya kartu menampilkan
  // perbaikan yang benar (login ulang), bukan "coba lagi".
  const [expired, setExpired] = useState(false);

  async function moveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === order.status) {
      setError('Status belum berubah. Pilih kolom tujuan lain terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${order.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: selected }),
              credentials: 'include',
            });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 401) {
        setExpired(true);
        toast.error('Sesi berakhir, silakan login ulang', 'Status tidak diubah.');
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal memperbarui status (HTTP ${response.status})`);
      }
      toast.success('Status diperbarui', `${order.order_number} → ${MOVE_LABEL[selected]}.`);
      // Muat ulang data induk tanpa reload dokumen: posisi scroll dan filter
      // pencarian pengguna tidak hilang.
      onMoved?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
      setError(message);
      toast.error('Status gagal diperbarui', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`group border border-rule bg-surface transition hover:border-ink hover:shadow-[3px_3px_0_0_var(--ink)] ${
        busy ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-rule py-1 pr-2.5 pl-2.5">
        <Link
          href={`/admin/orders/${order.id}`}
          className="-ml-1 flex min-h-11 min-w-0 items-center truncate px-1 font-mono text-[12px] font-semibold text-ink underline decoration-rule decoration-1 underline-offset-[3px] transition hover:decoration-accent"
          title={`Buka detail ${order.order_number}`}
        >
          {order.order_number}
        </Link>
        <StatusBadge status={order.status} />
      </div>

      <div className="px-2.5 py-2">
        <p className="truncate text-[13px] leading-tight font-semibold text-ink" title={order.contact_name}>
          {order.contact_name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink-soft" title={order.package_name}>
          {order.package_name}
        </p>

        <dl className="mt-2 space-y-1 border-t border-rule pt-2 font-mono text-[10.5px] text-ink-soft">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0">Harga</dt>
            <dd className="truncate font-semibold text-ink tabular-nums">
              {formatRupiah(order.total_price)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0">WhatsApp</dt>
            <dd className="truncate tabular-nums">{order.contact_whatsapp}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0">Bayar</dt>
            <dd
              className={`font-semibold ${order.payment_status === 'paid' ? 'text-ok' : 'text-warn'}`}
            >
              {order.payment_status === 'paid' ? 'Lunas' : 'Belum'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0">Masuk</dt>
            <dd className="truncate">{formatDate(order.created_at)}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={moveStatus} className="flex items-end gap-1.5 border-t border-rule px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`status-${order.id}`}
            className="mb-1 block font-mono text-[10px] tracking-wide text-ink-soft uppercase"
          >
            Pindah ke
          </label>
          <select
            id={`status-${order.id}`}
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value as OrderStatus);
              setError(null);
            }}
            disabled={busy}
            className="min-h-11 w-full min-w-0 border border-rule bg-paper px-2 text-[11.5px] text-ink transition focus:border-ink disabled:opacity-60"
          >
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status} disabled={status === order.status}>
                {MOVE_LABEL[status]}
                {status === order.status ? ' (posisi sekarang)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={busy || selected === order.status}
          aria-label={`Pindahkan ${order.order_number} ke ${MOVE_LABEL[selected]}`}
          aria-busy={busy}
          className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 border border-ink bg-ink px-2.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy ? <Spinner /> : null}
          {busy ? '…' : 'Pindah'}
        </button>
      </form>

      {expired ? <div className="border-t border-rule p-2"><SessionExpired compact from="/admin" /></div> : null}

      {!expired && error ? (
        <p
          role="alert"
          className="border-t border-danger bg-danger/10 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}
    </article>
  );
}
