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
  /** 'satuan' | 'hemat' (docs/REDESIGN.md §2). Opsional: order lama belum punya. */
  package_key?: string | null;
  /** Kuota poster per order: 1 untuk Satuan, 3 untuk Paket Hemat. */
  quota?: number | null;
  /** Beberapa build backend menyertakan sisa kuota langsung di baris order. */
  remaining?: number | null;
  draft_count?: number | null;
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
  /** Enum tema baru (docs/REDESIGN.md §4): indigo digantikan violet. */
  themeColor: 'violet' | 'navy' | 'amber' | 'emerald';
  ctaText: string;
  toneOfVoice: string;
}

export interface DraftPoint {
  icon: string;
  title: string;
  description: string;
}

/** Skema draft poster (docs/REDESIGN.md §4): `poster` + tepat 3 `points`. */
export interface Draft {
  brand: { name: string; tagline: string; about: string };
  theme: { primaryColor: string; accentColor: string; fontPairing: string };
  poster?: { badge: string; headline: string; subheadline: string; ctaText: string };
  points?: DraftPoint[];
  /** Bentuk lama (website) yang masih mungkin dikirim backend lama saat transisi. */
  heroSection?: { badge: string; headline: string; subheadline: string; ctaText: string };
  features?: DraftPoint[];
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

/**
 * Kolom papan tempat sebuah status order berada (draft/paid -> backlog).
 * Menerima string apa pun: status tak dikenal dari API harus jatuh ke Backlog,
 * bukan membuat `COLUMN_META[column]` crash di layar (docs/REDESIGN.md §12).
 */
export function columnOfStatus(status: OrderStatus | string | null | undefined): ColumnKey {
  if (status === 'in_progress' || status === 'review' || status === 'completed') return status;
  return 'backlog';
}

/** Baca bilangan bulat positif dari field API yang bisa saja hilang/nyasar. */
export function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

export interface QuotaInfo {
  /** Kuota poster pada paket (1 atau 3). */
  quota: number | null;
  /** Poster yang sudah dibuat. */
  used: number | null;
  /** Poster yang masih boleh diminta. */
  remaining: number | null;
}

/**
 * Sisa kuota order. `remaining` dari API menang bila ada; kalau tidak, dihitung
 * dari kuota dikurangi jumlah draft yang diketahui. Semuanya bisa null — UI
 * menampilkan "—" alih-alih mengarang angka.
 */
export function quotaOf(order: Partial<AdminOrder>, knownDrafts?: number | null): QuotaInfo {
  const quota = positiveInt(order.quota);
  const used = positiveInt(order.draft_count) ?? positiveInt(knownDrafts);
  const apiRemaining = positiveInt(order.remaining);
  const remaining =
    apiRemaining ?? (quota !== null && used !== null ? Math.max(quota - used, 0) : null);
  return { quota, used, remaining };
}

/** Ringkasan kuota untuk kartu kanban: "sisa 2 dari 3", "kuota 3", atau "—". */
export function quotaSummary(info: QuotaInfo): { text: string; tone: string } {
  if (info.remaining !== null && info.quota !== null) {
    return {
      text: `sisa ${info.remaining}/${info.quota}`,
      tone: info.remaining > 0 ? 'text-ok' : 'text-danger',
    };
  }
  if (info.remaining !== null) {
    return { text: `sisa ${info.remaining}`, tone: info.remaining > 0 ? 'text-ok' : 'text-danger' };
  }
  if (info.quota !== null) return { text: `kuota ${info.quota}`, tone: 'text-ink-soft' };
  return { text: '—', tone: 'text-ink-soft' };
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
