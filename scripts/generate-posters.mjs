import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Menghasilkan poster SVG bergaya galeri untuk data seed, supaya project
 * punya aset visual tanpa bergantung pada gambar eksternal.
 */
const posters = [
  { slug: "cyberpunk-sunset", title: ["CYBERPUNK", "SUNSET"], a: "#1b1035", b: "#ff5e3a", ink: "#ffe9d6", accent: "#ffb199" },
  { slug: "neon-rain-district", title: ["NEON RAIN", "DISTRICT"], a: "#061a2b", b: "#0f6b7a", ink: "#d9fbff", accent: "#39e0e8" },
  { slug: "quiet-geometry", title: ["QUIET", "GEOMETRY"], a: "#efe7db", b: "#d9cbb8", ink: "#2b2620", accent: "#a8603c" },
  { slug: "ruang-sunyi", title: ["RUANG", "SUNYI"], a: "#e8e2d8", b: "#c9bfae", ink: "#242019", accent: "#6d6253" },
  { slug: "analog-sunset", title: ["ANALOG", "SUNSET"], a: "#3a130f", b: "#f08a3c", ink: "#ffe3bd", accent: "#ffd07a" },
  { slug: "toko-kaset-1987", title: ["TOKO KASET", "1987"], a: "#14201a", b: "#4c6b3f", ink: "#f2f6df", accent: "#d5e36a" },
  { slug: "kabut-dieng", title: ["KABUT", "DIENG"], a: "#1c2b2a", b: "#7fa39a", ink: "#eef7f2", accent: "#cfe4da" },
  { slug: "garis-pantai", title: ["GARIS", "PANTAI"], a: "#123246", b: "#7fb8c9", ink: "#f0faff", accent: "#d8f1f8" },
  { slug: "bentuk-tanpa-nama", title: ["BENTUK", "TANPA NAMA"], a: "#241726", b: "#6b3f6e", ink: "#fbeaff", accent: "#e3a6e8" },
  { slug: "kromatik-ii", title: ["KROMATIK", "II"], a: "#2b1208", b: "#8a3d1f", ink: "#ffe8d6", accent: "#ff9e5e" },
  { slug: "tinggal-sedikit-lagi", title: ["TINGGAL", "SEDIKIT LAGI"], a: "#111111", b: "#3a3a3a", ink: "#f5f2ea", accent: "#e8d9a0" },
  { slug: "jangan-terlalu-serius", title: ["JANGAN TERLALU", "SERIUS"], a: "#f1ede2", b: "#e2d9c4", ink: "#1d1a14", accent: "#b3402a" },
];

function esc(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSvg(p, index) {
  const lines = p.title
    .map(
      (line, i) =>
        `<text x="72" y="${810 + i * 96}" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="700" letter-spacing="-2" fill="${p.ink}">${esc(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="100%" stop-color="${p.b}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="${220 + index * 37}" cy="420" r="300" fill="url(#glow)" opacity="0.55"/>
  <circle cx="${640 - index * 21}" cy="300" r="150" fill="none" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="1.5"/>
  <path d="M0 700 Q 240 560 450 690 T 900 640" fill="none" stroke="${p.ink}" stroke-opacity="0.25" stroke-width="1.5"/>
  <rect x="0" y="0" width="900" height="1200" filter="url(#grain)" opacity="0.06"/>
  <rect x="48" y="48" width="804" height="1104" fill="none" stroke="${p.ink}" stroke-opacity="0.25" stroke-width="1.5"/>
  <text x="72" y="150" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="7" fill="${p.ink}" opacity="0.75">POSTERAI — SERI ${String(index + 1).padStart(2, "0")}</text>
  ${lines}
  <text x="72" y="1090" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="4" fill="${p.ink}" opacity="0.7">AI GENERATE × FINISHING MANUSIA</text>
</svg>
`;
}

const outDir = path.join(process.cwd(), "public", "posters");
await mkdir(outDir, { recursive: true });

// Crop detail 3:4 dari artwork utama, dipakai sebagai isi galeri produk.
const detailCrops = [
  { suffix: "detail-1", viewBox: "90 120 720 960" },
  { suffix: "detail-2", viewBox: "150 360 600 800" },
];

for (const [index, poster] of posters.entries()) {
  const svg = buildSvg(poster, index);
  await writeFile(path.join(outDir, `${poster.slug}.svg`), svg, "utf8");

  for (const crop of detailCrops) {
    await writeFile(
      path.join(outDir, `${poster.slug}-${crop.suffix}.svg`),
      svg.replace('viewBox="0 0 900 1200"', `viewBox="${crop.viewBox}"`),
      "utf8",
    );
  }
}

console.log(
  `Generated ${posters.length} posters + ${posters.length * detailCrops.length} detail crops in public/posters`,
);
