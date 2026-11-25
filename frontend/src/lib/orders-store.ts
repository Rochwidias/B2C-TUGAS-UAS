// Penyimpanan pesanan lokal — satu-satunya modul yang menyentuh
// `localStorage['aether-orders']` (docs/FRONTEND-ONLY.md). Aplikasi berjalan
// tanpa backend dan tanpa database: shop (components/shop) dan back-office
// (components/admin) sama-sama membaca store ini, sehingga pesanan yang
// dibuat customer langsung tampak di kanban admin pada browser yang sama.
//
// Aturan main:
// - Komponen TIDAK boleh membaca/menulis key localStorage pesanan sendiri;
//   semua lewat fungsi di sini supaya skema, nomor order, dan event
//   `craftai:recent-changed` konsisten satu tempat.
// - Penyimpanan diblokir (SSR, private mode) bukan error: fungsi kembali ke
//   nilai kosong dan createOrder tetap mengembalikan objek order agar alur
//   WhatsApp tidak macet — hanya riwayat yang hilang.
import type {
  Draft,
  Order,
  OrderBriefPayload,
  OrderContact,
  OrderDraft,
  OrderLog,
  OrderResponse,
  OrderStatus,
} from '@/components/shop/types';

export const ORDER_STORE_KEY = 'aether-orders';
export const RECENT_EVENT = 'craftai:recent-changed';
export const LAST_ORDER_KEY = 'craftai-last-order';
export const LAST_ORDER_EVENT = 'craftai:last-order-changed';

/** Format nomor pesanan yang berlaku — satu-satunya bentuk yang sah. */
export const ORDER_NUMBER_PATTERN = /^UK-ORD-\d{4}$/;

/** Satu konten poster milik order (dulu baris `ai_drafts` di backend). */
export interface StoredDraft extends OrderDraft {
  /** Konten hasil editor manusia selalu 'manual' (docs/REDESIGN.md §4). */
  engine?: string;
}

/** Order lengkap beserta riwayat log dan daftar konten posternya. */
export interface StoredOrder extends Order {
  /** Brief asli yang diisi customer saat checkout — tampil di back-office. */
  brief?: OrderBriefPayload | null;
  logs: OrderLog[];
  drafts: StoredDraft[];
}

export type AddBriefResult =
  | { ok: true; order: StoredOrder }
  | { ok: false; reason: 'not_found' | 'quota' };

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Baca seluruh order; data rusak/sembarang dinormalisasi, bukan crash. */
export function listOrders(): StoredOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDER_STORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): StoredOrder[] => {
      if (!entry || typeof entry !== 'object') return [];
      const order = entry as Partial<StoredOrder>;
      if (typeof order.id !== 'string' || typeof order.order_number !== 'string') return [];
      return [
        {
          ...(order as Order),
          brief: order.brief ?? null,
          logs: Array.isArray(order.logs) ? order.logs : [],
          drafts: Array.isArray(order.drafts) ? order.drafts : [],
        },
      ];
    });
  } catch {
    return [];
  }
}

