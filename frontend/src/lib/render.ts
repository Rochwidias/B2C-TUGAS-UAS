// Renderer draft -> satu file HTML mandiri untuk GET /api/export/[draftId].
// Tanpa CDN: CSS di-inline, font memakai stack sistem, gambar tidak dibutuhkan.

import type { Draft, Template } from './types';

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

export function renderDraftToHtml(draft: Draft, templateMeta?: Partial<Template> | null): string {
  const primary = draft.theme.primaryColor;
  const accent = draft.theme.accentColor;
  const onPrimary = readableOn(primary);
  const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  const templateName = templateMeta?.name ?? 'Template CraftAI Studio';
  const emoji = templateMeta?.emoji ?? '✨';

  const featuresHtml = draft.features
    .map(
      (feature) => `      <article class="card">
        <span class="card-icon" aria-hidden="true">${escapeHtml(feature.icon)}</span>
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
    display: grid; place-items: center; font-size: 1rem;
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
    background: var(--primary-soft); font-size: 1.3rem; margin-bottom: 0.9rem;
  }
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
    <div class="brand-mark"><span class="dot" aria-hidden="true">${escapeHtml(emoji)}</span>${escapeHtml(draft.brand.name)}</div>
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