'use client';

import { useMemo, useState } from 'react';
import { EmptyBlock } from '@/components/ui/EmptyBlock';
import { Reveal } from './Reveal';
import { TemplateCard } from './TemplateCard';
import { type PackageOption, type Template, categoryLabel } from './types';
import { CATALOG_TEMPLATES } from '@/lib/catalog';
import { PACKAGES } from '@/lib/packages';

// Urutan filter mengikuti segmen yang dilayani (docs/REDESIGN.md §6): label
// persis "Semua | Kuliner | Kreator | Toko Online". Kategori lain tetap tampil
// setelah ketiganya.
const FILTER_ORDER = ['Kuliner', 'Kreator', 'Toko Online'];

// Katalog = rak contoh poster: judul ledger, filter bergaris, grid kartu.
// id="katalog" dan data-testid="template-grid" dipakai navigasi + tes E2E.
// Data statis dari CATALOG_TEMPLATES (docs/FRONTEND-ONLY.md) — tidak ada
// fetch, tidak ada state loading/error.
export function TemplateCatalog() {
  const templates: Template[] = CATALOG_TEMPLATES;
  const [active, setActive] = useState('semua');

  const categories = useMemo(() => {
    const seen: string[] = [];
    templates.forEach((t) => {
      const label = categoryLabel(t.category);
      if (!seen.includes(label)) seen.push(label);
    });
    const ordered = FILTER_ORDER.filter((label) => seen.includes(label));
    return [...ordered, ...seen.filter((label) => !FILTER_ORDER.includes(label))];
  }, [templates]);

  const visible = useMemo(() => {
    if (active === 'semua') return templates;
    return templates.filter((t) => categoryLabel(t.category) === active);
  }, [templates, active]);

  const filters = [{ key: 'semua', label: 'Semua' }, ...categories.map((label) => ({ key: label, label }))];

  const packageFor = (template: Template): PackageOption | null =>
    template.recommendedPackage
      ? (PACKAGES.find((pkg) => pkg.key === template.recommendedPackage) ?? null)
      : null;

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
              Rak 02 / Contoh poster
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
              Contoh poster per segmen usaha
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              Pilih segmen yang paling dekat dengan usaha Anda. Yang berubah setelah brief masuk:
              nama brand, warna aksen, headline, tombol ajakan, dan tiga poin penawaran.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              Saring per segmen
            </p>
            <div role="group" aria-label="Filter segmen poster" className="flex flex-wrap gap-2">
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
          {templates.length === 0 && (
            <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
              Daftar contoh poster kosong.
            </p>
          )}

          {templates.length > 0 && visible.length === 0 && (
            <div aria-live="polite">
              <EmptyBlock
                title={`Segmen ${active} belum terisi`}
                description={`Tampilkan semua segmen untuk melihat ${templates.length} contoh poster yang tersedia.`}
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
                <TemplateCard key={t.id} template={t} recommended={packageFor(t)} />
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] text-ink-soft">
          <span className="border border-rule px-1.5 py-0.5 uppercase tracking-wide">Catatan</span>
          <span>
            Harga pada kartu adalah harga satuan per poster. Paket hemat, estimasi waktu, dan
            garansi ditampilkan pada bagian harga di bawah.
          </span>
          {PACKAGES.length > 0 && (
            <span className="text-ok">
              Paket tersedia: {PACKAGES.map((p) => `${p.name}`).join(' / ')}
            </span>
          )}
        </p>
      </div>
    </Reveal>
  );
}
