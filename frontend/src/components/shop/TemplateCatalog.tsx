'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyBlock } from '@/components/ui/EmptyBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from './Reveal';
import { TemplateCard } from './TemplateCard';
import { type Template, categoryLabel } from './types';
import { FALLBACK_TEMPLATES, fetchCatalog } from '@/lib/catalog';

// Katalog = rak cetak: judul ledger, filter bergaris, grid kartu.
// id="katalog" dan data-testid="template-grid" dipakai navigasi + tes E2E.
//
// Kartu dirender dari FALLBACK_TEMPLATES sejak render pertama (SSR ikut
// membawa daftarnya) supaya katalog langsung terisi walau backend lambat atau
// tidak terjangkau; fetchCatalog tetap berjalan di latar belakang untuk data
// terbaru dari server.
export function TemplateCatalog() {
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('semua');

  useEffect(() => {
    let alive = true;
    fetchCatalog().then((next) => {
      if (!alive) return;
      setTemplates(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

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

  const filters = [
    { key: 'semua', label: 'Semua' },
    ...categories.map((c) => ({ key: c, label: categoryLabel(c) })),
  ];

  return (
    <Reveal
      as="section"
      id="katalog"
      className="scroll-mt-24 border-t border-ink bg-paper"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
              Rak 02 / Katalog
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
              Tiga template siap cetak
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              Setiap template punya struktur halaman dan palet dasar. Yang berubah setelah brief
              Anda masuk: nama brand, warna aksen, headline, daftar fitur, dan tanya jawab.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              Saring per kategori
            </p>
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
                    className={[
                      'min-h-11 border px-4 text-[13px] transition-colors',
                      isActive
                        ? 'border-ink bg-ink font-semibold text-paper'
                        : 'border-rule bg-surface text-ink-soft hover:border-ink hover:text-ink',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-rule pt-6">
          {loading && (
            <p
              aria-live="polite"
              aria-busy="true"
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft"
            >
              Memuat katalog template
            </p>
          )}

          {templates.length === 0 && (
            <EmptyState
              icon="0"
              title="Belum ada template aktif"
              description="Tabel template masih kosong atau seluruh baris berstatus nonaktif. Muat ulang setelah data diisi lewat panel admin."
            >
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 min-h-11 border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)]"
              >
                Muat ulang
              </button>
            </EmptyState>
          )}

          {templates.length > 0 && visible.length === 0 && (
            <div aria-live="polite">
              <EmptyBlock
                title={`Kategori ${categoryLabel(active)} belum terisi`}
                description={`Tampilkan semua kategori untuk melihat ${templates.length} template yang tersedia.`}
                actionLabel="Tampilkan semua"
                onAction={() => setActive('semua')}
              />
            </div>
          )}

          {visible.length > 0 && (
            <div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="template-grid"
            >
              {visible.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] text-ink-soft">
          <span className="border border-rule px-1.5 py-0.5 uppercase tracking-wide">Catatan</span>
          <span>
            Harga di kartu adalah harga template. Biaya eksekusi ditentukan pada langkah paket.
          </span>
        </p>
      </div>
    </Reveal>
  );
}
