// Service order: semua logika bisnis checkout dipusatkan di sini supaya
// route handler tinggal memetakan Result ke response (wrapper tipis).

import {
  createOrder,
  getDraft,
  getDraftByOrderId,
  getOrderByNumber,
  getTemplate,
  listLogs,
  readPackagePrices,
} from '../lib/db';
import type { AIDraft, Order, OrderLog } from '../types';
import { LIMITS, isValidEmail, isValidWhatsapp, normalizeWhatsapp, requireCap } from '../lib/security';
import { asString } from '../lib/http';

export const PACKAGES = ['Basic', 'Pro', 'Premium'] as const;

export type CreateOrderResult =
  | { ok: true; order: Order; draft: AIDraft | null; logs: OrderLog[] }
  | { ok: false; status: number; error: string };

/** Validasi + buat order (mock paid). Tidak menyentuh Request/Response. */
export function createOrderFromBody(body: Record<string, unknown>): CreateOrderResult {
  const draftId = asString(body.draftId);
  const templateId = asString(body.templateId);
  const packageName = asString(body.packageName);

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
  if (!(PACKAGES as readonly string[]).includes(packageName)) {
    return { ok: false, status: 400, error: `packageName harus salah satu dari: ${PACKAGES.join(', ')}.` };
  }

  const draft = getDraft(draftId);
  if (!draft) return { ok: false, status: 404, error: 'Draft tidak ditemukan. Generate draft terlebih dahulu.' };

  const template = getTemplate(templateId);
  if (!template) return { ok: false, status: 404, error: `Template "${templateId}" tidak ditemukan.` };

  const created = createOrder({
    draftId,
    // Draft adalah sumber kebenaran template; body dipakai untuk validasi saja.
    templateId: draft.template_id || template.id,
    packageName,
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

export function listPackagePrices(): Record<string, number> {
  return readPackagePrices();
}
