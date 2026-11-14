// Lapisan AI: memanggil Gemini 2.5 Flash bila GEMINI_API_KEY tersedia,
// selalu dengan fallback generator lokal deterministik yang mengikuti skema
// JSON di docs/SPEC.md. Tidak ada API key di environment -> engine 'local'.

import type { Draft, DraftBrief, DraftFeature, GenerateDraftResult, ThemeColorKey } from './types';
import { validateDraftSchema } from './validate';

// System prompt persis dari PLAN.md §6 (jangan diubah tanpa izin user).
export const GEMINI_SYSTEM_PROMPT = `Anda adalah asisten AI arsitek web profesional. Tugas Anda adalah memodifikasi template website standar sesuai dengan identitas bisnis yang diberikan oleh customer.

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
  "heroSection": {
    "badge": "string",
    "headline": "string",
    "subheadline": "string",
    "ctaText": "string"
  },
  "features": [
    {"icon": "string", "title": "string", "description": "string"},
    {"icon": "string", "title": "string", "description": "string"},
    {"icon": "string", "title": "string", "description": "string"}
  ],
  "faq": [
    {"q": "string", "a": "string"},
    {"q": "string", "a": "string"}
  ]
}`;

// Pemetaan themeColor -> hex mengikuti docs/SPEC.md (baris pemetaan warna).
export const THEME_HEX: Record<ThemeColorKey, { primary: string; accent: string }> = {
  amber: { primary: '#f59e0b', accent: '#b45309' },
  indigo: { primary: '#6366f1', accent: '#4338ca' },
  emerald: { primary: '#10b981', accent: '#047857' },
  rose: { primary: '#f43f5e', accent: '#be123c' },
};

export const FONT_PAIRINGS: Record<string, string> = {
  formal: 'Inter + Source Serif 4',
  santai: 'Inter + Fraunces',
  ceria: 'Poppins + Lora',
  mewah: 'Playfair Display + Inter',
};

interface TopicModel {
  topic: string;
  audience: string;
  offering: string;
  usp: string;
  hours?: string;
  features: DraftFeature[];
}

const isFnb = (text: string): boolean => /\bkopi|cafe|resto|restoran|kuliner|makanan|minuman|bakso|mie|sate|teh|warung|dapur|katering|catering|roti|kue|jus|sambal|boba|seafood|pizza|burger|ayam|susu|biji\b/i.test(text);
const isShop = (text: string): boolean => /\btoko|produk|jualan|jual|stok|harga|ekspedisi|pengiriman|reseller|dropship|butik|fashion|pakaian|kaos|sepatu|kosmetik|skincare|elektronik|olshop|marketplace|keranjang|checkout\b/i.test(text);
const isPortfolio = (text: string): boolean => /\bportofolio|portfolio|klien|proyek|desain|desainer|fotografer|developer|enginer|engineer|konsultan|jasa|agensi|agency|layanan profesional|resume|cv\b/i.test(text);

function detectTopic(brief: DraftBrief): TopicModel {
  const corpus = `${brief.description} ${brief.tagline} ${brief.templateId}`;
  const name = brief.brandName.trim() || 'Bisnis Anda';

  if (isFnb(corpus)) {
    return {
      topic: 'kuliner',
      audience: 'pelanggan yang mencari tempat makan nyaman dengan cita rasa konsisten',
      offering: 'menu andalan yang dibuat segar setiap hari',
      usp: 'bahan pilihan, resep turun-temurun, dan pelayanan yang membuat pelanggan betah berlama-lama',
      hours: extractHours(brief.description),
      features: [
        { icon: '🍽️', title: 'Menu Andalan Setiap Hari', description: `Menu pilihan dari ${name} yang diracik dari bahan segar, konsisten dari kunjungan pertama sampai kesekian.` },
        { icon: '📍', title: 'Lokasi & Jam Buka Jelas', description: `Alamat dan jam operasional ${name} ditampilkan di halaman depan agar pelanggan tidak salah datang.` },
        { icon: '💬', title: 'Reservasi lewat WhatsApp', description: `Pesan meja atau pesan antar langsung dari tombol WhatsApp tanpa perlu aplikasi tambahan.` },
      ],
    };
  }

  if (isShop(corpus)) {
    return {
      topic: 'toko online',
      audience: 'pembeli yang ingin berbelanja cepat, aman, dan bisa langsung dikonfirmasi',
      offering: 'produk unggulan dengan stok yang selalu diperbarui',
      usp: 'foto jujur, harga transparan, dan pengiriman yang dipantau sampai sampai ke tangan pembeli',
      features: [
        { icon: '🛍️', title: 'Katalog Produk Lengkap', description: `Produk unggulan ${name} dengan foto jujur, harga transparan, dan stok yang selalu diperbarui.` },
        { icon: '🚚', title: 'Pengiriman Ke Seluruh Indonesia', description: `Pesanan diproses cepat dan dikirim lewat ekspedisi pilihan, nomor resi dikirim otomatis via WhatsApp.` },
        { icon: '🔒', title: 'Checkout Aman & Konfirmasi Cepat', description: `Pembayaran diproses aman dan pesanan dikonfirmasi langsung oleh tim ${name} dalam hitungan menit.` },
      ],
    };
  }

  if (isPortfolio(corpus)) {
    return {
      topic: 'portofolio profesional',
      audience: 'klien yang menilai kualitas kerja sebelum memutuskan bekerja sama',
      offering: 'layanan dan karya yang bisa dilihat langsung',
      usp: 'proses kerja transparan, komunikasi rapi, dan hasil yang diukur dari tujuan bisnis klien',
      features: [
        { icon: '🗂️', title: 'Karya & Studi Kasus', description: `Portofolio ${name} berisi karya terpilih beserta konteks masalah dan hasil yang dicapai klien.` },
        { icon: '🤝', title: 'Proses Kerja Transparan', description: `Setiap tahap proyek dikomunikasikan dengan jadwal dan ruang lingkup yang disepakati di awal.` },
        { icon: '📈', title: 'Hasil Terukur', description: `Pekerjaan dievaluasi dari indikator yang disepakati klien, bukan sekadar tampilan yang enak dilihat.` },
      ],
    };
  }

  return {
    topic: 'bisnis',
    audience: 'pelanggan yang membutuhkan layanan cepat, jelas, dan bisa dipercaya',
    offering: 'layanan unggulan dengan tim yang siap membantu',
    usp: 'komunikasi cepat, harga transparan, dan hasil yang bisa dipertanggungjawabkan',
    features: [
      { icon: '⭐', title: 'Layanan Unggulan', description: `Andalan dari ${name} yang dikerjakan dengan standar kualitas konsisten dan bisa diminta kapan saja.` },
      { icon: '🤝', title: 'Konsultasi Gratis', description: `Bicarakan kebutuhan Anda dulu dengan tim ${name} sebelum memutuskan — tanpa biaya, tanpa tekanan.` },
      { icon: '⚡', title: 'Respon Cepat', description: `Pertanyaan dan pesanan dijawab lewat WhatsApp pada jam kerja, rata-rata dalam beberapa menit.` },
    ],
  };
}

