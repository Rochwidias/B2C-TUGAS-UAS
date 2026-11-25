// Service order: semua logika bisnis pesanan web, tracking, brief tambahan, dan
// revisi dipusatkan di sini supaya route handler tinggal memetakan Result ke
// response (wrapper tipis). Tidak ada lagi jalur AI — pesanan dibuat dari brief
// yang diketik customer, konten poster ditulis editor lewat back-office
// (docs/WHATSAPP-FLOW.md), lalu konfirmasi berlangsung di WhatsApp.

import {
  attachDraftToOrder,
  createOrder,
  getDraft,
  getDraftByOrderId,
  getOrderByNumber,
  getTemplate,
  insertDraft,
  insertLog,
  listDraftsByOrderId,
  listLogs,
  remainingQuota,
  touchOrder,
} from '../lib/db';
import { THEME_KEYS, scaffoldPoster } from '../lib/brief';
import { findPackage, PACKAGE_KEYS } from '../lib/packages';
import { orderMessage, waMeUrl } from '../lib/whatsapp';
import type { AIDraft, Draft, DraftBrief, Order, OrderBrief, OrderLog, ThemeColorKey } from '../types';
import { LIMITS, isValidEmail, isValidWhatsapp, normalizeWhatsapp, requireCap } from '../lib/security';
import { asString } from '../lib/http';

/** Batas panjang brief pesanan (dokumen pesanan — bukan teks poster). */
const BRIEF_LIMITS = {
  merekLokasi: 160,
  segmenTarget: 240,
  suasanaMerek: 240,
  aksiUtama: 240,
  nadaRekaman: 160,
} as const;

export interface ContactInput {
  name: string;
  whatsapp: string;
  email: string;
}

export type CreateOrderResult =
  | { ok: true; order: Order; logs: OrderLog[]; whatsappUrl: string }
  | { ok: false; status: number; error: string };

/** Validasi brief pesanan (body `brief` pada POST /api/orders). */
export function parseOrderBrief(raw: unknown): { ok: true; brief: OrderBrief } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'brief wajib diisi.' };
  }
  const body = raw as Record<string, unknown>;

  const entries: Array<[keyof OrderBrief, string]> = [
    ['merekLokasi', 'Merek & lokasi'],
    ['segmenTarget', 'Segmen target'],
    ['suasanaMerek', 'Suasana merek'],
    ['aksiUtama', 'Aksi utama'],
    ['nadaRekaman', 'Nada rekaman'],
  ];

  const brief: OrderBrief = {
    merekLokasi: '',
    segmenTarget: '',
    suasanaMerek: '',
    aksiUtama: '',
    nadaRekaman: '',
  };

  for (const [key, label] of entries) {
    const capped = requireCap(asString(body[key]), BRIEF_LIMITS[key], label);
    if (!capped.value) return { ok: false, error: `${key} wajib diisi.` };
    if (!capped.ok) return { ok: false, error: capped.error! };
    brief[key] = capped.value;
  }

  return { ok: true, brief };
}

/** Validasi kontak pelanggan (body `contact` pada POST /api/orders). */
function parseContact(raw: unknown): { ok: true; contact: ContactInput } | { ok: false; status: number; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'contact wajib diisi.' };
  }
  const body = raw as Record<string, unknown>;

  const name = requireCap(asString(body.name), LIMITS.contactName, 'Nama kontak');
  if (!name.value) return { ok: false, status: 400, error: 'Nama kontak wajib diisi.' };
  if (!name.ok) return { ok: false, status: 400, error: name.error! };

  const whatsapp = requireCap(asString(body.whatsapp), LIMITS.whatsapp, 'Nomor WhatsApp');
  if (!whatsapp.value) return { ok: false, status: 400, error: 'Nomor WhatsApp wajib diisi.' };
  if (!isValidWhatsapp(whatsapp.value)) {
    return { ok: false, status: 400, error: 'Nomor WhatsApp tidak valid. Contoh: 081234567890.' };
  }

  // Email opsional (kontrak `contact: {name, whatsapp, email?}`) — divalidasi
  // hanya bila dikirim.
  const email = asString(body.email).trim();
  if (email) {
    if (email.length > LIMITS.email) return { ok: false, status: 400, error: 'Email maksimal 160 karakter.' };
    if (!isValidEmail(email)) {
      return { ok: false, status: 400, error: 'Email kontak tidak valid. Contoh: nama@domain.com.' };
    }
  }

  return { ok: true, contact: { name: name.value, whatsapp: normalizeWhatsapp(whatsapp.value), email } };
}

