// Pratinjau poster untuk back-office. Sengaja ditulis di folder admin: komponen
// preview milik shop sedang berpindah ke skema poster secara paralel, dan halaman
// detail tidak boleh ikut patah karenanya. Warna berasal dari data draft, jadi
// hanya warna yang ditulis inline — token tema (kertas/tinta/garis) tetap dipakai
// untuk sisanya supaya mode gelap ikut bekerja.

import type { Draft, DraftPoint } from './types';

interface PosterView {
  brandName: string;
  tagline: string;
  initial: string;
  primary: string;
  accent: string;
  fontPairing: string;
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  points: DraftPoint[];
}

/** Nilai hex valid dipakai apa adanya; selain itu warna netral dari token tema. */
function hex(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value.trim())
    ? value.trim()
    : fallback;
}

function tint(base: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(base) ? `${base}${alpha}` : 'transparent';
}

/**
 * Teks di atas warna brand harus tetap lolos WCAG AA. Warna terang diberi tinta
 * gelap, warna gelap diberi tinta terang (docs/REDESIGN.md §4 --accent-ink).
 */
function readableInk(background: string): string {
  const value = background.replace('#', '');
  if (value.length !== 6) return '#14142b';
  const channel = (index: number) => {
    const raw = Number.parseInt(value.slice(index, index + 2), 16);
    const srgb = raw / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.45 ? '#14142b' : '#ffffff';
}

/**
 * Samakan draft poster (§4) dengan bentuk lama selama transisi backend:
 * `poster`/`points` bila ada, kalau tidak `heroSection`/`features`.
 */
export function toPosterView(content: Draft): PosterView {
  const head = content.poster ?? content.heroSection;
  const points = (content.points ?? content.features ?? []).slice(0, 3);
  const primary = hex(content.theme?.primaryColor, '#7c3aed');
  const accent = hex(content.theme?.accentColor, '#6d28d9');
  const brandName = content.brand?.name?.trim() || 'Tanpa nama';

  return {
    brandName,
    tagline: content.brand?.tagline?.trim() || '',
    initial: brandName.charAt(0).toUpperCase() || 'A',
    primary,
    accent,
    fontPairing: content.theme?.fontPairing?.trim() || '—',
    badge: head?.badge?.trim() || '',
    headline: head?.headline?.trim() || 'Judul poster belum tersedia.',
    subheadline: head?.subheadline?.trim() || '',
    ctaText: head?.ctaText?.trim() || '',
    points,
  };
}

/** Bingkai lembar poster rasio ±4:5, isi disusun vertikal seperti poster asli. */
export default function PosterPreview({ content }: { content: Draft }) {
  const view = toPosterView(content);
  const ink = readableInk(view.accent);
  const inkPrimary = readableInk(view.primary);

  return (
    <figure className="flex min-w-0 flex-col border border-rule bg-surface">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-rule px-3 py-2">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-ink-soft uppercase">
          Pratinjau poster
        </span>
        <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
          4:5
        </span>
      </figcaption>

      <div className="flex justify-center bg-paper px-3 py-4 sm:px-5">
        <div
          className="flex w-full max-w-[400px] flex-col overflow-hidden border-[1.5px] border-ink p-4 sm:p-5"
          style={{ aspectRatio: '4 / 5', backgroundColor: tint(view.primary, '16') }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center text-[13px] font-bold"
                style={{ backgroundColor: view.primary, color: inkPrimary }}
              >
                {view.initial}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] leading-tight font-semibold text-ink">
                  {view.brandName}
                </span>
                {view.tagline ? (
                  <span className="block truncate text-[10px] leading-tight text-ink-soft">
                    {view.tagline}
                  </span>
                ) : null}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[9px] tracking-wide text-ink-soft uppercase">
              {view.fontPairing}
            </span>
          </div>

          <div className="mt-4 flex-1 overflow-hidden">
            {view.badge ? (
              <span
                className="inline-block px-2 py-0.5 font-mono text-[9.5px] tracking-[0.1em] uppercase"
                style={{ backgroundColor: view.accent, color: ink }}
              >
                {view.badge}
              </span>
            ) : null}
            <h3 className="mt-2.5 text-[22px] leading-[1.05] font-semibold tracking-tight break-words text-ink sm:text-[26px]">
              {view.headline}
            </h3>
            {view.subheadline ? (
              <p className="mt-2 text-[12px] leading-relaxed break-words text-ink-soft">
                {view.subheadline}
              </p>
            ) : null}

            {view.points.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {view.points.map((point, index) => (
                  <li
                    key={`${point.title}-${index}`}
                    className="flex gap-2 border-l-2 pl-2"
                    style={{ borderColor: view.primary }}
                  >
                    {/* Ikon berasal dari brief customer: teks isi, bukan ikon antarmuka. */}
                    <span aria-hidden="true" className="shrink-0 font-mono text-[10px] text-ink-soft">
                      {point.icon}
                    </span>
                    <span className="min-w-0 text-[11px] leading-snug">
                      <span className="font-semibold text-ink">{point.title}</span>{' '}
                      <span className="text-ink-soft">{point.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {view.ctaText ? (
            <p
              className="mt-3 self-start px-3 py-1.5 text-[12px] font-semibold"
              style={{ backgroundColor: view.accent, color: ink }}
            >
              {view.ctaText}
            </p>
          ) : null}
        </div>
      </div>

      <p className="border-t border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Judul, poin, dan warna di atas dibaca dari respons server — bukan mockup.
      </p>
    </figure>
  );
}