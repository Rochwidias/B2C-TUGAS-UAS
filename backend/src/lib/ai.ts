// Lapisan AI: memanggil Gemini 2.5 Flash bila GEMINI_API_KEY tersedia,
// selalu dengan fallback generator lokal deterministik yang mengikuti skema
// draft poster di docs/REDESIGN.md §4. Tanpa key (atau key invalid) -> engine 'local'.

import type { Draft, DraftBrief, DraftPoint, GenerateDraftResult, ThemeColorKey } from '../types';
import { normalizeDraftSchema } from './validate';

// System prompt skema poster (docs/REDESIGN.md §4) — `faq` dan `heroSection`
// sengaja tidak disebut karena sudah dihapus dari kontrak.
export const GEMINI_SYSTEM_PROMPT = `Anda adalah asisten AI desainer poster promosi untuk UMKM Indonesia (Aether Creative).
Tugas Anda: membuat konten poster SIAP PAKAI dari brief customer — bahasa Indonesia, profesional, tanpa lorem ipsum, tanpa mengarang fakta di luar brief.

Berikan respon WAJIB dalam format JSON murni tanpa markdown pembungkus dengan struktur:
{
  "brand": {
    "name": "string",
    "tagline": "string",
    "about": "string"
  },
  "theme": {
    "primaryColor": "hex code",
    "accentColor": "hex code",
    "fontPairing": "string"
  },
  "poster": {
    "badge": "string",
    "headline": "string",
    "subheadline": "string",
    "ctaText": "string"
  },
  "points": [
    {"icon": "string", "title": "string", "description": "string"},
    {"icon": "string", "title": "string", "description": "string"},
    {"icon": "string", "title": "string", "description": "string"}
  ]
}

Aturan:
- "points" WAJIB tepat 3 item (alasan utama customer percaya), bukan 2 atau 4.
- "poster.headline" maksimal 60 karakter, "poster.subheadline" maksimal 160 karakter.
- Semua teks maksimal 400 karakter.
- Pakai NAMA BRAND dari brief di mana pun wajar.
- "theme.primaryColor"/"theme.accentColor" harus hex #RRGGBB mengikuti warna tema brief.
- "icon" salah satu dari: tag, clock, sparkles, map-pin, message-circle, truck, star, shopping-bag, utensils, layers, handshake, megaphone.
- Jangan menyertakan "faq" atau "heroSection".`;

// Pemetaan themeColor -> hex persis docs/REDESIGN.md §4 (primary -> accent).
export const THEME_HEX: Record<ThemeColorKey, { primary: string; accent: string }> = {
  violet: { primary: '#8b5cf6', accent: '#6d28d9' },
  navy: { primary: '#3b4bd8', accent: '#2735a8' },
  amber: { primary: '#f59e0b', accent: '#b45309' },
  emerald: { primary: '#10b981', accent: '#047857' },
};

/** Enum `themeColor` yang diterima brief (§4): violet|navy|amber|emerald. */
export const THEME_KEYS = Object.keys(THEME_HEX) as ThemeColorKey[];

export const FONT_PAIRINGS: Record<string, string> = {
  formal: 'Inter + Source Serif 4',
  santai: 'Inter + Fraunces',
  ceria: 'Poppins + Lora',
  mewah: 'Playfair Display + Inter',
};

interface SegmentModel {
  segment: 'kuliner' | 'kreator' | 'toko' | 'umum';
  label: string;
  audience: string;
  usp: string;
  hours?: string;
  points: DraftPoint[];
}

const isKuliner = (text: string): boolean => /\bkopi|cafe|resto|restoran|kuliner|makanan|minuman|bakso|mie|sate|teh|warung|dapur|katering|catering|roti|kue|jus|sambal|boba|seafood|pizza|burger|ayam|susu|biji|jajanan|soto\b/i.test(text);
const isToko = (text: string): boolean => /\btoko|produk|jualan|jual|stok|harga|ekspedisi|pengiriman|reseller|dropship|butik|fashion|pakaian|kaos|sepatu|kosmetik|skincare|elektronik|olshop|marketplace|keranjang|checkout|preloved|thrift\b/i.test(text);
const isKreator = (text: string): boolean => /\bportofolio|portfolio|kreator|konten|creator|klien|proyek|desain|desainer|fotografer|video|editor|developer|engineer|konsultan|jasa|agensi|agency|layanan profesional|resume|cv|ilustrator|musisi\b/i.test(text);

/**
 * Deteksi segmen dari brief: menentukan label badge, sudut pandang 3 poin,
 * dan gaya bahasa poster. Selalu memakai nama brand milik customer.
 */
