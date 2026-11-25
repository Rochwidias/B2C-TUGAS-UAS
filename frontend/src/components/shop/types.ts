// Kontrak JSON yang di-fetch dari route API (docs/REDESIGN.md §4-§5).
// Sengaja didefinisikan lokal di folder shop agar halaman customer tidak
// bergantung pada struktur internal src/lib milik Agent-BACKEND.

export type ThemeColorKey = 'violet' | 'navy' | 'amber' | 'emerald';
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
  /** Kunci paket yang disarankan backend per segmen (mis. 'hemat'). */
  recommendedPackage?: string | null;
}

export interface PosterPoint {
  icon: string;
  title: string;
  description: string;
}

/** Skema draft poster (docs/REDESIGN.md §4). */
export interface Draft {
  brand: { name: string; tagline: string; about: string };
  theme: { primaryColor: string; accentColor: string; fontPairing: string };
  poster: { badge: string; headline: string; subheadline: string; ctaText: string };
  points: PosterPoint[];
  /** Skema lama (website) — dibaca bila baris draft berasal dari database lama. */
  heroSection?: { badge: string; headline: string; subheadline: string; ctaText: string };
  features?: PosterPoint[];
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

/**
 * Body POST /api/orders (docs/WHATSAPP-FLOW.md §Baru). Medan bentuk-form lama
 * tetap ikut dikirim agar ringkasan brief di back-office tetap terbaca, sementara
 * medan bernama kontrak (`merekLokasi`, `segmenTarget`, ...) diisi dari form.
 */
export interface OrderBriefPayload extends Brief {
  merekLokasi?: string;
  segmenTarget?: string;
  suasanaMerek?: string;
  aksiUtama?: string;
  nadaRekaman?: string;
}

/** Kontak pelanggan — dikirim nested, tanpa prefiks `contact`. */
export interface OrderContact {
  name: string;
  whatsapp: string;
  email?: string;
}

/** Hasil GET /api/contact: nomor WA resmi dari env `WHATSAPP_NUMBER`. */
export interface ContactInfo {
  whatsappNumber: string;
  whatsappUrl: string;
  whatsappSupportUrl?: string | null;
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
  /** 'satuan' | 'hemat' — kunci paket yang dikirim saat checkout. */
  package_key?: string | null;
  /** Kuota poster dalam satu order (1 atau 3). */
  quota?: number | null;
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

/** Satu baris ai_drafts milik order (kuota paket hemat). */
export interface OrderDraft {
  id: string;
  template_id?: string | null;
  input_prompt_data?: Brief | null;
  ai_generated_content?: Draft | null;
  generated_at?: string | null;
}

export interface OrderResponse {
  order: Order;
  draft: { id: string; ai_generated_content: Draft; template_id: string } | null;
  logs: OrderLog[];
  /** Semua draft milik order (docs/REDESIGN.md §5). */
  drafts?: OrderDraft[];
  /** Sisa kuota poster = quota - jumlah draft. */
  remaining?: number;
}

export interface OrderCreatedResponse {
  order: Order;
  /** Kontrak baru membungkus respons dalam `{data: {order, whatsappUrl}}`. */
  whatsappUrl?: string;
  /** Medan lama; bila absen, nomor diambil dari `order.order_number`. */
  orderNumber?: string;
}

/**
 * Buka body respons apa pun: kontrak baru membungkus payload dalam `data`,
 * sedangkan route lama mengirimnya di level teratas.
 */
export function unwrapData<T extends object>(body: T & { data?: T }): T {
  return body.data ?? body;
}

/** Semua route API mengembalikan `{error}` pada status non-2xx. */
export interface ApiError {
  error: string;
}

/** Kartu paket dari GET /api/packages (docs/REDESIGN.md §2). */
export interface PackageOption {
  key: string;
  name: string;
  price: number;
  quota: number;
  eta?: string | null;
  guarantee?: string | null;
  /** Bentuk gabungan bila backend mengirimnya sebagai satu string. */
  etaGuarantee?: string | null;
  description?: string | null;
  summary?: string | null;
}

export const THEME_OPTIONS: { value: ThemeColorKey; label: string; primary: string; accent: string }[] = [
  { value: 'violet', label: 'Violet modern', primary: '#8b5cf6', accent: '#6d28d9' },
  { value: 'navy', label: 'Navy tepercaya', primary: '#3b4bd8', accent: '#2735a8' },
  { value: 'amber', label: 'Amber hangat', primary: '#f59e0b', accent: '#b45309' },
  { value: 'emerald', label: 'Emerald segar', primary: '#10b981', accent: '#047857' },
];

export const STATUS_STEPS: { key: OrderStatus; label: string; hint: string }[] = [
  { key: 'draft', label: 'Brief diterima', hint: 'Brief masuk antrean' },
  { key: 'paid', label: 'Pembayaran', hint: 'Terverifikasi' },
  { key: 'in_progress', label: 'Dikerjakan', hint: 'Editor menyusun poster' },
  { key: 'review', label: 'Review editor', hint: 'Cek mutu & ketepatan brief' },
  { key: 'completed', label: 'Selesai', hint: 'Poster siap pakai' },
];

/**
 * Pembuka chat WhatsApp yang disesuaikan dengan tahap pesanan — dipakai
 * tombol "Chat via WhatsApp" di /orders dan LastOrderHint.
 */
export const WHATSAPP_STAGE_HINTS: Record<OrderStatus, string> = {
  draft: 'Brief diterima — tanyakan posisi antrean editor.',
  paid: 'Konfirmasi pembayaran dan kirim bukti transfer.',
  in_progress: 'Koordinasi detail pengerjaan poster.',
  review: 'Bahas hasil review dan minta penyesuaian.',
  completed: 'Serah terima file final dan konfirmasi selesai.',
};

export function whatsappStageHint(status: string | null | undefined): string {
  const key = (status ?? '').trim();
  if (!key) return 'Konfirmasi, revisi, dan serah terima berjalan di chat WhatsApp.';
  return WHATSAPP_STAGE_HINTS[key as OrderStatus] ??
    'Konfirmasi, revisi, dan serah terima berjalan di chat WhatsApp.';
}

export const CATEGORY_LABELS: Record<string, string> = {
  kuliner: 'Kuliner',
  kreator: 'Kreator',
  toko: 'Toko Online',
  // Kategori lama di database yang belum dimigrasi tetap terbaca jelas.
  fnb: 'Kuliner',
  portfolio: 'Kreator',
  shop: 'Toko Online',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brief diterima',
  paid: 'Pembayaran masuk',
  in_progress: 'Sedang dikerjakan',
  review: 'Review editor',
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

/** Estimasi waktu kerja dari kartu paket; kosong bila backend tidak mengirim. */
export function packageEta(pkg: PackageOption): string {
  return (pkg.eta ?? '').trim() || (pkg.etaGuarantee ?? '').trim();
}

/** Garansi dari kartu paket. Bila backend hanya mengirim eta gabungan dan eta
 *  sudah dipakai di atas, baris garansi disembunyikan (bukan diisi teks dobel). */
export function packageGuarantee(pkg: PackageOption): string {
  const guarantee = (pkg.guarantee ?? '').trim();
  if (guarantee) return guarantee;
  return pkg.eta ? '' : (pkg.etaGuarantee ?? '').trim();
}

/** Deskripsi isi paket: diprioritaskan dari backend, bukan teks hardcode. */
export function packageSummary(pkg: PackageOption): string {
  const text = (pkg.description ?? pkg.summary ?? '').trim();
  if (text) return text;
  return `${pkg.quota} poster per order`;
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