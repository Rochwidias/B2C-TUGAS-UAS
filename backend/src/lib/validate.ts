// Validasi skema draft ala JSON-Schema tanpa dependency tambahan.
// Dipakai untuk konten poster yang disimpan editor back-office lewat
// PUT /api/admin/orders/:id/poster (sebelumnya juga output Gemini).
// Skema poster: docs/REDESIGN.md §4 (brand/theme/poster + points tepat 3).

import type { Draft, DraftPoint, DraftPoster } from '../types';

export interface SchemaIssue {
  path: string;
  message: string;
}

type IssueSink = (path: string, message: string) => void;

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

// Batas panjang satu medan teks pada draft. Nilai dari Gemini bisa jauh lebih
// panjang dari brief customer; tanpa batas, satu medan bisa menghabiskan memori
// saat render preview maupun saat diekspor ke HTML.
const MAX_TEXT = 400;

export { MAX_TEXT };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Baca string wajib: laporkan bila hilang/kosong, DAN potong ke `MAX_TEXT`.
 * Nilai potongan inilah yang dipakai saat menyimpan draft (audit §12 A3) —
 * hasil `requireString` tidak boleh dibuang di call site.
 * `allowEmpty` dipakai editor back-office: kerangka poster buatan
 * `scaffoldPoster` sengaja berisi teks kosong sampai editor mengisinya.
 */
function readString(
  source: Record<string, unknown>,
  key: string,
  path: string,
  fail: IssueSink,
  allowEmpty = false,
): string {
  const value = source[key];
  const child = `${path}.${key}`;
  if (typeof value !== 'string') {
    fail(child, 'harus berupa string');
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (!allowEmpty) fail(child, 'tidak boleh kosong');
    return '';
  }
  if (trimmed.length > MAX_TEXT) {
    // Dipotong, bukan ditolak: Gemini kadang membalas paragraf panjang, dan
    // menolak seluruh draft membuat customer melihat error tanpa jalan keluar.
    return trimmed.slice(0, MAX_TEXT);
  }
  return trimmed;
}

function readArray(
  source: Record<string, unknown>,
  key: string,
  exactLength: number,
  path: string,
  fail: IssueSink,
): unknown[] {
  const value = source[key];
  const child = `${path}.${key}`;
  if (!Array.isArray(value)) {
    fail(child, 'harus berupa array');
    return [];
  }
  if (value.length !== exactLength) {
    fail(child, `harus berisi tepat ${exactLength} item`);
    return [];
  }
  return value;
}

export interface NormalizedDraft {
  issues: SchemaIssue[];
  /** Draft hasil normalisasi; `null` bila ada pelanggaran struktural. */
  draft: Draft | null;
}

export interface NormalizeOptions {
  /**
   * Izinkan teks kosong. Dipakai `PUT /api/admin/orders/:id/poster`: kerangka
   * poster (scaffold) sengaja kosong sampai editor mengisi, jadi round-trip
   * konten scaffold harus diterima. Warna theme tetap wajib terisi (preview
   * dan export butuh hex valid).
   */
  allowEmpty?: boolean;
}

/**
 * Validasi + normalisasi: mengembalikan daftar pelanggaran DAN objek draft
 * yang sudah dipotong `MAX_TEXT`. `issues` kosong = draft valid dan `draft`
 * siap disimpan apa adanya.
 */
