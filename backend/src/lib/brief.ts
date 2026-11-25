// Konstanta brief & palet poster — bagian lama `lib/ai.ts` yang masih dipakai
// setelah mesin AI dibuang (kontrak docs/WHATSAPP-FLOW.md): palet warna §4,
// enum `themeColor`, normalisasi brief lama, dan kerangka KOSONG untuk brief baru.
// Konten poster (badge, headline, 3 poin) diisi editor manusia lewat
// PUT /api/admin/orders/:id/poster — tidak ada generator sama sekali.

import type { Draft, DraftBrief, ThemeColorKey } from '../types';

// Pemetaan themeColor -> hex persis docs/REDESIGN.md §4 (primary -> accent).
export const THEME_HEX: Record<ThemeColorKey, { primary: string; accent: string }> = {
  violet: { primary: '#8b5cf6', accent: '#6d28d9' },
  navy: { primary: '#3b4bd8', accent: '#2735a8' },
  amber: { primary: '#f59e0b', accent: '#b45309' },
  emerald: { primary: '#10b981', accent: '#047857' },
};

/** Enum `themeColor` yang diterima brief (§4): violet|navy|amber|emerald. */
export const THEME_KEYS = Object.keys(THEME_HEX) as ThemeColorKey[];

/** Pasangan font dipakai kerangka poster sebelum editor mengisi konten. */
export const DEFAULT_FONT_PAIRING = 'Inter + Fraunces';

/**
 * Rapikan brief lama (skema CraftAI: themeColor `indigo`/`rose`) menjadi brief
 * skema baru. Dipakai migrasi data & penyusunan brief dari body request yang
 * parsial supaya nilai `undefined` tidak pernah masuk ke DB.
 */
export function normalizeBrief(raw: unknown): DraftBrief {
  const source = (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const text = (key: string): string => (typeof source[key] === 'string' ? (source[key] as string) : '');
  const theme = text('themeColor');
  const themeColor: ThemeColorKey = THEME_KEYS.includes(theme as ThemeColorKey)
    ? (theme as ThemeColorKey)
    : 'violet';
  return {
    templateId: text('templateId'),
    brandName: text('brandName'),
    tagline: text('tagline'),
    description: text('description'),
    themeColor,
    ctaText: text('ctaText'),
    toneOfVoice: text('toneOfVoice'),
  };
}

/**
 * Kerangka poster untuk brief baru: brand, warna tema, dan CTA diambil apa
 * adanya dari brief; badge/headline/subheadline/poin sengaja KOSONG karena hanya
 * editor manusia yang boleh mengisinya. Kerangka ini membuat UI tetap punya
 * bentuk data §4 (brand/theme/poster + tepat 3 poin) tanpa ada teks karangan.
 */
export function scaffoldPoster(brief: DraftBrief): Draft {
  const hex = THEME_HEX[brief.themeColor] ?? THEME_HEX.violet;
  return {
    brand: {
      name: brief.brandName.trim(),
      tagline: brief.tagline.trim(),
      about: brief.description.trim().slice(0, 400),
    },
    theme: {
      primaryColor: hex.primary,
      accentColor: hex.accent,
      fontPairing: DEFAULT_FONT_PAIRING,
    },
    poster: {
      badge: '',
      headline: '',
      subheadline: '',
      ctaText: brief.ctaText.trim(),
    },
    points: [
      { icon: '', title: '', description: '' },
      { icon: '', title: '', description: '' },
      { icon: '', title: '', description: '' },
    ],
  };
}