// Renderer draft -> satu file HTML mandiri untuk GET /api/export/[draftId].
// Tanpa CDN: CSS di-inline, font memakai stack sistem, gambar tidak dibutuhkan.

import type { Draft, Template } from '../types';

const escapeHtml = (value: string): string =>
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
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z|M7 11V7a5 5 0 0 1 10 0v4',
  folders: 'M8 17a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l.6.8a2 2 0 0 0 1.6.8H20a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z|M4 19a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h12.4a2 2 0 0 1 1.6.8l.6.8a2 2 0 0 0 1.6.8H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2Z',
  handshake: 'm11 17 2 2a1 1 0 1 0 3-3|m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4|m21 3 1 11h-2|M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3|M3 4h8',
  'trending-up': 'M16 7h6v6|M22 7l-8.5 8.5-5-5L2 17',
  star: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z',
};

/** SVG inline per nama ikon; fallback: emoji/teks apa adanya (mis. output Gemini). */
function iconSvg(name: string): string {
  const paths = ICON_PATHS[name];
  if (!paths) return escapeHtml(name);
  const inner = paths
    .split('|')
    .map((p) =>
      p.startsWith('circle ')
        ? (() => {
            const [, cx, cy, r] = p.split(/[, ]+/);
            return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
          })()
        : `<path d="${p}"/>`,
    )
    .join('');
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

export function renderDraftToHtml(draft: Draft, templateMeta?: Partial<Template> | null): string {
  const primary = draft.theme.primaryColor;
  const accent = draft.theme.accentColor;
  const onPrimary = readableOn(primary);
  const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  const templateName = templateMeta?.name ?? 'Template CraftAI Studio';
  const brandIcon = iconSvg('star');

  const featuresHtml = draft.features
    .map(
      (feature) => `      <article class="card">
        <span class="card-icon" aria-hidden="true">${iconSvg(feature.icon)}</span>
        <h3>${escapeHtml(feature.title)}</h3>
        <p>${escapeHtml(feature.description)}</p>
      </article>`,
    )
    .join('\n');

  const faqHtml = draft.faq
    .map(
      (item) => `      <details class="faq-item">
        <summary>${escapeHtml(item.q)}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(draft.brand.name)} — ${escapeHtml(draft.brand.tagline)}</title>
<meta name="description" content="${escapeHtml(draft.brand.about)}">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --primary-soft: ${withAlpha(primary, 0.14)};
    --on-primary: ${onPrimary};
    --bg: #0b1120;
    --surface: #111a2e;
    --surface-2: #16213a;
    --border: #24304d;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --font: ${fontStack};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  .container { width: min(1080px, 100% - 2.5rem); margin-inline: auto; }
  header.site {
    position: sticky; top: 0; z-index: 10;
    background: rgba(11, 17, 32, 0.85);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
  }
  .nav { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 1rem; }
  .brand-mark { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; letter-spacing: -0.01em; }
  .brand-mark span.dot {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    display: grid; place-items: center;
    color: var(--on-primary);
  }
  .nav-links { display: flex; gap: 1.4rem; font-size: 0.9rem; color: var(--muted); }
  .nav-links a { text-decoration: none; }
  .nav-links a:hover, .nav-links a:focus-visible { color: var(--text); }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.7rem 1.3rem; border-radius: 12px; border: 1px solid transparent;
    font-size: 0.95rem; font-weight: 600; text-decoration: none; cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  .btn:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
  .btn-primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 10px 30px -12px ${withAlpha(primary, 0.8)}; }
  .btn-primary:hover { transform: translateY(-2px); background: var(--accent); color: #fff; }
  .btn-ghost { background: var(--surface); color: var(--text); border-color: var(--border); }
  .btn-ghost:hover { background: var(--surface-2); }
  .hero { padding: 5rem 0 4rem; position: relative; overflow: hidden; }
  .hero::before {
    content: ""; position: absolute; inset: -40% -20% auto;
    height: 420px; background: radial-gradient(circle at 30% 40%, var(--primary-soft), transparent 60%);
    pointer-events: none;
  }
  .badge {
    display: inline-block; padding: 0.35rem 0.9rem; border-radius: 999px;
    background: var(--primary-soft); border: 1px solid ${withAlpha(primary, 0.4)};
    color: var(--primary); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em;
  }
  .hero h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.15; margin: 1.2rem 0 1rem; letter-spacing: -0.02em; }
  .hero p.lead { font-size: 1.1rem; color: var(--muted); max-width: 62ch; margin: 0 0 2rem; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; }
  section.block { padding: 3.5rem 0; border-top: 1px solid var(--border); }
  section.block h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin: 0 0 0.6rem; letter-spacing: -0.01em; }
  section.block > .container > p.section-lead { color: var(--muted); margin: 0 0 2rem; max-width: 64ch; }
  .grid { display: grid; gap: 1.2rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.6rem; transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .card:hover { border-color: var(--primary); transform: translateY(-3px); }
  .card-icon {
    display: grid; place-items: center; width: 46px; height: 46px; border-radius: 12px;
    background: var(--primary-soft); color: var(--primary); margin-bottom: 0.9rem;
  }
  .icon { width: 24px; height: 24px; }
  .card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; }
  .card p { margin: 0; color: var(--muted); font-size: 0.94rem; }
  .faq-item {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 0.4rem 1.2rem; margin-bottom: 0.8rem;
  }
  .faq-item summary { cursor: pointer; font-weight: 600; padding: 0.8rem 0; list-style: none; position: relative; padding-right: 1.6rem; }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::after { content: "+"; position: absolute; right: 0; color: var(--primary); font-size: 1.2rem; }
  .faq-item[open] summary::after { content: "–"; }
  .faq-item summary:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 8px; }
  .faq-item p { margin: 0 0 1rem; color: var(--muted); font-size: 0.95rem; }
  .cta-band {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: var(--on-primary); border-radius: 20px; padding: 2.6rem; text-align: center;
  }
  .cta-band h2 { margin: 0 0 0.6rem; }
  .cta-band p { margin: 0 auto 1.6rem; opacity: 0.9; max-width: 56ch; }
  .cta-band .btn { background: rgba(255, 255, 255, 0.94); color: #0f172a; }
  .cta-band .btn:hover { background: #fff; }
  footer.site { border-top: 1px solid var(--border); padding: 2rem 0; color: var(--muted); font-size: 0.85rem; }
  footer.site .container { display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: space-between; }
  @media (max-width: 640px) {
    .nav-links { display: none; }
    .hero { padding: 3.2rem 0 2.6rem; }
    .cta-band { padding: 1.8rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>
</head>
<body>
<header class="site">
  <div class="container nav">
    <div class="brand-mark"><span class="dot" aria-hidden="true">${brandIcon}</span>${escapeHtml(draft.brand.name)}</div>
    <nav class="nav-links" aria-label="Navigasi utama">
      <a href="#fitur">Fitur</a>
      <a href="#faq">FAQ</a>
      <a href="#kontak">Kontak</a>
    </nav>
    <a class="btn btn-primary" href="#kontak">${escapeHtml(draft.heroSection.ctaText)}</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="container">
      <span class="badge">${escapeHtml(draft.heroSection.badge)}</span>
      <h1>${escapeHtml(draft.heroSection.headline)}</h1>
      <p class="lead">${escapeHtml(draft.heroSection.subheadline)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#kontak">${escapeHtml(draft.heroSection.ctaText)}</a>
        <a class="btn btn-ghost" href="#fitur">Lihat Keunggulan</a>
      </div>
    </div>
  </section>

  <section class="block" id="tentang">
    <div class="container">
      <h2>Tentang ${escapeHtml(draft.brand.name)}</h2>
      <p class="section-lead">${escapeHtml(draft.brand.about)}</p>
    </div>
  </section>

  <section class="block" id="fitur">
    <div class="container">
      <h2>Kenapa Memilih Kami</h2>
      <p class="section-lead">Tiga alasan utama pelanggan ${escapeHtml(draft.brand.name)} bertahan.</p>
      <div class="grid">
${featuresHtml}
      </div>
    </div>
  </section>

  <section class="block" id="faq">
    <div class="container">
      <h2>Pertanyaan Umum</h2>
      <p class="section-lead">Yang paling sering ditanyakan sebelum memesan.</p>
      ${faqHtml}
    </div>
  </section>

  <section class="block" id="kontak">
    <div class="container">
      <div class="cta-band">
        <h2>Siap Memulai?</h2>
        <p>${escapeHtml(draft.brand.tagline)}</p>
        <a class="btn" href="mailto:halo@example.com">${escapeHtml(draft.heroSection.ctaText)}</a>
      </div>
    </div>
  </section>
</main>

<footer class="site">
  <div class="container">
    <span>© ${new Date().getFullYear()} ${escapeHtml(draft.brand.name)}. Seluruh hak cipta dilindungi.</span>
    <span>Template: ${escapeHtml(templateName)} · Dibuat dengan CraftAI Studio</span>
  </div>
</footer>
</body>
</html>
`;
}