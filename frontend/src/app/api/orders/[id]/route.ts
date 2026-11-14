import { getDraftByOrderId, getOrder, listLogs, updateOrder } from '@/lib/db';
import { asString, jsonError, jsonOk, readJsonBody } from '@/lib/http';
import type { OrderStatus } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) return jsonError('Pesanan tidak ditemukan.', 404);
  return jsonOk({ order, draft: getDraftByOrderId(order.id), logs: listLogs(order.id) });
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const order = getOrder(id);
  if (!order) return jsonError('Pesanan tidak ditemukan.', 404);

  const body = await readJsonBody(request);
  if (!body) return jsonError('Body request bukan JSON yang valid.', 400);

  const hasStatus = body.status !== undefined;
  const hasDevNote = body.devNote !== undefined;
  if (!hasStatus && !hasDevNote) return jsonError('Body harus memuat status dan/atau devNote.', 400);

  const patch: { status?: OrderStatus; devNote?: string } = {};
  if (hasStatus) {
    const status = asString(body.status) as OrderStatus;
    if (!STATUSES.includes(status)) {
      return jsonError(`status harus salah satu dari: ${STATUSES.join(', ')}.`, 400);
    }
    patch.status = status;
  }
  if (hasDevNote) {
    if (typeof body.devNote !== 'string') return jsonError('devNote harus berupa teks.', 400);
    patch.devNote = body.devNote;
  }

  const updated = updateOrder(id, patch);
  if (!updated) return jsonError('Pesanan gagal diperbarui.', 500);
  return jsonOk({ order: updated, logs: listLogs(id) });
}