function detectSegment(brief: DraftBrief): SegmentModel {
  const corpus = `${brief.description} ${brief.tagline} ${brief.templateId}`;
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const hours = extractHours(brief.description);

  if (isKuliner(corpus)) {
    return {
      segment: 'kuliner',
      label: 'Kuliner',
      audience: 'pelanggan yang mencari tempat makan nyaman dengan cita rasa konsisten',
      usp: 'bahan pilihan dan pelayanan yang membuat pelanggan betah kembali',
      hours,
      points: [
        { icon: 'utensils', title: 'Menu Andalan Setiap Hari', description: `${name} menyajikan menu pilihan yang diracik segar, konsisten dari kunjungan pertama sampai berikutnya.` },
        { icon: 'tag', title: 'Promo Spesial Pelanggan Baru', description: `Diskon dan bundling hemat khusus untuk yang pertama kali pesan di ${name}.` },
        { icon: 'message-circle', title: 'Pesan Lewat WhatsApp', description: `Booking atau pesan antar langsung dari tombol WhatsApp — tanpa aplikasi tambahan.` },
      ],
    };
  }

  if (isToko(corpus)) {
    return {
      segment: 'toko',
      label: 'Toko Online',
      audience: 'pembeli yang ingin belanja cepat, aman, dan langsung dikonfirmasi',
      usp: 'foto jujur, harga transparan, dan pengiriman yang dipantau sampai ke tangan pembeli',
      hours,
      points: [
        { icon: 'shopping-bag', title: 'Produk Unggulan Terpilih', description: `Kurasi produk ${name} dengan foto jujur, harga transparan, dan stok yang selalu diperbarui.` },
        { icon: 'truck', title: 'Pengiriman Ke Seluruh Indonesia', description: `Pesanan diproses cepat, nomor resi dikirim otomatis lewat WhatsApp.` },
        { icon: 'message-circle', title: 'Konfirmasi Order Kilat', description: `Keranjang belanja dikonfirmasi langsung oleh tim ${name} dalam hitungan menit.` },
      ],
    };
  }

  if (isKreator(corpus)) {
    return {
      segment: 'kreator',
      label: 'Kreator',
      audience: 'klien yang menilai kualitas karya sebelum bekerja sama',
      usp: 'proses kerja transparan dan hasil yang diukur dari tujuan klien',
      hours,
      points: [
        { icon: 'layers', title: 'Portofolio Karya Terpilih', description: `Karya ${name} beserta konteks masalah dan hasil yang sudah dicapai bersama klien.` },
        { icon: 'handshake', title: 'Booking Jasa Tanpa Ribet', description: `Pilih layanan, kirim brief, dan dapatkan estimasi pengerjaan di hari yang sama.` },
        { icon: 'clock', title: 'Respon Cepat di Jam Kerja', description: `Pertanyaan dan penawaran dijawab lewat WhatsApp, rata-rata dalam beberapa menit.` },
      ],
    };
  }

  return {
    segment: 'umum',
    label: 'Promo',
    audience: 'pelanggan yang membutuhkan layanan cepat, jelas, dan bisa dipercaya',
    usp: 'komunikasi cepat, harga transparan, dan hasil yang bisa dipertanggungjawabkan',
    hours,
    points: [
      { icon: 'star', title: 'Layanan Unggulan', description: `Andalan dari ${name} yang dikerjakan dengan standar kualitas konsisten.` },
      { icon: 'tag', title: 'Harga Transparan Tanpa Kejutan', description: `Semua biaya dijelaskan di awal — tidak ada tambahan tersembunyi setelah pesanan jalan.` },
      { icon: 'message-circle', title: 'Konsultasi Gratis', description: `Bicarakan kebutuhan Anda dulu dengan tim ${name} sebelum memutuskan.` },
    ],
  };
}

function extractHours(description: string): string | undefined {
  const match = description.match(/\b(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})\b/);
  return match ? `Buka ${match[1].replace(':', '.')} – ${match[2].replace(':', '.')}` : undefined;
}

function toneHint(tone: string): string {
  const normalized = tone.trim().toLowerCase();
  if (!normalized) return 'santai dan profesional';
  if (/formal|profesional|serius|bisnis/.test(normalized)) return 'formal dan profesional';
  if (/ceria|ramah|fun|energik|gaul/.test(normalized)) return 'ceria dan ramah';
  if (/mewah|elegan|premium|klasik|lux/.test(normalized)) return 'mewah dan elegan';
  return `${normalized} dan mudah didekati`;
}

function describeBrief(brief: DraftBrief): string {
  const parts = [
    `Nama brand: ${brief.brandName || '(tidak diisi)'}`,
    `Tagline: ${brief.tagline || '(tidak diisi)'}`,
    `Deskripsi bisnis: ${brief.description || '(tidak diisi)'}`,
    `Warna tema: ${brief.themeColor}`,
    `CTA: ${brief.ctaText || '(tidak diisi)'}`,
    `Tone of voice: ${brief.toneOfVoice || '(tidak diisi)'}`,
    `Template: ${brief.templateId}`,
  ];
  return parts.join('\n');
}

