'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyBlock } from '@/components/ui/EmptyBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from './Reveal';
import { TemplateCard } from './TemplateCard';
import { type PackageOption, type Template, categoryLabel, formatRupiah } from './types';
import { FALLBACK_TEMPLATES, fetchCatalogResult } from '@/lib/catalog';
import { fetchPackages } from '@/lib/packages';

// Urutan filter mengikuti segmen yang dilayani (docs/REDESIGN.md §6): label
// persis "Semua | Kuliner | Kreator | Toko Online". Kategori lain yang datang
// dari server tetap tampil setelah ketiganya.
const FILTER_ORDER = ['Kuliner', 'Kreator', 'Toko Online'];

// Katalog = rak contoh poster: judul ledger, filter bergaris, grid kartu.
// id="katalog" dan data-testid="template-grid" dipakai navigasi + tes E2E.
//
// Daftar bawaan dipakai sebagai isi awal supaya SSR tidak kosong; begitu
// fetch selesai, state menjadi "ready" atau "error" — kegagalan server TIDAK
// ditelan diam-diam (docs/REDESIGN.md §12), melainkan ditampilkan lengkap
// dengan tombol coba lagi.
export function TemplateCatalog() {
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState('semua');

  // Ref penanda komponen masih terpasang: hasil fetch telat tidak boleh
  // menulis state setelah unmount (navigasi kilat antar halaman).
  const aliveRef = useRef(true);

  // Satu jalur pemuatan untuk render awal maupun tombol "coba lagi", supaya
  // perilaku state error identik di keduanya.
  const load = useCallback(async () => {
    setStatus('loading');
    const [catalog, pkgResult] = await Promise.all([fetchCatalogResult(), fetchPackages()]);
    if (!aliveRef.current) return;
    setTemplates(catalog.templates);
    if (pkgResult.ok) setPackages(pkgResult.packages);
    if (catalog.ok) {
      setStatus('ready');
      setError(null);
    } else {
      setStatus('error');
      setError(catalog.error ?? 'Katalog tidak bisa dimuat dari server.');
    }
  }, []);

  // Pemuatan awal memakai rantai promise supaya tidak ada setState sinkron di
  // dalam effect (react-hooks/set-state-in-effect); `load` tetap dipakai tombol
  // "coba lagi" dari event handler.
  useEffect(() => {
    aliveRef.current = true;
    Promise.all([fetchCatalogResult(), fetchPackages()]).then(([catalog, pkgResult]) => {
      if (!aliveRef.current) return;
      setTemplates(catalog.templates);
      if (pkgResult.ok) setPackages(pkgResult.packages);
      if (catalog.ok) {
        setStatus('ready');
        setError(null);
      } else {
        setStatus('error');
        setError(catalog.error ?? 'Katalog tidak bisa dimuat dari server.');
      }
    });
    return () => {
      aliveRef.current = false;
    };
  }, []);


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
      ? (packages.find((pkg) => pkg.key === template.recommendedPackage) ?? null)
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
          {/* State error jujur: isi katalog tetap terbaca, tetapi kegagalan
              server disebut apa adanya dan bisa dicoba ulang. */}
          {status === 'error' && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 border border-danger bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                  Katalog belum terhubung ke server
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {error} Kartu di bawah memakai contoh bawaan, jadi harga dan rekomendasi paket
                  mungkin belum yang terbaru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
              >
                Coba lagi
              </button>
            </div>
          )}

          {status === 'loading' && (
            <p
              aria-live="polite"
              aria-busy="true"
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft"
            >
              Memuat contoh poster
            </p>
          )}

          {templates.length === 0 && (
            <EmptyState
              icon="0"
              title="Belum ada contoh poster aktif"
              description="Tabel template masih kosong atau seluruh baris berstatus nonaktif. Muat ulang setelah data diisi lewat panel admin."
            >
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 min-h-11 border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)]"
              >
                Muat ulang
              </button>
            </EmptyState>
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
            garansi ditampilkan pada bagian harga di bawah, diambil dari server.
          </span>
          {packages.length > 0 && (
            <span className="text-ok">
              Paket terbaru: {packages.map((p) => `${p.name} ${formatRupiah(p.price)}`).join(' / ')}
            </span>
          )}
        </p>
      </div>
    </Reveal>
  );
}