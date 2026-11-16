// Kontrak domain — satu-satunya sumber kebenaran tipe aplikasi (lihat docs/SPEC.md).

export type OrderStatus = 'draft' | 'paid' | 'in_progress' | 'review' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';
export type Role = 'customer' | 'admin' | 'developer';
export type ThemeColorKey = 'amber' | 'indigo' | 'emerald' | 'rose';
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

export interface DraftHero {
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
}

export interface DraftFeature {
  icon: string;
  title: string;
  description: string;
}

export interface DraftFaq {
  q: string;
  a: string;
}

export interface Draft {
  brand: DraftBrand;
  theme: DraftTheme;
  heroSection: DraftHero;
  features: DraftFeature[];
  faq: DraftFaq[];
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