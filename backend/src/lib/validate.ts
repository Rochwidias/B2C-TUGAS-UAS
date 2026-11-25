// Validasi skema draft ala JSON-Schema tanpa dependency tambahan.
// Dipakai untuk output Gemini DAN generator lokal — keduanya wajib lolos
// sebelum disimpan, supaya UI bisa mengandalkan bentuk data.
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
 */
function readString(
  source: Record<string, unknown>,
  key: string,
  path: string,
  fail: IssueSink,
): string {
  const value = source[key];
  const child = `${path}.${key}`;
  if (typeof value !== 'string') {
    fail(child, 'harus berupa string');
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    fail(child, 'tidak boleh kosong');
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

/**
 * Validasi + normalisasi: mengembalikan daftar pelanggaran DAN objek draft
 * yang sudah dipotong `MAX_TEXT`. `issues` kosong = draft valid dan `draft`
 * siap disimpan apa adanya.
 */
export function normalizeDraftSchema(value: unknown): NormalizedDraft {
  const issues: SchemaIssue[] = [];
  const fail: IssueSink = (path, message) => issues.push({ path, message });

  if (!isRecord(value)) return { issues: [{ path: '$', message: 'draft harus berupa object JSON' }], draft: null };

  for (const section of ['brand', 'theme', 'poster'] as const) {
    if (!isRecord(value[section])) fail(`$.${section}`, 'harus berupa object');
  }

  const brand = isRecord(value.brand) ? value.brand : {};
  const brandName = readString(brand, 'name', '$.brand', fail);
  const brandTagline = readString(brand, 'tagline', '$.brand', fail);
  const brandAbout = readString(brand, 'about', '$.brand', fail);

  const theme = isRecord(value.theme) ? value.theme : {};
  const primaryColor = readString(theme, 'primaryColor', '$.theme', fail);
  if (primaryColor && !HEX_RE.test(primaryColor)) fail('$.theme.primaryColor', 'harus berupa hex (#RRGGBB)');
  const accentColor = readString(theme, 'accentColor', '$.theme', fail);
  if (accentColor && !HEX_RE.test(accentColor)) fail('$.theme.accentColor', 'harus berupa hex (#RRGGBB)');
  const fontPairing = readString(theme, 'fontPairing', '$.theme', fail);

  const posterSource = isRecord(value.poster) ? value.poster : {};
  const poster: DraftPoster = {
    badge: readString(posterSource, 'badge', '$.poster', fail),
    headline: readString(posterSource, 'headline', '$.poster', fail),
    subheadline: readString(posterSource, 'subheadline', '$.poster', fail),
    ctaText: readString(posterSource, 'ctaText', '$.poster', fail),
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
        icon: readString(item, 'icon', path, fail),
        title: readString(item, 'title', path, fail),
        description: readString(item, 'description', path, fail),
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