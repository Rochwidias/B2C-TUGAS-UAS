// Kontrak JSON yang di-fetch dari route API (docs/SPEC.md).
// Sengaja didefinisikan lokal di folder shop agar halaman customer tidak
// bergantung pada struktur internal src/lib milik Agent-BACKEND.

export type ThemeColorKey = 'amber' | 'indigo' | 'emerald' | 'rose';
export type AIEngine = 'gemini' | 'local';
export type OrderStatus = 'draft' | 'paid' | 'in_progress' | 'review' | 'completed';

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  base_price: number;
  preview_gradient: string;
  is_active: number;
}

export interface Draft {
  brand: { name: string; tagline: string; about: string };
  theme: { primaryColor: string; accentColor: string; fontPairing: string };
  heroSection: { badge: string; headline: string; subheadline: string; ctaText: string };
  features: { icon: string; title: string; description: string }[];
  faq: { q: string; a: string }[];
}

export interface Brief {
  templateId: string;
  brandName: string;
  tagline: string;
  description: string;
  themeColor: ThemeColorKey;
  ctaText: string;
  toneOfVoice: string;
}

export interface DraftResponse {
  draftId: string;
  content: Draft;
  engine: AIEngine;
}

export interface Order {
  id: string;
  order_number: string;
  template_id: string;
  status: OrderStatus;
  payment_status: string;
  total_price: number;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string;
  package_name: string;
  live_website_url: string | null;
  download_zip_url: string | null;
  dev_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderLog {
  id: string;
  order_id: string;
  status_from: string | null;
  status_to: string;
  developer_note: string | null;
  timestamp: string;
}

export interface OrderResponse {
  order: Order;
  draft: { id: string; ai_generated_content: Draft; template_id: string } | null;
  logs: OrderLog[];
}

export interface OrderCreatedResponse {
  order: Order;
  orderNumber: string;
}

/** Semua route API mengembalikan `{error}` pada status non-2xx. */
export interface ApiError {
  error: string;
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  summary: string;
}

export const PACKAGES: PackageOption[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 150000,
    summary: 'Template + draft AI, 1x revisi minor, deploy standar.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 250000,
    summary: 'Basic + penulisan ulang konten + integrasi tombol WhatsApp.',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 350000,
    summary: 'Pro + kustom domain, optimasi kecepatan, prioritas antrean.',
  },
];

export const STATUS_STEPS: { key: OrderStatus; label: string; hint: string }[] = [
  { key: 'draft', label: 'Draft AI', hint: 'Konten dibuat' },
  { key: 'paid', label: 'Pembayaran', hint: 'Terverifikasi' },
  { key: 'in_progress', label: 'Dikerjakan', hint: 'Developer eksekusi' },
  { key: 'review', label: 'Review', hint: 'Cek mutu & deploy' },
  { key: 'completed', label: 'Selesai', hint: 'Live + source code' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  fnb: 'Kuliner & Cafe',
  portfolio: 'Portofolio & Agensi',
  shop: 'Toko Online & Retail',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft AI',
  paid: 'Pembayaran masuk',
  in_progress: 'Sedang dikerjakan',
  review: 'Menunggu review',
  completed: 'Selesai',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/** Baca body JSON apa pun: 2xx → data, selain itu → pesan error dari server. */
export async function readJson<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (res.ok) return { ok: true, data: body as T };
  const msg = (body as ApiError | null)?.error;
  return { ok: false, error: msg ?? `Permintaan gagal (HTTP ${res.status}).` };
}