/**
 * Validasi + buat order `draft` tanpa draftId (kontrak WHATSAPP-FLOW §POST
 * /api/orders). Tidak menyentuh Request/Response; `whatsappUrl` berisi pesan
 * konfirmasi dengan nomor order, paket, ETA, dan brief.
 */
export function createOrderFromBody(body: Record<string, unknown>): CreateOrderResult {
  const templateId = asString(body.templateId);
  const packageKey = asString(body.packageKey);

  if (!templateId) return { ok: false, status: 400, error: 'templateId wajib diisi.' };
  if (!packageKey) return { ok: false, status: 400, error: 'packageKey wajib diisi.' };

  // Harga & kuota hanya boleh datang dari GET /api/packages (§2).
  const pkg = findPackage(packageKey);
  if (!pkg) {
    return { ok: false, status: 400, error: `packageKey harus salah satu dari: ${PACKAGE_KEYS.join(', ')}.` };
  }

  const briefParsed = parseOrderBrief(body.brief);
  if (!briefParsed.ok) return { ok: false, status: 400, error: briefParsed.error };

  const contactParsed = parseContact(body.contact);
  if (!contactParsed.ok) return { ok: false, status: contactParsed.status, error: contactParsed.error };

  const template = getTemplate(templateId);
  if (!template) return { ok: false, status: 404, error: `Template "${templateId}" tidak ditemukan.` };

  const created = createOrder({
    templateId: template.id,
    packageKey: pkg.key,
    contactName: contactParsed.contact.name,
    contactWhatsapp: contactParsed.contact.whatsapp,
    contactEmail: contactParsed.contact.email,
  });

  // Tautan wa.me yang sudah terisi pesan konfirmasi pesanan (nomor order,
  // nama paket, ETA, brief).
  const whatsappUrl = waMeUrl(
    orderMessage({
      orderNumber: created.order.order_number,
      packageName: created.order.package_name,
      eta: pkg.eta,
      price: created.order.total_price,
      brief: briefParsed.brief,
      contact: contactParsed.contact,
    }),
  );

  return { ok: true, order: created.order, logs: created.logs, whatsappUrl };
}

export type LookupOrderResult =
  | { ok: true; order: Order; draft: PublicDraft | null; logs: OrderLog[] }
  | { ok: false; status: number; error: string };

/**
 * Draft tanpa field `engine` — kontrak WHATSAPP-FLOW: tipe AIEngine dan field
 * `engine` di respons draft dihapus. Kolom `engine` tetap ada di DB (diisi
 * 'manual' oleh editor back-office) tapi tidak lagi ikut ke API.
 */
export type PublicDraft = Omit<AIDraft, 'engine'>;

export function publicDraft(draft: AIDraft): PublicDraft {
  return {
    id: draft.id,
    order_id: draft.order_id,
    template_id: draft.template_id,
    input_prompt_data: draft.input_prompt_data,
    ai_generated_content: draft.ai_generated_content,
    generated_at: draft.generated_at,
  };
}

/** Cari order publik berdasarkan nomor. Tidak menyentuh Request/Response. */
export function lookupOrderByNumber(rawNumber: string): LookupOrderResult {
  const number = rawNumber.trim();
  if (!number) return { ok: false, status: 400, error: 'Parameter ?number=UK-ORD-XXXX wajib diisi.' };
  if (number.length > 20) return { ok: false, status: 400, error: 'Format nomor order tidak valid.' };

  const order = getOrderByNumber(number);
  if (!order) return { ok: false, status: 404, error: `Pesanan dengan nomor ${number.toUpperCase()} tidak ditemukan.` };

  const fallback = getDraftByOrderId(order.id);
  return { ok: true, order, draft: fallback ? publicDraft(fallback) : null, logs: listLogs(order.id) };
}

export interface OrderDetail {
  order: Order;
  draft: PublicDraft | null;
  drafts: PublicDraft[];
  logs: OrderLog[];
  remaining: number;
}

/**
 * Bentuk response standar detail order (§5): semua draft milik order (penting
 * untuk kuota Paket Hemat) + `remaining`, jadi UI tidak perlu endpoint lain.
 * `engine` tidak ikut (kontrak WHATSAPP-FLOW).
 */
export function orderDetail(order: Order): OrderDetail {
  const drafts = listDraftsByOrderId(order.id).map(publicDraft);
  const fallback = getDraftByOrderId(order.id);
  return {
    order,
    draft: drafts.length > 0 ? drafts[drafts.length - 1] : fallback ? publicDraft(fallback) : null,
    drafts,
    logs: listLogs(order.id),
    remaining: remainingQuota(order),
  };
}

