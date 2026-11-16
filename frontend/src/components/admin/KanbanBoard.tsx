'use client';

import KanbanCard from './KanbanCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLUMN_META, COLUMN_ORDER, type ColumnKey, type KanbanColumns } from './types';

// Papan 4 kolom. `columns` sudah lewat filter pencarian/status dari induk, jadi
// angka per kolom dihitung dari data yang dirender — bukan dari total API.
export default function KanbanBoard({
  columns,
  filtered,
  onMoved,
  keys = COLUMN_ORDER,
}: {
  columns: KanbanColumns;
  /** True saat ada pencarian/filter aktif: menentukan kalimat empty state. */
  filtered: boolean;
  /** Dipanggil setelah satu kartu berhasil pindah status. */
  onMoved: () => void;
  /** Kolom yang dirender. Filter status mempersempit ini menjadi satu kolom. */
  keys?: ColumnKey[];
}) {
  const totalVisible = COLUMN_ORDER.reduce((sum, key) => sum + (columns[key]?.length ?? 0), 0);

  if (totalVisible === 0) {
    return (
      <div className="border border-rule bg-paper/60 px-3 py-6">
        <EmptyState
          title={filtered ? 'Tidak ada order yang cocok' : 'Belum ada order sama sekali'}
          description={
            filtered
              ? 'Pencarian atau filter status menyaring semua kartu. Longgarkan kata kunci atau pilih “Semua status” untuk melihat seluruh papan.'
              : 'Papan terisi otomatis begitu customer menyelesaikan checkout di halaman kustomisasi.'
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
        keys.length === 1 ? 'xl:grid-cols-1' : 'xl:grid-cols-4'
      }`}
    >
      {keys.map((key) => {
        const meta = COLUMN_META[key];
        const orders = columns[key] ?? [];
        return (
          <section
            key={key}
            aria-labelledby={`column-${key}`}
            className="flex min-w-0 flex-col border border-rule bg-paper/60"
          >
            <header className={`border-b-[1.5px] ${meta.ring} px-2.5 py-1.5`}>
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className={`size-2 shrink-0 ${meta.dot}`} />
                <h2
                  id={`column-${key}`}
                  className="min-w-0 truncate text-[12.5px] font-semibold tracking-tight text-ink"
                >
                  {meta.label}
                </h2>
                <span
                  className="ml-auto shrink-0 border border-rule px-1.5 font-mono text-[10.5px] leading-[1.4] tabular-nums text-ink-soft"
                  aria-label={`${orders.length} order`}
                >
                  {String(orders.length).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-0.5 pl-4 font-mono text-[9.5px] leading-tight tracking-wide text-ink-soft uppercase">
                {meta.hint}
              </p>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {orders.length === 0 ? (
                <EmptyState
                  title="Kolom ini kosong"
                  description={
                    filtered
                      ? `Tidak ada hasil di ${meta.label} untuk filter yang sedang aktif.`
                      : `Belum ada order di ${meta.label}. Kartu baru muncul begitu customer menyelesaikan checkout.`
                  }
                />
              ) : (
                orders.map((order) => <KanbanCard key={order.id} order={order} onMoved={onMoved} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
