import { createOrder, getDraft, getDraftByOrderId, getOrderByNumber, getTemplate, listLogs, readPackagePrices } from '@/lib/db';
import { asString, jsonError, jsonOk, readJsonBody } from '@/lib/http';

const PACKAGES = ['Basic', 'Pro', 'Premium'] as const;

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return jsonError('Body request bukan JSON yang valid.', 400);

  const draftId = asString(body.draftId);
  const templateId = asString(body.templateId);
  const packageName = asString(body.packageName);
  const contactName = asString(body.contactName);
  const contactWhatsapp = asString(body.contactWhatsapp);
  const contactEmail = asString(body.contactEmail);

  if (!draftId) return jsonError('draftId wajib diisi.', 400);
  if (!templateId) return jsonError('templateId wajib diisi.', 400);
  if (!contactName) return jsonError('Nama kontak wajib diisi.', 400);
  if (!contactWhatsapp) return jsonError('Nomor WhatsApp wajib diisi.', 400);
  if (!contactEmail || !contactEmail.includes('@')) return jsonError('Email kontak tidak valid.', 400);
  if (!(PACKAGES as readonly string[]).includes(packageName)) {
    return jsonError(`packageName harus salah satu dari: ${PACKAGES.join(', ')}.`, 400);
  }

  const draft = getDraft(draftId);
  if (!draft) return jsonError('Draft tidak ditemukan. Generate draft terlebih dahulu.', 404);

  const template = getTemplate(templateId);
  if (!template) return jsonError(`Template "${templateId}" tidak ditemukan.`, 404);

  const created = createOrder({
    draftId,
    // Draft adalah sumber kebenaran template; body dipakai untuk validasi saja.
    templateId: draft.template_id || template.id,
    packageName,
    contactName,
    contactWhatsapp,
    contactEmail,
  });

  if (!created.draft) return jsonError('Draft gagal dirujuk oleh order baru.', 500);

  return jsonOk(
    {
      order: created.order,
      orderNumber: created.order.order_number,
      draft: created.draft,
      logs: created.logs,
      packages: readPackagePrices(),
    },
    201,
  );
}

export async function GET(request: Request): Promise<Response> {
  const number = new URL(request.url).searchParams.get('number');
  if (!number || !number.trim()) return jsonError('Parameter ?number=UK-ORD-XXXX wajib diisi.', 400);

  const order = getOrderByNumber(number);
  if (!order) return jsonError(`Pesanan dengan nomor ${number.trim().toUpperCase()} tidak ditemukan.`, 404);

  return jsonOk({ order, draft: getDraftByOrderId(order.id), logs: listLogs(order.id) });
}