export type BriefParseResult = { ok: true; brief: DraftBrief } | { ok: false; error: string };

/** Validasi brief poster — bentuk input tidak berubah (§4). */
export function parseBrief(body: Record<string, unknown>): BriefParseResult {
  const templateId = asString(body.templateId);

  const brandName = requireCap(asString(body.brandName), LIMITS.brandName, 'Nama brand');
  if (!brandName.value) return { ok: false, error: 'brandName wajib diisi.' };
  if (!brandName.ok) return { ok: false, error: brandName.error! };

  const tagline = requireCap(asString(body.tagline), LIMITS.tagline, 'Tagline');
  if (!tagline.ok) return { ok: false, error: tagline.error! };

  const description = requireCap(asString(body.description), LIMITS.description, 'Deskripsi bisnis');
  if (!description.ok) return { ok: false, error: description.error! };

  const ctaText = requireCap(asString(body.ctaText), LIMITS.ctaText, 'Teks tombol');
  if (!ctaText.ok) return { ok: false, error: ctaText.error! };

  const toneOfVoice = requireCap(asString(body.toneOfVoice), LIMITS.toneOfVoice, 'Nada penulisan');
  if (!toneOfVoice.ok) return { ok: false, error: toneOfVoice.error! };

  const themeColor = asString(body.themeColor) as ThemeColorKey;
  if (!THEME_KEYS.includes(themeColor)) {
    return { ok: false, error: `themeColor harus salah satu dari: ${THEME_KEYS.join(', ')}.` };
  }

  return {
    ok: true,
    brief: {
      templateId,
      brandName: brandName.value,
      tagline: tagline.value,
      description: description.value,
      themeColor,
      ctaText: ctaText.value,
      toneOfVoice: toneOfVoice.value,
    },
  };
}

export type AddBriefResult =
  | { ok: true; draft: PublicDraft; content: Draft; detail: OrderDetail }
  | { ok: false; status: number; error: string };

/**
 * Tambah brief dalam kuota (§5): 400 bila `remaining <= 0` dengan pesan jelas,
 * membuat `ai_drafts` terhubung ke order + log `[BRIEF TAMBAHAN]`. Tidak ada
 * generator — draft berisi kerangka kosong yang menunggu editor back-office.
 */
export async function addBriefToOrder(order: Order, body: Record<string, unknown>): Promise<AddBriefResult> {
  const parsed = parseBrief(body);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };

  const templateId = parsed.brief.templateId || order.template_id;
  const template = getTemplate(templateId);
  if (!template) return { ok: false, status: 404, error: `Template "${templateId}" tidak ditemukan.` };

  if (remainingQuota(order) <= 0) {
    return { ok: false, status: 400, error: 'Kuota paket sudah habis. Pesan Paket Hemat untuk menambah poster.' };
  }

  const brief: DraftBrief = { ...parsed.brief, templateId };
  const content = scaffoldPoster(brief);

  const created = insertDraft(template.id, brief, content, 'manual');
  if (!attachDraftToOrder(created.id, order.id)) {
    return { ok: false, status: 500, error: 'Draft gagal dirujuk oleh order.' };
  }
  touchOrder(order.id);
  insertLog(order.id, order.status, order.status, `[BRIEF TAMBAHAN] ${briefSummary(brief)}`);

  return {
    ok: true,
    draft: publicDraft(getDraft(created.id)!),
    content,
    detail: orderDetail(order),
  };
}

function briefSummary(brief: DraftBrief): string {
  const name = brief.brandName || 'Tanpa nama';
  const angle = brief.tagline || brief.description.slice(0, 60);
  return angle ? `${name} — ${angle}` : name;
}

export type RevisionResult =
  | { ok: true; log: OrderLog; detail: OrderDetail }
  | { ok: false; status: number; error: string };

const REVISION_STATUSES: Order['status'][] = ['paid', 'in_progress', 'review'];

/** Minta revisi (§5): hanya saat paid/in_progress/review; status TIDAK berubah. */
export function requestRevision(order: Order, body: Record<string, unknown>): RevisionResult {
  if (!REVISION_STATUSES.includes(order.status)) {
    return { ok: false, status: 400, error: 'Revisi hanya bisa diminta saat status paid, in_progress, atau review.' };
  }

  const message = requireCap(asString(body.message), LIMITS.revision, 'Pesan revisi');
  if (!message.value) return { ok: false, status: 400, error: 'message wajib diisi.' };
  if (!message.ok) return { ok: false, status: 400, error: message.error! };

  const log = insertLog(order.id, order.status, order.status, `[REVISI] ${message.value}`);
  return { ok: true, log, detail: orderDetail(order) };
}