function extractHours(description: string): string | undefined {
  const match = description.match(/\b(\d{1,2}[.:]\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})\b/);
  return match ? `Buka ${match[1].replace(':', '.')} - ${match[2].replace(':', '.')}` : undefined;
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

// ---------------------------------------------------------------------------
// Generator lokal deterministik
// ---------------------------------------------------------------------------

export function generateLocalDraft(brief: DraftBrief): Draft {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const tagline = brief.tagline.trim() || 'Kualitas yang bisa Anda andalkan setiap hari';
  const tone = toneHint(brief.toneOfVoice);
  const model = detectTopic(brief);
  const hex = THEME_HEX[brief.themeColor] ?? THEME_HEX.indigo;
  const cta = brief.ctaText.trim() || 'Hubungi Kami Sekarang';
  const fontPairing = FONT_PAIRINGS[brief.toneOfVoice.trim().toLowerCase()] ?? 'Inter + Fraunces';

  const badge = model.hours ?? `${model.topic.charAt(0).toUpperCase()}${model.topic.slice(1)} • ${name}`;

  const heroHeadline = tagline.endsWith('.') ? tagline.slice(0, -1) : tagline;

  const about = buildAbout(brief, model, tone);

  return {
    brand: { name, tagline, about },
    theme: { primaryColor: hex.primary, accentColor: hex.accent, fontPairing },
    heroSection: {
      badge,
      headline: heroHeadline,
      subheadline: buildSubheadline(brief, model),
      ctaText: cta,
    },
    features: model.features,
    faq: [
      {
        q: `Apa saja yang ditawarkan ${name}?`,
        a: `${name} berfokus pada ${model.offering} untuk ${model.audience}. ${model.usp.charAt(0).toUpperCase()}${model.usp.slice(1)}.`,
      },
      {
        q: 'Bagaimana cara memesan atau menghubungi kami?',
        a: `Klik tombol "${cta}" untuk chat WhatsApp, atau kirim email ke alamat yang tercantum di halaman kontak. Tim kami balas pada jam kerja.`,
      },
    ],
  };
}

function buildSubheadline(brief: DraftBrief, model: TopicModel): string {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const description = brief.description.trim();
  const trimmed = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  if (trimmed) return `${trimmed} ${model.usp.charAt(0).toUpperCase()}${model.usp.slice(1)} untuk ${model.audience}.`;
  return `${name} melayani ${model.audience} dengan ${model.offering}.`;
}

function buildAbout(brief: DraftBrief, model: TopicModel, tone: string): string {
  const name = brief.brandName.trim() || 'Bisnis Anda';
  const tagline = brief.tagline.trim();
  const hours = model.hours ? `${name} buka ${model.hours}. ` : '';
  // Deskripsi brief sudah terpakai di subheadline hero, jadi bagian ini hanya
  // menyebut jam buka + tagline agar konten tidak mengulang kalimat yang sama.
  return `Tone suara situs ini ${tone}. ${hours}${name} melayani ${model.audience} lewat ${model.offering}. ${tagline || `${name.charAt(0).toUpperCase()}${name.slice(1)} — ${model.usp}.`}`;
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
    const parsed = extractJsonPayload(text);
    const issues = validateDraftSchema(parsed);
    if (issues.length > 0) {
      throw new Error(`Output Gemini tidak valid: ${issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`);
    }
    return parsed as Draft;
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