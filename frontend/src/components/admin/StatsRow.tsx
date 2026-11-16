'use client';

// Baris statistik dashboard. Angkanya berasal dari GET /api/admin/stats, bukan
// konstanta: saat API belum menjawab tampil skeleton, saat kosong tampil 0
// (bukan "NaN"/"Rp NaN"), saat gagal tampil sebab + tombol coba lagi.

import { Skeleton } from '@/components/ui/Feedback';
import {
  ALL_STATUSES,
  COLUMN_META,
  COLUMN_ORDER,
  columnOfStatus,
  formatHours,
  formatRupiahShort,
  safeNumber,
  type AdminStats,
  type ColumnKey,
} from './types';

interface Cell {
  key: string;
  label: string;
  value: string;
  /** Keterangan tambahan di bawah angka; jangan mengklaim tren yang tidak ada. */
  note: string;
}

function countInColumn(stats: AdminStats, column: ColumnKey): number {
  return ALL_STATUSES.filter((status) => columnOfStatus(status) === column).reduce(
    (sum, status) => sum + safeNumber(stats.counts?.[status]),
    0,
  );
}

function buildCells(stats: AdminStats): Cell[] {
  const total = safeNumber(stats.counts?.total);
  const open = COLUMN_ORDER.filter((key) => key !== 'completed').reduce(
    (sum, key) => sum + countInColumn(stats, key),
    0,
  );
  const delivered = safeNumber(stats.delivered);

  return [
    {
      key: 'total',
      label: 'Total order',
      value: String(total),
      note: `${open} masih berjalan`,
    },
    {
      key: 'revenue',
      label: 'Pendapatan lunas',
      value: formatRupiahShort(stats.revenue),
      note: 'hanya order berstatus paid',
    },
    {
      key: 'delivered',
      label: 'Sudah delivery',
      value: String(delivered),
      note: total > 0 ? `${Math.round((delivered / total) * 100)}% dari total` : 'belum ada order',
    },
    {
      key: 'completion',
      label: 'Rata-rata selesai',
      value: formatHours(stats.averageCompletionHours),
      note: 'order masuk → status completed',
    },
    {
      key: 'logs',
      label: 'Log aktivitas',
      value: String(safeNumber(stats.totalLogs)),
      note: 'entri order_logs',
    },
  ];
}

export default function StatsRow({
  stats,
  loading,
  error,
  onRetry,
}: {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-surface px-3 py-2.5" aria-hidden="true">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-2 h-6 w-16" />
            <Skeleton className="mt-1.5 h-2.5 w-24" />
          </div>
        ))}
        <span className="sr-only" role="status">
          Memuat statistik order…
        </span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-danger bg-surface px-3 py-2.5"
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.14em] text-danger uppercase">
            Statistik tidak tersedia
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
            {error ?? 'Ringkasan order belum bisa dimuat.'} Papan di bawah tetap bisa dipakai.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 shrink-0 border border-ink bg-paper px-3 text-[11.5px] font-semibold text-ink transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const cells = buildCells(stats);

  return (
    <dl className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 xl:grid-cols-5">
      {cells.map((cell) => (
        <div
          key={cell.key}
          className="min-w-0 bg-surface px-3 py-2.5 last:col-span-2 xl:last:col-span-1"
        >
          <dt className="truncate font-mono text-[9.5px] tracking-[0.14em] text-ink-soft uppercase">
            {cell.label}
          </dt>
          <dd
            className="mt-1 truncate font-mono text-[19px] leading-none font-semibold tabular-nums text-ink"
            title={cell.value}
          >
            {cell.value}
          </dd>
          <dd className="mt-1 truncate text-[10.5px] leading-tight text-ink-soft">{cell.note}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Distribusi status sebagai bilah data: satu segmen per kolom papan. */
export function StatusDistribution({ stats }: { stats: AdminStats | null }) {
  const counts = COLUMN_ORDER.map((key) => ({
    key,
    label: COLUMN_META[key].label,
    value: stats ? countInColumn(stats, key) : 0,
    dot: COLUMN_META[key].dot,
  }));
  const total = counts.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="border border-rule bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-mono text-[9.5px] tracking-[0.14em] text-ink-soft uppercase">
          Sebaran status
        </p>
        <p className="font-mono text-[10px] tabular-nums text-ink-soft">{total} order</p>
      </div>

      {total === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
          Belum ada order. Angka akan muncul setelah customer menyelesaikan checkout.
        </p>
      ) : (
        <>
          <div className="mt-2 flex h-2 w-full overflow-hidden border border-rule" aria-hidden="true">
            {counts.map((item) =>
              item.value === 0 ? null : (
                <span
                  key={item.key}
                  className={item.dot}
                  style={{ width: `${(item.value / total) * 100}%` }}
                />
              ),
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {counts.map((item) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2 shrink-0 ${item.dot}`} />
                <span className="text-[10.5px] text-ink-soft">{item.label}</span>
                <span className="font-mono text-[10.5px] font-semibold tabular-nums text-ink">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}