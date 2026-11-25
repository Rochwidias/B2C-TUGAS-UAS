import { DraftIcon } from './DraftIcon';
import type { Draft, PosterPoint } from './types';

// Badge engine: satu-satunya penanda asal konten draft. Persegi, border 1.5px,
// huruf mono (motif "cap status"), bukan pil. Nilainya berasal dari respons
// server (POST /api/drafts -> engine), jadi tidak pernah mengklaim AI aktif
// bila yang bekerja adalah generator lokal.
export function EngineBadge({ engine }: { engine: 'gemini' | 'local' | null | undefined }) {
  const map = {
    gemini: { text: 'Engine: Gemini', cls: 'border-ok text-ok' },
    local: { text: 'Engine: lokal', cls: 'border-warn text-warn' },
  } as const;

  const entry = engine && map[engine];

  return (
    <span
      className={[
        'inline-flex items-center gap-2 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]',
        entry ? entry.cls : 'border-rule text-ink-soft',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={['size-1.5', entry ? 'bg-current' : 'border border-current'].join(' ')}
      />
      {entry ? entry.text : 'Belum digenerate'}
    </span>
  );
}

function tint(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : 'transparent';
}

function isHex(hex: string | undefined): hex is string {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Kontras WCAG AA di atas warna theme (docs/REDESIGN.md §4): amber terang
 *  butuh tinta gelap, navy/violet butuh tinta putih. Dihitung dari luminansi,
 *  bukan ditebak per warna. */
function readableInk(hex: string): string {
  if (!isHex(hex)) return '#16162e';
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.45 ? '#16162e' : '#ffffff';
}

/** Isi poster menurut skema §4. Field lama (heroSection) masih dibaca bila
 *  baris draft berasal dari database yang dibuat sebelum redesign. */
export function draftPoster(draft: Draft): {
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
} {
  const source = draft.poster ?? draft.heroSection;
  return {
    badge: source?.badge ?? '',
    headline: source?.headline ?? draft.brand?.name ?? '',
    subheadline: source?.subheadline ?? draft.brand?.tagline ?? '',
    ctaText: source?.ctaText ?? '',
  };
}

/** Tepat tiga poin (§4); baris lama memakai `features`. */
export function draftPoints(draft: Draft): PosterPoint[] {
  const source = draft.points ?? draft.features ?? [];
  return source.filter(Boolean).slice(0, 3);
}

/**
 * Pratinjau poster: merender isi draft apa adanya — badge, headline,
 * subheadline, tombol ajakan, dan tepat tiga poin — pada lembar ber-rasio ± 4:5,
 * sesuai produk yang dikirim. Warna dan teks berasal dari respons server,
 * bukan mockup.
 */
export function DraftPreview({ draft }: { draft: Draft }) {
  const poster = draftPoster(draft);
  const points = draftPoints(draft);
  const theme = draft.theme ?? { primaryColor: '', accentColor: '', fontPairing: '' };
  const primary = isHex(theme.primaryColor) ? theme.primaryColor : '#8b5cf6';
  const accent = isHex(theme.accentColor) ? theme.accentColor : '#6d28d9';
  const onPrimary = readableInk(primary);
  const onAccent = readableInk(accent);
  const brandName = draft.brand?.name ?? '';
  const brandTagline = draft.brand?.tagline ?? '';

  return (
    <div className="border border-rule bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Pratinjau poster / lembar hasil
        </span>
        <span className="font-mono text-[10px] text-ink-soft">
          {theme.fontPairing ? `Font: ${theme.fontPairing}` : 'Rasio 4:5'}
        </span>
      </div>

      {/* Lembar poster: rasio ± 4:5, seluruh isi datang dari draft. */}
      <div className="bg-paper p-4 sm:p-6">
        <div className="mx-auto flex aspect-[4/5] w-full max-w-[520px] flex-col justify-between overflow-hidden border border-rule bg-surface">
          {/* Pita kepala: warna theme + nama brand. */}
          <div
            className="flex items-center justify-between gap-3 px-[6%] py-[3.5%]"
            style={{ backgroundColor: primary, color: onPrimary }}
          >
            <span className="truncate text-[13px] font-semibold sm:text-[15px]">{brandName}</span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] opacity-90 sm:text-[10px]">
              Poster
            </span>
          </div>

          {/* Badan poster */}
          <div className="flex flex-1 flex-col justify-center gap-[3%] px-[7%] py-[5%]">
            {poster.badge && (
              <span
                className="w-fit border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] sm:text-[10px]"
                style={{
                  backgroundColor: tint(primary, '1A'),
                  borderColor: tint(primary, '59'),
                  color: primary,
                }}
              >
                {poster.badge}
              </span>
            )}

            <h3
              className="font-semibold leading-[1.08] tracking-tight text-ink"
              style={{ fontSize: 'clamp(1.1rem, 4.4vw, 1.95rem)' }}
            >
              {poster.headline}
            </h3>

            <p
              className="leading-relaxed text-ink-soft"
              style={{ fontSize: 'clamp(0.74rem, 2.3vw, 0.94rem)' }}
            >
              {poster.subheadline}
            </p>

            {poster.ctaText && (
              <span
                className="mt-[2%] inline-flex w-fit items-center px-4 py-2.5 font-semibold"
                style={{
                  backgroundColor: primary,
                  color: onPrimary,
                  fontSize: 'clamp(0.74rem, 2.2vw, 0.9rem)',
                }}
              >
                {poster.ctaText}
              </span>
            )}
          </div>

          {/* Tepat tiga poin penawaran */}
          {points.length > 0 && (
            <ul
              className="grid grid-cols-3 gap-[2.5%] border-t px-[7%] py-[4%]"
              style={{ borderColor: tint(primary, '33') }}
            >
              {points.map((point, index) => (
                <li key={`${point.title}-${index}`} className="min-w-0">
                  <span
                    aria-hidden="true"
                    className="grid size-5 place-items-center sm:size-6"
                    style={{ backgroundColor: tint(accent, '1F'), color: accent }}
                  >
                    <DraftIcon name={point.icon} className="size-3 sm:size-3.5" />
                  </span>
                  <p
                    className="mt-1.5 font-semibold leading-snug text-ink"
                    style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.78rem)' }}
                  >
                    {point.title}
                  </p>
                  <p
                    className="mt-1 leading-relaxed text-ink-soft"
                    style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.7rem)' }}
                  >
                    {point.description}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Pita kaki: aksen kedua + tagline brand. */}
          <div
            className="flex items-center justify-between gap-3 px-[6%] py-[3%]"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            <span className="truncate text-[10px] font-medium sm:text-[12px]">{brandTagline}</span>
            <span aria-hidden="true" className="shrink-0 font-mono text-[9px] sm:text-[10px]">
              4:5
            </span>
          </div>
        </div>
      </div>

      <p className="border-t border-rule px-4 py-2 font-mono text-[10px] leading-relaxed text-ink-soft">
        Warna, badge, headline, subheadline, tombol ajakan, dan tiga poin di atas berasal dari
        respons server — bukan mockup.
      </p>
    </div>
  );
}