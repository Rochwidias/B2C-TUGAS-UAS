'use client';

import KanbanCard from './KanbanCard';
import EmptyState from './EmptyState';
import { COLUMN_META, COLUMN_ORDER, type KanbanColumns } from './types';

// Papan 4 kolom. Setiap kolom menghitung ordernya sendiri sehingga angka per
// kolom selalu konsisten dengan kartu yang dirender.
export default function KanbanBoard({ columns }: { columns: KanbanColumns }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMN_ORDER.map((key) => {
        const meta = COLUMN_META[key];
        const orders = columns[key] ?? [];
        return (
          <section
            key={key}
            aria-labelledby={`column-${key}`}
            className={`flex min-h-[280px] flex-col rounded-2xl border ${meta.ring} bg-slate-900/40 p-3`}
          >
            <header className="mb-3 flex items-center gap-2 px-0.5">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${meta.dot}`} />
              <h2 id={`column-${key}`} className="text-sm font-semibold tracking-tight text-slate-200">
                {meta.label}
              </h2>
              <span
                aria-label={`${orders.length} order di kolom ${meta.label}`}
                className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-700"
              >
                {orders.length}
              </span>
            </header>
            <p className="mb-3 px-0.5 text-[11px] uppercase tracking-wider text-slate-600">
              {meta.hint}
            </p>

            <div className="flex flex-1 flex-col gap-3">
              {orders.length === 0 ? (
                <EmptyState
                  title="Belum ada order"
                  description={`Kolom ${meta.label} kosong. Kartu akan muncul di sini begitu customer menyelesaikan checkout.`}
                />
              ) : (
                orders.map((order) => <KanbanCard key={order.id} order={order} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}