export function normalizeDraftSchema(value: unknown, options: NormalizeOptions = {}): NormalizedDraft {
  const allowEmpty = options.allowEmpty === true;
  const issues: SchemaIssue[] = [];
  const fail: IssueSink = (path, message) => issues.push({ path, message });
  const read = (source: Record<string, unknown>, key: string, path: string): string =>
    readString(source, key, path, fail, allowEmpty);

  if (!isRecord(value)) return { issues: [{ path: '$', message: 'draft harus berupa object JSON' }], draft: null };

  for (const section of ['brand', 'theme', 'poster'] as const) {
    if (!isRecord(value[section])) fail(`$.${section}`, 'harus berupa object');
  }

  const brand = isRecord(value.brand) ? value.brand : {};
  const brandName = read(brand, 'name', '$.brand');
  const brandTagline = read(brand, 'tagline', '$.brand');
  const brandAbout = read(brand, 'about', '$.brand');

  const theme = isRecord(value.theme) ? value.theme : {};
  // Warna theme selalu wajib (tanpa allowEmpty) — renderer & export butuh hex.
  const primaryColor = readString(theme, 'primaryColor', '$.theme', fail);
  if (primaryColor && !HEX_RE.test(primaryColor)) fail('$.theme.primaryColor', 'harus berupa hex (#RRGGBB)');
  const accentColor = readString(theme, 'accentColor', '$.theme', fail);
  if (accentColor && !HEX_RE.test(accentColor)) fail('$.theme.accentColor', 'harus berupa hex (#RRGGBB)');
  const fontPairing = read(theme, 'fontPairing', '$.theme');

  const posterSource = isRecord(value.poster) ? value.poster : {};
  const poster: DraftPoster = {
    badge: read(posterSource, 'badge', '$.poster'),
    headline: read(posterSource, 'headline', '$.poster'),
    subheadline: read(posterSource, 'subheadline', '$.poster'),
    ctaText: read(posterSource, 'ctaText', '$.poster'),
  };

  // points menggantikan `features` dan wajib tepat 3 (§4).
  const points: DraftPoint[] = [];
  readArray(value, 'points', 3, '$', fail)
    .slice(0, 3)
    .forEach((item, index) => {
      const path = `$.points[${index}]`;
      if (!isRecord(item)) {
        fail(path, 'harus berupa object');
        points.push({ icon: '', title: '', description: '' });
        return;
      }
      points.push({
        icon: read(item, 'icon', path),
        title: read(item, 'title', path),
        description: read(item, 'description', path),
      });
    });

  // `faq` / `heroSection` tidak lagi bagian skema; keduanya menggambarkan
  // skema website lama sehingga dianggap salah bentuk bila masih muncul.
  if ('faq' in value) fail('$.faq', 'tidak ada dalam skema poster (dihapus)');
  if ('heroSection' in value) fail('$.heroSection', 'digantikan $.poster');

  if (issues.length > 0) return { issues, draft: null };

  return {
    issues,
    draft: {
      brand: { name: brandName, tagline: brandTagline, about: brandAbout },
      theme: { primaryColor, accentColor, fontPairing },
      poster,
      points,
    },
  };
}

/**
 * Hanya pelanggaran (dipakai untuk logging). Bila butuh objek draft ternormalisasi,
 * pakai `normalizeDraftSchema`.
 */
export function validateDraftSchema(value: unknown): SchemaIssue[] {
  return normalizeDraftSchema(value).issues;
}

// ---------------------------------------------------------------------------
// Batas panjang per medan teks poster (kontrak WHATSAPP-FLOW: 240/140/60/40).
// Nilai yang sama dulu hanya dipakai generator; sekarang menjadi validasi input
// editor manusia lewat PUT /api/admin/orders/:id/poster.
// ---------------------------------------------------------------------------
export const POSTER_LIMITS = {
  /** Deskripsi tiap poin: 240 karakter. */
  pointDescription: 240,
  /** Tagline brand: 140 karakter. */
  tagline: 140,
  /** Headline poster: 60 karakter. */
  headline: 60,
  /** Teks tombol CTA: 40 karakter. */
  ctaText: 40,
} as const;

/** Pelanggaran batas panjang (kosong = lolos). `draft` hasil `normalizeDraftSchema`. */
export function validatePosterLimits(draft: Draft): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const check = (path: string, value: string, max: number): void => {
    if (value.length > max) issues.push({ path, message: `maksimal ${max} karakter` });
  };

  check('$.brand.tagline', draft.brand.tagline, POSTER_LIMITS.tagline);
  check('$.poster.headline', draft.poster.headline, POSTER_LIMITS.headline);
  check('$.poster.ctaText', draft.poster.ctaText, POSTER_LIMITS.ctaText);
  draft.points.forEach((point, index) => {
    check(`$.points[${index}].description`, point.description, POSTER_LIMITS.pointDescription);
  });

  return issues;
}