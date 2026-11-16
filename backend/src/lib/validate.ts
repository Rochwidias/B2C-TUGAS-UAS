// Validasi skema draft ala JSON-Schema tanpa dependency tambahan.
// Dipakai untuk output Gemini DAN generator lokal — keduanya wajib lolos
// sebelum disimpan, supaya UI bisa mengandalkan bentuk data.

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(source: Record<string, unknown>, key: string, path: string, fail: IssueSink): string {
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

function requireArray(
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

/**
 * Mengembalikan daftar pelanggaran; array kosong = draft valid.
 * Sebagian item rusak tetap dilaporkan per jalur sehingga fallback bisa
 * meniru "partial output Gemini lalu isi ulang dengan generator lokal".
 */
export function validateDraftSchema(value: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const fail: IssueSink = (path, message) => issues.push({ path, message });

  if (!isRecord(value)) return [{ path: '$', message: 'draft harus berupa object JSON' }];

  for (const section of ['brand', 'theme', 'heroSection'] as const) {
    if (!isRecord(value[section])) fail(`$.${section}`, 'harus berupa object');
  }

  const brand = isRecord(value.brand) ? value.brand : {};
  requireString(brand, 'name', '$.brand', fail);
  requireString(brand, 'tagline', '$.brand', fail);
  requireString(brand, 'about', '$.brand', fail);

  const theme = isRecord(value.theme) ? value.theme : {};
  const primaryColor = requireString(theme, 'primaryColor', '$.theme', fail);
  if (primaryColor && !HEX_RE.test(primaryColor)) fail('$.theme.primaryColor', 'harus berupa hex (#RRGGBB)');
  const accentColor = requireString(theme, 'accentColor', '$.theme', fail);
  if (accentColor && !HEX_RE.test(accentColor)) fail('$.theme.accentColor', 'harus berupa hex (#RRGGBB)');
  requireString(theme, 'fontPairing', '$.theme', fail);

  const hero = isRecord(value.heroSection) ? value.heroSection : {};
  requireString(hero, 'badge', '$.heroSection', fail);
  requireString(hero, 'headline', '$.heroSection', fail);
  requireString(hero, 'subheadline', '$.heroSection', fail);
  requireString(hero, 'ctaText', '$.heroSection', fail);

  // Panjang maksimum item dibatasi supaya draft tidak membengkak tanpa alasan.
  requireArray(value, 'features', 3, '$', fail)
    .slice(0, 3)
    .forEach((item, index) => {
      const path = `$.features[${index}]`;
      if (!isRecord(item)) return fail(path, 'harus berupa object');
      requireString(item, 'icon', path, fail);
      requireString(item, 'title', path, fail);
      requireString(item, 'description', path, fail);
    });

  requireArray(value, 'faq', 2, '$', fail)
    .slice(0, 2)
    .forEach((item, index) => {
      const path = `$.faq[${index}]`;
      if (!isRecord(item)) return fail(path, 'harus berupa object');
      requireString(item, 'q', path, fail);
      requireString(item, 'a', path, fail);
    });

  return issues;
}