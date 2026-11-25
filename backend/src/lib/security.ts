// Batas panjang, sanitasi, dan header keamanan.
// Dipakai semua route API supaya payload raksasa tidak pernah sampai ke DB,
// prompt AI, atau log.

/** Batas maksimum tiap medan yang diterima API (karakter). */
export const LIMITS = {
  brandName: 80,
  tagline: 140,
  description: 800,
  ctaText: 40,
  toneOfVoice: 40,
  contactName: 80,
  whatsapp: 25,
  email: 160,
  devNote: 2000,
  revision: 1000,
  briefNote: 400,
  url: 500,
  password: 200,
} as const;

export type LimitKey = keyof typeof LIMITS;

/**
 * Buang karakter kontrol agar teks tidak merusak prompt/log/HTTP:
 * C0 (kecuali tab & newline), DEL `U+007F`, dan C1 `U+0080–U+009F`.
 */
export function sanitizeText(value: string): string {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isC0 = code < 0x20 && char !== '\n' && char !== '\t';
    const isDelete = code === 0x7f;
    const isC1 = code >= 0x80 && code <= 0x9f;
    if (!isC0 && !isDelete && !isC1) out += char;
  }
  return out;
}

/** Sanitasi untuk medan satu baris (URL, nomor): tab & newline ikut dibuang. */
export function sanitizeSingleLine(value: string): string {
  return sanitizeText(value).replace(/[\n\t]/g, '').trim();
}

/**
 * Rapikan + potong ke `max`. Pemotongan diberi tanda supaya teks yang terpotong
 * tidak terbaca sebagai kalimat utuh.
 */
export function cap(value: string, max: number): string {
  const clean = sanitizeText(value).trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export interface CapResult {
  ok: boolean;
  value: string;
  error?: string;
}

/** Versi `cap` yang melaporkan pelanggaran, bukan diam-diam memotong. */
export function requireCap(value: string, max: number, label: string): CapResult {
  const clean = sanitizeText(value).trim();
  if (clean.length > max) {
    return { ok: false, value: clean.slice(0, max), error: `${label} maksimal ${max} karakter.` };
  }
  return { ok: true, value: clean };
}

/** Normalisasi nomor WhatsApp Indonesia ke digit (08xx / 628xx diterima). */
export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/[^0-9+]/g, '');
  const withoutPlus = digits.replace(/^\+/, '');
  if (withoutPlus.startsWith('62')) return `0${withoutPlus.slice(2)}`;
  if (withoutPlus.startsWith('8')) return `0${withoutPlus}`;
  return withoutPlus;
}

export function isValidWhatsapp(value: string): boolean {
  const digits = normalizeWhatsapp(value);
  // Nomor Indonesia: 08xx + 8-12 digit setelah nol.
  return /^0[78][0-9]{7,12}$/.test(digits);
}

export function isValidEmail(value: string): boolean {
  if (value.length > LIMITS.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Header dasar; disetel global di next.config agar berlaku untuk semua rute. */
export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
] as const;