function persist(orders: StoredOrder[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(ORDER_STORE_KEY, JSON.stringify(orders.slice(0, 50)));
    window.dispatchEvent(new Event(RECENT_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function getOrderById(id: string): StoredOrder | null {
  return listOrders().find((order) => order.id === id) ?? null;
}

export function getOrderByNumber(orderNumber: string): StoredOrder | null {
  const value = orderNumber.trim().toUpperCase();
  return listOrders().find((order) => order.order_number === value) ?? null;
}

/** Sisa kuota poster = kuota paket dikurangi konten yang sudah dibuat. */
export function remainingOf(order: StoredOrder): number {
  const quota = typeof order.quota === 'number' && order.quota > 0 ? order.quota : 1;
  return Math.max(quota - order.drafts.length, 0);
}

/** Nomor UK-ORD-XXXX unik terhadap order yang sudah tersimpan. */
function nextOrderNumber(orders: StoredOrder[]): string {
  const taken = new Set(orders.map((order) => order.order_number));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = `UK-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Praktis mustahil (9999 kombinasi), tetap jujur kalau terjadi.
  return `UK-ORD-${Date.now() % 10000}`;
}

export interface CreateOrderInput {
  templateId: string;
  packageName: string;
  packageKey: string;
  quota: number;
  price: number;
  contact: OrderContact;
  brief: OrderBriefPayload;
}

/** Buat order baru: status `draft`, nomor unik, disimpan di depan daftar. */
export function createOrder(input: CreateOrderInput): StoredOrder {
  const orders = listOrders();
  const timestamp = nowIso();
  const created: StoredOrder = {
    id: `aether-${Date.now()}`,
    order_number: nextOrderNumber(orders),
    template_id: input.templateId,
    status: 'draft',
    payment_status: 'belum_dibayar',
    total_price: input.price,
    contact_name: input.contact.name,
    contact_whatsapp: input.contact.whatsapp,
    contact_email: input.contact.email ?? '',
    package_name: input.packageName,
    package_key: input.packageKey,
    quota: input.quota,
    brief: input.brief,
    live_website_url: null,
    download_zip_url: null,
    dev_note: null,
    logs: [
      {
        id: newId('log'),
        order_id: '',
        status_from: null,
        status_to: 'draft',
        developer_note: 'Pesanan dibuat dari halaman customizer.',
        timestamp,
      },
    ],
    drafts: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
  persist([created, ...orders]);
  return created;
}

/** Satu-satunya jalur ubah order: mutator murni, store yang menyimpan. */
export function mutateOrder(
  id: string,
  mutate: (order: StoredOrder) => StoredOrder | null,
): StoredOrder | null {
  const orders = listOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  const next = mutate(orders[index]);
  if (!next) return null;
  const updated: StoredOrder = { ...next, updated_at: nowIso() };
  orders[index] = updated;
  persist(orders);
  return updated;
}

function appendLog(
  order: StoredOrder,
  statusFrom: string | null,
  statusTo: string,
  developerNote: string | null,
): StoredOrder {
  return {
    ...order,
    status: statusTo as OrderStatus,
    logs: [
      ...order.logs,
      {
        id: newId('log'),
        order_id: order.id,
        status_from: statusFrom,
        status_to: statusTo,
        developer_note: developerNote,
        timestamp: nowIso(),
      },
    ],
  };
}

/** Naik/turunkan status + catatan dev; log hanya bila ada perubahan. */
export function setStatus(id: string, to: OrderStatus, note?: string | null): StoredOrder | null {
  return mutateOrder(id, (order) => {
    const cleanNote = (note ?? '').trim() || null;
    if (order.status === to && !cleanNote) return order;
    return appendLog(order, order.status, to, cleanNote);
  });
}

/** Catatan revisi customer: status tidak berubah, log berprefix [REVISI]. */
export function addRevisionNote(id: string, message: string): StoredOrder | null {
  const clean = message.trim();
  if (!clean) return null;
  return mutateOrder(id, (order) => appendLog(order, order.status, order.status, `[REVISI] ${clean}`));
}

/**
 * Customer minta poster tambahan dalam kuota paket (dulu POST .../briefs).
 * Gagal bila nomor tidak dikenal atau kuota sudah habis.
 */
export function addBriefPoster(id: string, brief: OrderBriefPayload): AddBriefResult {
  const order = getOrderById(id);
  if (!order) return { ok: false, reason: 'not_found' };
  if (remainingOf(order) <= 0) return { ok: false, reason: 'quota' };
  const updated = mutateOrder(id, (current) => ({
    ...appendLog(current, current.status, current.status, '[BRIEF TAMBAHAN] Brief poster baru masuk antrean.'),
    drafts: [
      {
        id: newId('draft'),
        template_id: current.template_id,
        input_prompt_data: brief,
        engine: 'manual',
        generated_at: nowIso(),
      },
      ...current.drafts,
    ],
  }));
  return updated ? { ok: true, order: updated } : { ok: false, reason: 'not_found' };
}

/** Editor menyimpan konten poster (dulu PUT /api/admin/orders/:id/poster). */
export function savePoster(id: string, content: Draft): StoredOrder | null {
  return mutateOrder(id, (order) => ({
    ...appendLog(order, order.status, order.status, '[POSTER] Konten poster disimpan editor.'),
    drafts: [
      {
        id: newId('draft'),
        template_id: order.template_id,
        ai_generated_content: content,
        engine: 'manual',
        generated_at: nowIso(),
      },
      ...order.drafts,
    ],
  }));
}

export interface DeliveryPatch {
  live_website_url?: string | null;
  download_zip_url?: string | null;
  dev_note?: string | null;
}

/** Simpan serah terima (live URL, unduhan, catatan) + log. */
export function setDelivery(id: string, patch: DeliveryPatch): StoredOrder | null {
  return mutateOrder(id, (order) => {
    const changed =
      (patch.live_website_url !== undefined && patch.live_website_url !== order.live_website_url) ||
      (patch.download_zip_url !== undefined && patch.download_zip_url !== order.download_zip_url) ||
      (patch.dev_note !== undefined && patch.dev_note !== order.dev_note);
    const next: StoredOrder = {
      ...order,
      live_website_url: patch.live_website_url ?? order.live_website_url,
      download_zip_url: patch.download_zip_url ?? order.download_zip_url,
      dev_note: patch.dev_note ?? order.dev_note,
    };
    return changed ? appendLog(next, next.status, next.status, '[DELIVERY] Detail serah terima diperbarui.') : next;
  });
}

/** Bentuk respons yang dikonsumsi UI lacak/detail (OrderResponse). */
export function toResponse(order: StoredOrder, templateName?: string | null): OrderResponse & { templateName?: string | null } {
  const latest = order.drafts[0] ?? null;
  return {
    order,
    draft: latest
      ? {
          id: latest.id,
          ai_generated_content: latest.ai_generated_content as Draft,
          template_id: latest.template_id ?? order.template_id,
        }
      : null,
    drafts: order.drafts,
    logs: order.logs,
    remaining: remainingOf(order),
    templateName: templateName ?? null,
  };
}

const DEMO_ID = 'demo-uk-ord-8812';

/** Benarkan pesanan demo UK-ORD-8812 bila penyimpanan masih kosong, supaya
 *  alur lacak + kanban admin bisa dicoba segera tanpa backend. */
export function ensureDemoOrder(): void {
  if (typeof window === 'undefined') return;
  const existing = listOrders();
  if (existing.length > 0) return;
  const demoDraft: Draft = {
    brand: {
      name: 'Kopi Senja',
      tagline: 'Ngopi santai, harga mahasiswa',
      about: 'Kedai kopi kekinian di utara Yogyakarta — tempat ngerjain tugas sambil ngopi.',
    },
    theme: { primaryColor: '#8b5cf6', accentColor: '#6d28d9', fontPairing: 'Archivo / Instrument Serif' },
    poster: {
      badge: 'PROMO',
      headline: 'Kopi Senja Diskon 30%',
      subheadline: 'Setiap Senin–Rabu, pukul 14.00–17.00 WIB untuk semua menu kopi susu.',
      ctaText: 'Pesan via WhatsApp',
    },
    points: [
      { icon: '☕', title: 'Kopi susu gula aren', description: 'Biji arabika single origin, diseduh fresh.' },
      { icon: '📶', title: 'WiFi kencang', description: 'Colokan di tiap meja, cocok untuk ngerjain tugas.' },
      { icon: '📍', title: 'Dekat kampus', description: 'Jl. Kaliurang KM 5, 3 menit dari gerbang kampus.' },
    ],
  };
  const log = (from: string | null, to: string, note: string | null, at: string): OrderLog => ({
    id: newId('log'),
    order_id: DEMO_ID,
    status_from: from,
    status_to: to,
    developer_note: note,
    timestamp: at,
  });
  const demo: StoredOrder = {
    id: DEMO_ID,
    order_number: 'UK-ORD-8812',
    template_id: 'artisan-cafe',
    status: 'completed',
    payment_status: 'lunas',
    total_price: 100000,
    contact_name: 'Budi Santoso',
    contact_whatsapp: '6281234567890',
    contact_email: 'budi@example.com',
    package_name: 'Paket Hemat',
    package_key: 'hemat',
    quota: 3,
    brief: {
      templateId: 'artisan-cafe',
      brandName: 'Kopi Senja',
      tagline: 'Ngopi santai, harga mahasiswa',
      description: 'Kedai kopi di utara Yogyakarta, target mahasiswa.',
      themeColor: 'violet',
      ctaText: 'Pesan via WhatsApp',
      toneOfVoice: 'santai',
      merekLokasi: 'Kopi Senja — Jl. Kaliurang KM 5, Yogyakarta',
      segmenTarget: 'Mahasiswa & pelajar yang ngerjain tugas bareng',
      suasanaMerek: 'hangat, santai, ramah kantong mahasiswa',
      aksiUtama: 'Datang dan pesan kopi susu promo',
      nadaRekaman: 'santai',
    },
    live_website_url: null,
    download_zip_url: null,
    dev_note: 'Poster final sudah dikirim via WhatsApp.',
    logs: [
      log(null, 'draft', 'Pesanan demo dibuat.', '2026-11-20T08:00:00Z'),
      log('draft', 'paid', 'Pembayaran Paket Hemat dikonfirmasi.', '2026-11-20T09:15:00Z'),
      log('paid', 'in_progress', 'Editor menyusun konten poster.', '2026-11-21T10:00:00Z'),
      log('in_progress', 'review', 'Review ketepatan brief selesai.', '2026-11-22T13:00:00Z'),
      log('review', 'completed', 'Poster final dikirim via WhatsApp.', '2026-11-22T14:30:00Z'),
    ],
    drafts: [
      {
        id: 'demo-draft-8812',
        template_id: 'artisan-cafe',
        ai_generated_content: demoDraft,
        engine: 'manual',
        generated_at: '2026-11-22T12:00:00Z',
      },
    ],
    created_at: '2026-11-20T08:00:00Z',
    updated_at: '2026-11-22T14:30:00Z',
  };
  try {
    window.localStorage.setItem(ORDER_STORE_KEY, JSON.stringify([demo]));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Penyimpanan diblokir: demo tidak tersedia, tapi formulir tetap jalan.
  }
}

/** Simpan/hapus pintasan "Lanjutkan pesanan terakhir" di /orders. */
export function setLastOrder(entry: { number: string; id: string; status: string }): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ...entry, at: Date.now() }));
    window.dispatchEvent(new Event(LAST_ORDER_EVENT));
  } catch {
    // Penyimpanan diblokir: tombol pintasan tidak tampil, alur utama aman.
  }
}
