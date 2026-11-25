// Kontrak domain — satu-satunya sumber kebenaran tipe aplikasi
// (docs/REDESIGN.md §2–§4 menggantikan docs/SPEC.md sejauh bertentangan).

export type OrderStatus = 'draft' | 'paid' | 'in_progress' | 'review' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';
export type Role = 'customer' | 'admin' | 'developer';
export type ThemeColorKey = 'violet' | 'navy' | 'amber' | 'emerald';
export type AIEngine = 'gemini' | 'local';

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

export interface Order {
  id: string;
  order_number: string;
  template_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_price: number;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string;
  package_name: string;
  package_key: string | null;
  quota: number;
  live_website_url: string | null;
  download_zip_url: string | null;
  dev_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIDraft {
  id: string;
  order_id: string | null;
  template_id: string;
  input_prompt_data: DraftBrief;
  ai_generated_content: Draft;
  generated_at: string;
}

export interface OrderLog {
  id: string;
  order_id: string;
  status_from: string | null;
  status_to: string;
  developer_note: string | null;
  timestamp: string;
}

export interface DraftBrand {
  name: string;
  tagline: string;
  about: string;
}

export interface DraftTheme {
  primaryColor: string;
  accentColor: string;
  fontPairing: string;
}

/** Diganti `heroSection` (skema website lama) — lihat docs/REDESIGN.md §4. */
export interface DraftPoster {
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
}

/** `points` wajib tepat 3; menggantikan `features`. */
export interface DraftPoint {
  icon: string;
  title: string;
  description: string;
}

/** Skema draft poster (docs/REDESIGN.md §4). `faq` dan `heroSection` tidak ada. */
export interface Draft {
  brand: DraftBrand;
  theme: DraftTheme;
  poster: DraftPoster;
  points: DraftPoint[];
}

export interface DraftBrief {
  templateId: string;
  brandName: string;
  tagline: string;
  description: string;
  themeColor: ThemeColorKey;
  ctaText: string;
  toneOfVoice: string;
}

export interface GenerateDraftResult {
  content: Draft;
  engine: AIEngine;
}

/** Satu baris paket dari `GET /api/packages` (docs/REDESIGN.md §2). */
export interface PackageOption {
  key: string;
  name: string;
  price: number;
  quota: number;
  eta: string;
  guarantee: string;
  description: string;
  etaGuarantee: string;
}