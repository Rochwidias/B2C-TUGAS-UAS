'use client';

import { useEffect, useMemo, useState } from 'react';
import { TemplateCard } from './TemplateCard';
import { type Template, categoryLabel, readJson } from './types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; templates: Template[] };

export function TemplateCatalog() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [active, setActive] = useState('semua');

  useEffect(() => {
    let alive = true;
    fetch('/api/templates')
      .then((res) => readJson<{ templates: Template[] }>(res))
      .then((result) => {
        if (!alive) return;
        if (result.ok) setState({ phase: 'ready', templates: result.data.templates ?? [] });
        else setState({ phase: 'error', message: result.error });
      })
      .catch(() => {
        if (alive) setState({ phase: 'error', message: 'Tidak bisa terhubung ke server. Coba muat ulang halaman.' });
      });
    return () => {
      alive = false;
    };
  }, []);

  // Dibungkus useMemo agar referensinya stabil dan dependensi useMemo di
  // bawah tidak ikut berubah tiap render.
  const templates = useMemo(
    () => (state.phase === 'ready' ? state.templates : []),
    [state],
  );
  const categories = useMemo(() => {
    const seen: string[] = [];
    templates.forEach((t) => {
      if (!seen.includes(t.category)) seen.push(t.category);
    });
    return seen;
  }, [templates]);

  const visible = useMemo(() => {
    if (active === 'semua') return templates;
    return templates.filter((t) => t.category === active);
  }, [templates, active]);

  const filters = [{ key: 'semua', label: 'Semua' }, ...categories.map((c) => ({ key: c, label: categoryLabel(c) }))];

  return (
    <section id="katalog" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Koleksi Template Pilihan</h2>
          <p className="mt-2 text-slate-400">Pilih template awal yang paling relevan dengan kebutuhan bisnis Anda.</p>
        </div>

        {/* Filter kategori — punya handler sungguhan (bug di prototype lama) */}
        <div role="group" aria-label="Filter kategori template" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = active === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                aria-pressed={isActive}
                data-category={f.key}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {state.phase === 'loading' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-800" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-2/3 bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-800 rounded" />
                <div className="h-9 w-full bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.phase === 'error' && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
        >
          <span>Gagal memuat katalog: {state.message}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="self-start sm:self-auto px-4 py-2 rounded-lg bg-slate-900 border border-rose-400/40 font-semibold text-rose-100 hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            Muat ulang
          </button>
        </div>
      )}

      {state.phase === 'ready' && templates.length === 0 && (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400 text-sm">
          Belum ada template aktif. Silakan coba lagi beberapa saat.
        </p>
      )}

      {state.phase === 'ready' && templates.length > 0 && visible.length === 0 && (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400 text-sm" aria-live="polite">
          Tidak ada template pada kategori “{categoryLabel(active)}”. Pilih “Semua” untuk melihat seluruh koleksi.
        </p>
      )}

      {state.phase === 'ready' && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="template-grid">
          {visible.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </section>
  );
}