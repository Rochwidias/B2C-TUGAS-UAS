// Renderer draft -> HTML poster SIAP PAKAI untuk GET /api/export/[draftId]
// (docs/REDESIGN.md §4): rasio poster ± 4:5, headline besar, badge, 3 poin,
// CTA, dan warna theme — bukan halaman website lagi.
// Tanpa CDN: CSS di-inline, font memakai stack sistem, gambar tidak dibutuhkan.

import type { Draft, DraftPoint, Template } from '../types';

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Kontras teks di atas warna utama (WCAG): gelap bila warnanya terang. */
function readableOn(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Path SVG per nama ikon (dari Lucide; stroke=2, viewBox 0 0 24 24).
// Menjaga ikon export tetap SVG, bukan emoji — sama dengan render React.
const ICON_PATHS: Record<string, string> = {
  utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  'map-pin': 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z|M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'message-circle': 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
  'shopping-bag': 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z|M3 6h18|M16 10a4 4 0 0 1-8 0',
  truck: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2|M15 18H9|M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14|M9 18h6|circle 17,18,r2|circle 7,18,r2',
  star: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
  tag: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z|circle 7.5,7.5,r0.5',
  clock: 'M12 6v6l4 2|circle 12,12,r10',
  sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
  layers: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z|M22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65|M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65',
  handshake: 'm11 17 2 2a1 1 0 1 0 3-3|m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4|m21 3 1 11h-2|M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3|M3 4h8',
  megaphone: 'm3 11 18-5v12L3 14v-3z|M11.6 16.8a3 3 0 1 1-5.8-1.6',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z',
};

/** SVG inline per nama ikon; fallback: emoji/teks apa adanya (mis. output Gemini). */
function iconSvg(name: string): string {
  const paths = ICON_PATHS[name];
  if (!paths) return escapeHtml(name);
  const inner = paths
    .split('|')
    .map((path) =>
      path.startsWith('circle ')
        ? (() => {
            const [, cx, cy, r] = path.split(/[, ]+/);
            return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
          })()
        : `<path d="${path}"/>`,
    )
    .join('');
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

function pointHtml(point: DraftPoint, index: number): string {
  return `      <article class="point">
        <span class="point-icon" aria-hidden="true">${iconSvg(point.icon)}</span>
        <div class="point-text">
          <h3>${escapeHtml(point.title)}</h3>
          <p>${escapeHtml(point.description)}</p>
        </div>
        <span class="point-index" aria-hidden="true">0${index + 1}</span>
      </article>`;
}

export function renderDraftToHtml(draft: Draft, templateMeta?: Partial<Template> | null): string {
  const primary = draft.theme.primaryColor;
  const accent = draft.theme.accentColor;
  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);
  const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  const templateName = templateMeta?.name ?? 'Poster Aether Creative';
  const pointsHtml = draft.points.map(pointHtml).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(draft.poster.headline)} — ${escapeHtml(draft.brand.name)}</title>
<meta name="description" content="${escapeHtml(draft.poster.subheadline)}">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --on-primary: ${onPrimary};
    --on-accent: ${onAccent};
    --primary-soft: ${withAlpha(primary, 0.16)};
    --paper: #f6f5fb;
    --surface: #ffffff;
    --ink: #16162e;
    --ink-soft: #5b5b7d;
    --rule: #e3e1f0;
    --font: ${fontStack};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    display: flex;
    justify-content: center;
    padding: clamp(12px, 3vw, 28px) clamp(8px, 2vw, 16px);
  }
  /* Rasio poster ± 4:5 — sama dengan preview live di aplikasi. */
  .poster {
    width: min(640px, 100%);
    aspect-ratio: 4 / 5;
    background:
      radial-gradient(circle at 10% -10%, ${withAlpha(primary, 0.38)}, transparent 55%),
      radial-gradient(circle at 96% 104%, ${withAlpha(accent, 0.34)}, transparent 55%),
      var(--surface);
    border: 1px solid var(--rule);
    border-radius: clamp(16px, 3vw, 26px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: clamp(18px, 4vw, 40px);
    box-shadow: 0 24px 60px -32px rgba(22, 22, 46, 0.5);
  }
  .poster-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: var(--primary);
    color: var(--on-primary);
    font-size: clamp(0.66rem, 1.6vw, 0.85rem);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .brand {
    font-size: clamp(0.7rem, 1.7vw, 0.9rem);
    font-weight: 700;
    color: var(--ink-soft);
    letter-spacing: 0.02em;
    text-align: right;
  }
  .headline {
    font-size: clamp(1.7rem, 5.6vw, 3rem);
    line-height: 1.06;
    letter-spacing: -0.02em;
    margin: clamp(12px, 3vw, 26px) 0 8px;
    font-weight: 800;
    color: var(--ink);
    text-wrap: balance;
  }
  .subheadline {
    margin: 0;
    font-size: clamp(0.8rem, 2vw, 1.02rem);
    color: var(--ink-soft);
    max-width: 46ch;
  }
  .points {
    display: grid;
    gap: clamp(7px, 1.6vw, 14px);
    margin: clamp(14px, 3vw, 26px) 0 0;
    flex: 1;
    align-content: start;
  }
  .point {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: clamp(8px, 2vw, 16px);
    background: var(--surface);
    border: 1px solid var(--rule);
    border-left: 4px solid var(--accent);
    border-radius: clamp(10px, 2vw, 14px);
    padding: clamp(8px, 1.8vw, 16px);
  }
  .point-icon {
    display: grid;
    place-items: center;
    width: clamp(28px, 5vw, 40px);
    height: clamp(28px, 5vw, 40px);
    border-radius: 10px;
    background: var(--primary-soft);
    color: var(--accent);
    flex: none;
  }
  .icon { width: 20px; height: 20px; }
  .point-text h3 {
    margin: 0 0 2px;
    font-size: clamp(0.78rem, 1.9vw, 0.98rem);
    font-weight: 700;
    color: var(--ink);
  }
  .point-text p {
    margin: 0;
    font-size: clamp(0.68rem, 1.6vw, 0.85rem);
    color: var(--ink-soft);
  }
  .point-index {
    position: absolute;
    right: 10px;
    top: 8px;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--rule);
  }
  .cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: clamp(12px, 3vw, 24px);
    padding: clamp(10px, 2.2vw, 20px);
    border-radius: clamp(10px, 2vw, 16px);
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: var(--on-primary);
  }
  .cta-label {
    font-size: clamp(0.66rem, 1.7vw, 0.85rem);
    opacity: 0.92;
    margin: 0;
    max-width: 34ch;
  }
  .cta-button {
    display: inline-block;
    padding: clamp(8px, 2vw, 14px) clamp(14px, 3vw, 26px);
    border-radius: 999px;
    background: #ffffff;
    color: #14142b;
    font-weight: 700;
    font-size: clamp(0.78rem, 2vw, 0.98rem);
    text-decoration: none;
    white-space: nowrap;
  }
  .cta-button:focus-visible { outline: 3px solid var(--on-accent); outline-offset: 2px; }
  .poster-footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: clamp(8px, 2vw, 16px);
    font-size: clamp(0.58rem, 1.5vw, 0.72rem);
    color: var(--ink-soft);
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .poster { box-shadow: none; border: none; border-radius: 0; width: 100%; }
  }
</style>
</head>
<body>
<main class="poster" role="article" aria-label="Poster ${escapeHtml(draft.brand.name)}">
  <div class="poster-top">
    <span class="badge">${escapeHtml(draft.poster.badge)}</span>
    <span class="brand">${escapeHtml(draft.brand.name)}</span>
  </div>

  <h1 class="headline">${escapeHtml(draft.poster.headline)}</h1>
  <p class="subheadline">${escapeHtml(draft.poster.subheadline)}</p>

  <div class="points">
${pointsHtml}
  </div>

  <div class="cta">
    <p class="cta-label">${escapeHtml(draft.brand.tagline)}</p>
    <a class="cta-button" href="#pesan">${escapeHtml(draft.poster.ctaText)}</a>
  </div>

  <footer class="poster-footer">
    <span>${escapeHtml(draft.brand.about)}</span>
    <span>${escapeHtml(templateName)} · Aether Creative</span>
  </footer>
</main>
</body>
</html>
`;
}