// Service order: semua logika bisnis checkout, tracking, brief tambahan, dan
// revisi dipusatkan di sini supaya route handler tinggal memetakan Result ke
// response (wrapper tipis).

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
import { generateDraft, THEME_KEYS } from '../lib/ai';
import { findPackage, PACKAGE_KEYS } from '../lib/packages';
import type { AIDraft, Draft, DraftBrief, GenerateDraftResult, Order, OrderLog, ThemeColorKey } from '../types';
import { LIMITS, isValidEmail, isValidWhatsapp, normalizeWhatsapp, requireCap } from '../lib/security';
import { asString } from '../lib/http';

export type CreateOrderResult =
  | { ok: true; order: Order; draft: AIDraft | null; logs: OrderLog[] }
  | { ok: false; status: number; error: string };

/** Validasi + buat order (mock paid). Tidak menyentuh Request/Response. */
export function createOrderFromBody(body: Record<string, unknown>): CreateOrderResult {
  const draftId = asString(body.draftId);
  const templateId = asString(body.templateId);
  const packageKey = asString(body.packageKey);

  const contactName = requireCap(asString(body.contactName), LIMITS.contactName, 'Nama kontak');
  if (!contactName.value) return { ok: false, status: 400, error: 'Nama kontak wajib diisi.' };
  if (!contactName.ok) return { ok: false, status: 400, error: contactName.error! };

  const contactWhatsapp = requireCap(asString(body.contactWhatsapp), LIMITS.whatsapp, 'Nomor WhatsApp');
  if (!contactWhatsapp.value) return { ok: false, status: 400, error: 'Nomor WhatsApp wajib diisi.' };
  if (!isValidWhatsapp(contactWhatsapp.value)) {
    return { ok: false, status: 400, error: 'Nomor WhatsApp tidak valid. Contoh: 081234567890.' };
  }

  const contactEmail = requireCap(asString(body.contactEmail), LIMITS.email, 'Email');
  if (!contactEmail.value) return { ok: false, status: 400, error: 'Email kontak wajib diisi.' };
  if (!isValidEmail(contactEmail.value)) {
    return { ok: false, status: 400, error: 'Email kontak tidak valid. Contoh: nama@domain.com.' };
  }

  if (!draftId) return { ok: false, status: 400, error: 'draftId wajib diisi.' };
  if (!templateId) return { ok: false, status: 400, error: 'templateId wajib diisi.' };
  if (!packageKey) return { ok: false, status: 400, error: 'packageKey wajib diisi.' };

  // Harga & kuota hanya boleh datang dari GET /api/packages (§2).
  const pkg = findPackage(packageKey);
  if (!pkg) {
    return { ok: false, status: 400, error: `packageKey harus salah satu dari: ${PACKAGE_KEYS.join(', ')}.` };
  }

  const draft = getDraft(draftId);
  if (!draft) return { ok: false, status: 404, error: 'Draft tidak ditemukan. Generate draft terlebih dahulu.' };
  if (draft.order_id) {
    // Audit §12: checkout kedua tidak boleh mencabut draft dari order pertama.
    return { ok: false, status: 400, error: 'Draft sudah dipakai order lain. Buat draft baru sebelum checkout.' };
  }

  const template = getTemplate(templateId);
  if (!template) return { ok: false, status: 404, error: `Template "${templateId}" tidak ditemukan.` };

  const created = createOrder({
    draftId,
    // Draft adalah sumber kebenaran template; body dipakai untuk validasi saja.
    templateId: draft.template_id || template.id,
    packageKey: pkg.key,
    contactName: contactName.value,
    contactWhatsapp: normalizeWhatsapp(contactWhatsapp.value),
    contactEmail: contactEmail.value,
  });

  if (!created.draft) return { ok: false, status: 500, error: 'Draft gagal dirujuk oleh order baru.' };

  return { ok: true, order: created.order, draft: created.draft, logs: created.logs };
}

export type LookupOrderResult =
  | { ok: true; order: Order; draft: AIDraft | null; logs: OrderLog[] }
  | { ok: false; status: number; error: string };

/** Cari order publik berdasarkan nomor. Tidak menyentuh Request/Response. */
export function lookupOrderByNumber(rawNumber: string): LookupOrderResult {
  const number = rawNumber.trim();
  if (!number) return { ok: false, status: 400, error: 'Parameter ?number=UK-ORD-XXXX wajib diisi.' };
  if (number.length > 20) return { ok: false, status: 400, error: 'Format nomor order tidak valid.' };

  const order = getOrderByNumber(number);
  if (!order) return { ok: false, status: 404, error: `Pesanan dengan nomor ${number.toUpperCase()} tidak ditemukan.` };

  return { ok: true, order, draft: getDraftByOrderId(order.id), logs: listLogs(order.id) };
}

export interface OrderDetail {
  order: Order;
  draft: AIDraft | null;
  drafts: AIDraft[];
  logs: OrderLog[];
  remaining: number;
}

/**
 * Bentuk response standar detail order (§5): semua draft milik order (penting
 * untuk kuota Paket Hemat) + `remaining`, jadi UI tidak perlu endpoint lain.
 */
export function orderDetail(order: Order): OrderDetail {
  const drafts = listDraftsByOrderId(order.id);
  return {
    order,
    draft: drafts.length > 0 ? drafts[drafts.length - 1] : getDraftByOrderId(order.id),
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
  | { ok: true; draft: AIDraft; content: Draft; engine: GenerateDraftResult['engine']; detail: OrderDetail }
  | { ok: false; status: number; error: string };

/**
 * Tambah brief dalam kuota (§5): 400 bila `remaining <= 0` dengan pesan jelas,
 * membuat `ai_drafts` terhubung ke order + log `[BRIEF TAMBAHAN]`.
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
  let generated: GenerateDraftResult;
  try {
    generated = await generateDraft(brief);
  } catch (error) {
    console.error('[api/briefs] generator gagal:', error);
    return { ok: false, status: 500, error: 'Generator draft gagal dijalankan. Coba lagi sebentar lagi.' };
  }

  const created = insertDraft(template.id, brief, generated.content);
  if (!attachDraftToOrder(created.id, order.id)) {
    return { ok: false, status: 500, error: 'Draft gagal dirujuk oleh order.' };
  }
  touchOrder(order.id);
  insertLog(order.id, order.status, order.status, `[BRIEF TAMBAHAN] ${briefSummary(brief)}`);

  return {
    ok: true,
    draft: getDraft(created.id)!,
    content: generated.content,
    engine: generated.engine,
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