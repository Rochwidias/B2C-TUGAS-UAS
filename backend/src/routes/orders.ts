import { Router, type Request, type Response, type NextFunction } from 'express';
import { getOrder, updateOrder } from '../lib/db';
import { asString, bodyObject, sendError, sendOk } from '../lib/http';
import { enforceRateLimit } from '../lib/ratelimit';
import {
  addBriefToOrder,
  createOrderFromBody,
  lookupOrderByNumber,
  orderDetail,
  requestRevision,
} from '../services/orders';
import { LIMITS, requireCap } from '../lib/security';
import type { Order, OrderStatus } from '../types';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

const STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

/**
 * Resolusi order untuk endpoint tulis pelanggan: divalidasi dengan NOMOR ORDER
 * (pola tracking sama dengan GET /api/orders?number= — §5), dan segmen `[id]`
 * di URL bila diisi harus menunjuk order yang sama.
 */
function resolveCustomerOrder(req: Request, body: Record<string, unknown>, res: Response): Order | null {
  const orderNumber = asString(body.orderNumber);
  if (!orderNumber) {
    sendError(res, 'orderNumber wajib diisi.', 400);
    return null;
  }

  const result = lookupOrderByNumber(orderNumber);
  if (!result.ok) {
    sendError(res, result.error, result.status);
    return null;
  }

  const segment = asString(req.params.id);
  const order = result.order;
  if (segment && segment !== order.id && segment.toUpperCase() !== order.order_number.toUpperCase()) {
    sendError(res, 'Pesanan tidak ditemukan.', 404);
    return null;
  }
  return order;
}

// POST /api/orders — pesanan baru TANPA draftId/draft AI (kontrak WHATSAPP-FLOW §3).
router.post('/api/orders', (req: Request, res: Response, _next: NextFunction): void => {
  // Bucket customerWrite (10/menit) — bucket 'drafts' sudah dibuang bersama AI.
  if (!enforceRateLimit(req, res, 'orders', 'customerWrite', 'Terlalu banyak percobaan order.')) return;

  const body = bodyObject(req.body);
  if (!body) {
    sendError(res, 'Body request bukan JSON yang valid.', 400);
    return;
  }

  const result = createOrderFromBody(body);
  if (!result.ok) {
    sendError(res, result.error, result.status);
    return;
  }

  // Kontrak WHATSAPP-FLOW: respons `{ data: { order, whatsappUrl } }`.
  // Order status 'draft', ai_draft_id NULL; whatsappUrl sudah terisi pesan
  // konfirmasi (nomor order, nama paket, ETA, brief).
  sendOk(res, { data: { order: result.order, whatsappUrl: result.whatsappUrl }, logs: result.logs }, 201);
});

// GET /api/orders?number=... — lacak order publik (rate limit: 20 per menit).
router.get('/api/orders', (req: Request, res: Response, _next: NextFunction): void => {
  // Pencarian publik dibatasi agar nomor order tidak bisa dienumerasi massal.
  if (!enforceRateLimit(req, res, 'orders-lookup', 'lookup', 'Terlalu banyak pencarian.')) return;

  const number = typeof req.query.number === 'string' ? req.query.number : '';
  if (!number.trim()) {
    sendError(res, 'Parameter ?number=UK-ORD-XXXX wajib diisi.', 400);
    return;
  }

  const result = lookupOrderByNumber(number);
  if (!result.ok) {
    sendError(res, result.error, result.status);
    return;
  }

  // Bentuk standar §5: {order, draft, drafts, logs, remaining}.
  sendOk(res, orderDetail(result.order));
});

// GET /api/orders/:id — detail order (publik) dengan semua draft + sisa kuota.
router.get('/api/orders/:id', (req: Request, res: Response, _next: NextFunction): void => {
  const order = getOrder(req.params.id);
  if (!order) { sendError(res, 'Pesanan tidak ditemukan.', 404); return; }
  sendOk(res, orderDetail(order));
});

// POST /api/orders/:id/briefs — tambah brief poster dalam kuota paket
// (bucket pelanggan 10/menit per IP — §5 & §12).
router.post('/api/orders/:id/briefs', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  if (!enforceRateLimit(req, res, 'customer-write', 'customerWrite', 'Terlalu banyak permintaan.')) return;

  const body = bodyObject(req.body);
  if (!body) { sendError(res, 'Body request bukan JSON yang valid.', 400); return; }

  const order = resolveCustomerOrder(req, body, res);
  if (!order) return;

  // Bentuk body §5: {orderNumber, brief}; field brief bisa juga datar di root.
  const briefPayload = bodyObject(body.brief) ?? body;
  const result = await addBriefToOrder(order, briefPayload);
  if (!result.ok) { sendError(res, result.error, result.status); return; }

  sendOk(res, {
    draftId: result.draft.id,
    content: result.content,
    ...result.detail,
  }, 201);
});

// POST /api/orders/:id/revision — minta revisi (bucket pelanggan yang sama).
router.post('/api/orders/:id/revision', (req: Request, res: Response, _next: NextFunction): void => {
  if (!enforceRateLimit(req, res, 'customer-write', 'customerWrite', 'Terlalu banyak permintaan.')) return;

  const body = bodyObject(req.body);
  if (!body) { sendError(res, 'Body request bukan JSON yang valid.', 400); return; }

  const order = resolveCustomerOrder(req, body, res);
  if (!order) return;

  const result = requestRevision(order, body);
  if (!result.ok) { sendError(res, result.error, result.status); return; }

  sendOk(res, { ok: true, log: result.log, ...result.detail });
});

// PATCH /api/orders/:id — ubah status/devNote (gate admin + rate limit 60/mnt).
router.patch('/api/orders/:id', requireAdmin, (req: Request, res: Response, _next: NextFunction): void => {
  // Tanpa gate ini siapa pun yang tahu UUID order bisa mengubah status produksi.
  if (!enforceRateLimit(req, res, 'admin-patch', 'adminWrite', 'Terlalu banyak permintaan.')) return;

  const { id } = req.params;
  const order = getOrder(id);
  if (!order) { sendError(res, 'Pesanan tidak ditemukan.', 404); return; }
  const body = bodyObject(req.body);
  if (!body) { sendError(res, 'Body request bukan JSON yang valid.', 400); return; }
  const hasStatus = body.status !== undefined;
  const hasDevNote = body.devNote !== undefined;
  if (!hasStatus && !hasDevNote) {
    sendError(res, 'Body harus memuat status dan/atau devNote.', 400);
    return;
  }

  const patch: { status?: OrderStatus; devNote?: string } = {};
  if (hasStatus) {
    const status = asString(body.status) as OrderStatus;
    if (!STATUSES.includes(status)) {
      sendError(res, `status harus salah satu dari: ${STATUSES.join(', ')}.`, 400);
      return;
    }
    patch.status = status;
  }
  if (hasDevNote) {
    if (typeof body.devNote !== 'string') { sendError(res, 'devNote harus berupa teks.', 400); return; }
    const note = requireCap(body.devNote, LIMITS.devNote, 'Catatan developer');
    if (!note.ok) { sendError(res, note.error!, 400); return; }
    patch.devNote = note.value;
  }

  const updated = updateOrder(id, patch);
  if (!updated) { sendError(res, 'Pesanan gagal diperbarui.', 500); return; }
  sendOk(res, { order: updated, logs: orderDetail(updated).logs });
});

export default router;