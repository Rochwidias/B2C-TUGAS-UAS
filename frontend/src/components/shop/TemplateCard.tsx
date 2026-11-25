import Link from 'next/link';
import {
  type PackageOption,
  type Template,
  categoryLabel,
  formatRupiah,
  packageSummary,
} from './types';

// Kartu contoh poster: permukaan putih bersih, garis 1px, bayangan keras yang
// bergeser saat hover (tanpa blur). Kartu menampilkan harga satuan dan, bila
// tersedia, paket yang disarankan untuk segmen itu (recommendedPackage pada
// CATALOG_TEMPLATES) — nama paket diambil dari PACKAGES, bukan ditulis tangan.
export function TemplateCard({
  template,
  recommended = null,
}: {
  template: Template;
  recommended?: PackageOption | null;
}) {
  return (
    <article className="group relative flex h-full flex-col border border-rule bg-surface transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]">
      {/* preview_gradient adalah CSS gradient dari DB; dipakai apa adanya. */}
      <div
        className="h-20 border-b border-rule"
        style={{ backgroundImage: template.preview_gradient }}
      >
        <span className="sr-only">{`Pita warna contoh poster ${template.name}`}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-ink-soft">
          <span className="border border-rule px-1.5 py-0.5 uppercase tracking-wide">
            {categoryLabel(template.category)}
          </span>
          <span aria-hidden="true">{template.emoji}</span>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[22px] font-semibold leading-tight tracking-tight">
            {/* Satu link untuk seluruh kartu: pseudo-elemen `after` membentang
                ke seluruh kartu (posisi absolut terhadap <article>), sementara
                link itu sendiri tetap setinggi 44px supaya target sentuh cukup.
                Pola ini menghindari dua link untuk tujuan yang sama. */}
            <Link
              href={`/customizer/${template.id}`}
              className="inline-flex min-h-11 items-center hover:underline after:absolute after:inset-0 after:content-['']"
            >
              {template.name}
            </Link>
          </h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">{template.description}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-rule pt-4">
          <p className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="text-ink-soft">Harga satuan</span>
            <span className="font-mono">{formatRupiah(template.base_price)}</span>
          </p>
          {recommended && (
            <p className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="text-ink-soft">Paket disarankan</span>
              <span className="font-mono">{recommended.name}</span>
            </p>
          )}
          <span className="inline-flex min-h-11 items-center justify-between gap-2 border border-rule bg-paper px-3 text-[13px] font-medium transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
            <span>Kustomisasi &amp; pesan</span>
            <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </div>

      {recommended && (
        <span className="sr-only">
          {`Contoh poster ini disarankan memakai ${recommended.name}: ${packageSummary(recommended)}.`}
        </span>
      )}
    </article>
  );
}