/**
 * Rapikan brief lama (skema CraftAI: themeColor `indigo`/`rose`) menjadi brief
 * skema baru. Dipakai migrasi data & penyusunan brief dari body request yang
 * parsial, supaya generator lokal tidak pernah menerima nilai undefined.
 */
export function normalizeBrief(raw: unknown): DraftBrief {
  const source = (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const text = (key: string): string => (typeof source[key] === 'string' ? (source[key] as string) : '');
  const theme = text('themeColor');
  const themeColor: ThemeColorKey = (theme === 'violet' || theme === 'navy' || theme === 'amber' || theme === 'emerald')
    ? theme
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

// ---------------------------------------------------------------------------
// Generator lokal deterministik (tanpa GEMINI_API_KEY / saat output AI invalid)
// ---------------------------------------------------------------------------

/** Potong panjang dengan tanda elipsis supaya medan poster tidak membengkak. */
function trimTo(value: string, max: number): string {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function generateLocalDraft(brief: DraftBrief): Draft {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const tagline = brief.tagline.trim() || 'Kualitas yang bisa Anda andalkan setiap hari';
  const tone = toneHint(brief.toneOfVoice);
  const model = detectSegment(brief);
  const hex = THEME_HEX[brief.themeColor] ?? THEME_HEX.violet;
  const cta = brief.ctaText.trim() || 'Hubungi Kami Sekarang';
  const fontPairing = FONT_PAIRINGS[brief.toneOfVoice.trim().toLowerCase()] ?? 'Inter + Fraunces';

  const badge = model.hours ?? `${model.label} • ${name}`;
  const headline = trimTo(tagline.replace(/\.$/, ''), 60);
  const subheadline = buildSubheadline(brief, model);
  const about = buildAbout(brief, model, tone);

  return {
    brand: { name, tagline: trimTo(tagline, 140), about: trimTo(about, 400) },
    theme: { primaryColor: hex.primary, accentColor: hex.accent, fontPairing },
    poster: { badge: trimTo(badge, 60), headline, subheadline, ctaText: trimTo(cta, 40) },
    points: model.points.map((point) => ({
      icon: point.icon,
      title: trimTo(point.title, 80),
      description: trimTo(point.description, 240),
    })),
  };
}

function buildSubheadline(brief: DraftBrief, model: SegmentModel): string {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const description = brief.description.trim();
  if (description) return trimTo(`${description} ${model.usp.charAt(0).toUpperCase()}${model.usp.slice(1)} untuk ${model.audience}.`, 160);
  return trimTo(`${name} melayani ${model.audience} — ${model.usp}.`, 160);
}

function buildAbout(brief: DraftBrief, model: SegmentModel, tone: string): string {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const hours = model.hours ? `${name} ${model.hours.toLowerCase()}. ` : '';
  return `Poster dibuat dengan nada ${tone}. ${hours}${name} melayani ${model.audience} dengan ${model.usp}.`;
}

// ---------------------------------------------------------------------------
// Pemanggilan Gemini (opsional)
// ---------------------------------------------------------------------------

function extractJsonPayload(raw: string): unknown {
  let text = raw.trim();
  // Buang pembungkus ```json ... ``` bila model tetap mengirimnya.
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) text = fence[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return JSON.parse(text);
}

async function callGemini(brief: DraftBrief): Promise<Draft> {
  const apiKey = process.env.GEMINI_API_KEY;
  const controller = new AbortController();
  // Jangan biarkan panggilan jaringan menggantung request customer.
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey as string,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Brief customer:\n${describeBrief(brief)}` }],
            },
          ],
          systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    if (!text) throw new Error('Gemini mengembalikan kandidat kosong');
    const normalized = normalizeDraftSchema(extractJsonPayload(text));
    if (normalized.issues.length > 0 || !normalized.draft) {
      throw new Error(`Output Gemini tidak valid: ${normalized.issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`);
    }
    return normalized.draft;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// API publik
// ---------------------------------------------------------------------------

export async function generateDraft(brief: DraftBrief): Promise<GenerateDraftResult> {
  const local = generateLocalDraft(brief);
  if (!process.env.GEMINI_API_KEY) return { content: local, engine: 'local' };

  try {
    return { content: await callGemini(brief), engine: 'gemini' };
  } catch (error) {
    console.warn('[ai] fallback ke generator lokal:', error instanceof Error ? error.message : error);
    return { content: local, engine: 'local' };
  }
}