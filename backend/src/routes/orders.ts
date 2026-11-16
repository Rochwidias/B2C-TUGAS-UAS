import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDraftByOrderId, getOrder, listLogs, updateOrder } from '../lib/db';
import { sendError, sendOk, bodyObject, asString } from '../lib/http';
import { clientKey, rateLimit } from '../lib/ratelimit';
import { createOrderFromBody, listPackagePrices, lookupOrderByNumber } from '../services/orders';
import { LIMITS, requireCap } from '../lib/security';
import type { OrderStatus } from '../types';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

const STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

// POST /api/orders — checkout publik (rate limit: 5 per 10 menit per IP).
router.post('/api/orders', (req: Request, res: Response, _next: NextFunction): void => {
  // Checkout publik: 5 percobaan per 10 menit per IP menahan spam order.
  const limit = rateLimit(clientKey(req, 'orders'), 5, 10 * 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak percobaan order. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

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

  sendOk(
    res,
    {
      order: result.order,
      orderNumber: result.order.order_number,
      draft: result.draft,
      logs: result.logs,
      packages: listPackagePrices(),
    },
    201,
  );
});

// GET /api/orders?number=... — lacak order publik (rate limit: 20 per menit).
router.get('/api/orders', (req: Request, res: Response, _next: NextFunction): void => {
  // Pencarian publik dibatasi agar nomor order tidak bisa dienumerasi massal.
  const limit = rateLimit(clientKey(req, 'orders-lookup'), 20, 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak pencarian. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

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

  sendOk(res, { order: result.order, draft: result.draft, logs: result.logs });
});

// GET /api/orders/:id — detail order (publik).
router.get('/api/orders/:id', (req: Request, res: Response, _next: NextFunction): void => {
  const { id } = req.params;
  const order = getOrder(id);
  if (!order) { sendError(res, 'Pesanan tidak ditemukan.', 404); return; }
  sendOk(res, { order, draft: getDraftByOrderId(order.id), logs: listLogs(order.id) });
});

// PATCH /api/orders/:id — ubah status/devNote (gate admin + rate limit 60/mnt).
router.patch('/api/orders/:id', requireAdmin, (req: Request, res: Response, _next: NextFunction): void => {
  // Tanpa gate ini siapa pun yang tahu UUID order bisa mengubah status produksi.
  const limit = rateLimit(clientKey(req, 'admin-patch'), 60, 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak permintaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

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
  sendOk(res, { order: updated, logs: listLogs(id) });
});

export default router;