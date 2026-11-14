'use client';

import { useCallback, useEffect, useState } from 'react';
import KanbanBoard from './KanbanBoard';
import { COLUMN_ORDER, type KanbanColumns } from './types';

function emptyColumns(): KanbanColumns {
  return { backlog: [], in_progress: [], review: [], completed: [] };
}

function skeletonColumns() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMN_ORDER.map((key) => (
        <div
          key={key}
          className="min-h-[280px] rounded-2xl border border-slate-800 bg-slate-900/40 p-3"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-800/60" />
          <div className="mt-3 h-32 animate-pulse rounded-xl bg-slate-800/40" />
        </div>
      ))}
    </div>
  );
}

// Mengambil papan dari GET /api/admin/orders dan menanganinya sebagai state
// klien supaya status pindah kartu bisa me-refresh tanpa navigasi server.
export default function AdminBoard() {
  const [columns, setColumns] = useState<KanbanColumns | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Semua set-state diundur: effect memanggil fungsi ini langsung, jadi
    // state yang diset sinkron di awal akan memicu render berantai.
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    try {
      const response = await fetch('/api/admin/orders', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as {
        columns?: Partial<KanbanColumns>;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Gagal memuat papan (HTTP ${response.status})`);
      }
      if (!payload?.columns) {
        throw new Error('Respons /api/admin/orders tidak berisi field columns.');
      }
      // Setelah await saja: menyetel state secara sinkron di dalam effect
      // memicu render berantai (lint react-hooks/set-state-in-effect).
      queueMicrotask(() => setColumns({ ...emptyColumns(), ...payload.columns }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
      queueMicrotask(() => {
        setColumns(emptyColumns());
        setError(message);
      });
    } finally {
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = columns
    ? COLUMN_ORDER.reduce((sum, key) => sum + (columns[key]?.length ?? 0), 0)
    : 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Papan Pesanan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Seret atau pindahkan kartu antar kolom — setiap perubahan tercatat di riwayat order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
            Total <span className="font-semibold text-slate-200">{total}</span> order
          </p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/50 hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
          >
            {loading ? 'Memuat…' : 'Muat ulang'}
          </button>
        </div>
      </div>

      {loading ? skeletonColumns() : null}

      {!loading && error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5"
        >
          <div>
            <p className="text-sm font-semibold text-rose-200">Papan gagal dimuat</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-300/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {!loading && !error && columns ? <KanbanBoard columns={columns} /> : null}
    </div>
  );
}