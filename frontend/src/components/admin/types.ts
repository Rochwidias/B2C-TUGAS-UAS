// Kontrak data lokal untuk halaman back-office. Bentuknya mengikuti docs/SPEC.md
// dan src/lib/types.ts, tetapi sengaja dideklarasi ulang agar halaman admin
// tidak langsung bergantung pada modul milik Agent-BACKEND saat build paralel.

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

export const COLUMN_ORDER: ColumnKey[] = ['backlog', 'in_progress', 'review', 'completed'];

export const COLUMN_META: Record<
  ColumnKey,
  { label: string; hint: string; dot: string; ring: string }
> = {
  backlog: {
    label: 'Backlog',
    hint: 'draft + paid',
    dot: 'bg-sky-400',
    ring: 'border-sky-500/40',
  },
  in_progress: {
    label: 'In Progress',
    hint: 'sedang dikerjakan',
    dot: 'bg-amber-400',
    ring: 'border-amber-500/40',
  },
  review: {
    label: 'Need Review',
    hint: 'menunggu QA',
    dot: 'bg-rose-400',
    ring: 'border-rose-500/40',
  },
  completed: {
    label: 'Completed',
    hint: 'siap kirim',
    dot: 'bg-emerald-400',
    ring: 'border-emerald-500/40',
  },
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  paid: 'Paid',
  in_progress: 'In Progress',
  review: 'Need Review',
  completed: 'Completed',
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-300 ring-slate-500/40',
  paid: 'bg-sky-500/15 text-sky-300 ring-sky-500/40',
  in_progress: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  review: 'bg-rose-500/15 text-rose-300 ring-rose-500/40',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
};

export const ALL_STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
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