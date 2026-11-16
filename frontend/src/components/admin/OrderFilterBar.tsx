'use client';

// Pencarian + filter status sisi klien. Satu set kontrol dipakai bersama oleh
// baris statistik dan kanban supaya angka per kolom selalu mengikuti hasil.

import { STATUS_FILTERS, type StatusFilter } from './types';

export default function OrderFilterBar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  matchCount,
  totalCount,
  onReset,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  matchCount: number;
  totalCount: number;
  onReset: () => void;
}) {
  const filtering = query.trim() !== '' || status !== 'all';

  return (
    <div className="border border-rule bg-surface">
      <div className="flex flex-col gap-2.5 px-3 py-2.5 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="order-search"
            className="mb-1 block font-mono text-[9.5px] tracking-[0.14em] text-ink-soft uppercase"
          >
            Cari order
          </label>
          <input
            id="order-search"
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nama customer, nomor order, atau email"
            className="min-h-11 w-full min-w-0 border border-rule bg-paper px-2.5 text-[13px] text-ink placeholder:text-ink-soft/80 transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>

        <div className="w-full lg:w-[220px] lg:shrink-0">
          <label
            htmlFor="order-status"
            className="mb-1 block font-mono text-[9.5px] tracking-[0.14em] text-ink-soft uppercase"
          >
            Status
          </label>
          <select
            id="order-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
            className="min-h-11 w-full min-w-0 border border-rule bg-paper px-2.5 text-[13px] text-ink transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-start">
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-[10.5px] tabular-nums text-ink-soft"
          >
            {filtering ? `${matchCount} / ${totalCount} order` : `${totalCount} order`}
          </p>
          <button
            type="button"
            onClick={onReset}
            disabled={!filtering}
            className="min-h-11 shrink-0 border border-rule px-2.5 text-[11px] font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}