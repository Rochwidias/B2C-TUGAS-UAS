// Kontrak data lokal untuk halaman back-office. Bentuknya mengikuti docs/SPEC.md
// dan src/lib/types.ts, tetapi sengaja dideklarasikan ulang agar halaman admin
// tidak langsung bergantung pada modul milik Agent-BACKEND saat build paralel.
//
// Nilai tampilan (COLUMN_META, STATUS_TONE) memakai utility token semantik dari
// globals.css supaya tema gelap ikut beralih tanpa varian tema di komponen.

export type OrderStatus = 'draft' | 'paid' | 'in_progress' | 'review' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';

export interface AdminOrder {
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

export interface OrderLog {
  id: string;
  order_id: string;
  status_from: string | null;
  status_to: string;
  developer_note: string | null;
  timestamp: string;
}

export interface DraftBrief {
  templateId: string;
  brandName: string;
  tagline: string;
  description: string;
  themeColor: 'amber' | 'indigo' | 'emerald' | 'rose';
  ctaText: string;
  toneOfVoice: string;
}

export interface Draft {
  brand: { name: string; tagline: string; about: string };
  theme: { primaryColor: string; accentColor: string; fontPairing: string };
  heroSection: { badge: string; headline: string; subheadline: string; ctaText: string };
  features: { icon: string; title: string; description: string }[];
  faq: { q: string; a: string }[];
}

export interface AdminDraft {
  id: string;
  order_id: string | null;
  template_id: string;
  input_prompt_data: DraftBrief;
  ai_generated_content: Draft;
  generated_at: string;
}

export interface KanbanColumns {
  backlog: AdminOrder[];
  in_progress: AdminOrder[];
  review: AdminOrder[];
  completed: AdminOrder[];
}

export type ColumnKey = keyof KanbanColumns;

// Ringkasan dari GET /api/admin/stats. Dipakai baris statistik dashboard supaya
// angka yang tampil berasal dari data, bukan konstanta di komponen.
export interface AdminStats {
  counts: Record<OrderStatus, number> & { total: number };
  revenue: number;
  delivered: number;
  averageCompletionHours: number | null;
  totalLogs: number;
  recentOrders: AdminOrder[];
}

export const COLUMN_ORDER: ColumnKey[] = ['backlog', 'in_progress', 'review', 'completed'];

// Label kolom dipakai apa adanya oleh papan — jangan diubah tanpa menyesuaikan
// teks yang diperiksa tes E2E.
export const COLUMN_META: Record<
  ColumnKey,
  { label: string; hint: string; dot: string; ring: string }
> = {
  backlog: { label: 'Backlog', hint: 'draft + paid', dot: 'bg-ink-soft', ring: 'border-rule' },
  in_progress: { label: 'In Progress', hint: 'sedang dikerjakan', dot: 'bg-warn', ring: 'border-warn' },
  review: { label: 'Need Review', hint: 'menunggu QA', dot: 'bg-accent', ring: 'border-accent' },
  completed: { label: 'Completed', hint: 'siap kirim', dot: 'bg-ok', ring: 'border-ok' },
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  paid: 'Paid',
  in_progress: 'In Progress',
  review: 'Need Review',
  completed: 'Completed',
};

// Cap status: kotak ber-border 1.5px + huruf mono, bukan pill glassy.
export const STATUS_TONE: Record<OrderStatus, string> = {
  draft: 'border-rule text-ink-soft',
  paid: 'border-ink text-ink',
  in_progress: 'border-warn text-warn',
  review: 'border-accent text-accent',
  completed: 'border-ok text-ok',
};

export const ALL_STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

/** Filter status sisi klien: 'all' atau salah satu kolom papan. */
export type StatusFilter = 'all' | ColumnKey;

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua status' },
  { value: 'backlog', label: 'Backlog (draft + paid)' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Need Review' },
  { value: 'completed', label: 'Completed' },
];

/** Kolom papan tempat sebuah status order berada (draft/paid -> backlog). */
export function columnOfStatus(status: OrderStatus): ColumnKey {
  if (status === 'draft' || status === 'paid') return 'backlog';
  return status;
}

/** Angka aman: respons API yang cacat tidak boleh menjelma "NaN" di layar. */
export function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function formatRupiah(value: number | null | undefined): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

/** Versi ringkas untuk kartu statistik: Rp 12,4 jt, bukan 12.400.000. */
export function formatRupiahShort(value: number | null | undefined): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(safeNumber(value));
}

/** Rata-rata jam selesai; '—' saat belum ada order completed. */
export function formatHours(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value)} jam`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(parsed);
}
