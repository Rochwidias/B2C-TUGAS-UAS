import { Router, type Request, type Response, type NextFunction } from 'express';
import { getOrder, updateDelivery } from '../lib/db';
import { asString, bodyObject, sendError, sendOk } from '../lib/http';
import { clientKey, rateLimit } from '../lib/ratelimit';
import { LIMITS, requireCap } from '../lib/security';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// PUT /api/orders/:id/delivery — simpan hasil delivery (gate admin + rate limit 60/mnt).
router.put('/api/orders/:id/delivery', requireAdmin, (req: Request, res: Response, _next: NextFunction): void => {
  // Delivery menentukan apa yang diterima customer; hanya admin boleh menulis.
  const limit = rateLimit(clientKey(req, 'admin-delivery'), 60, 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak permintaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

  const { id } = req.params;
  const order = getOrder(id);
  if (!order) { sendError(res, 'Pesanan tidak ditemukan.', 404); return; }

  const body = bodyObject(req.body);
  if (!body) { sendError(res, 'Body request bukan JSON yang valid.', 400); return; }

  const liveWebsiteUrl = asString(body.liveWebsiteUrl);
  const downloadZipUrl = asString(body.downloadZipUrl);

  if (!liveWebsiteUrl) { sendError(res, 'liveWebsiteUrl wajib diisi.', 400); return; }
  if (liveWebsiteUrl.length > LIMITS.url) {
    sendError(res, `liveWebsiteUrl maksimal ${LIMITS.url} karakter.`, 400);
    return;
  }
  if (!isValidUrl(liveWebsiteUrl)) {
    sendError(res, 'liveWebsiteUrl harus berupa URL http/https yang valid.', 400);
    return;
  }
  if (!downloadZipUrl) { sendError(res, 'downloadZipUrl wajib diisi.', 400); return; }
  if (downloadZipUrl.length > LIMITS.url) {
    sendError(res, `downloadZipUrl maksimal ${LIMITS.url} karakter.`, 400);
    return;
  }
  if (!isValidUrl(downloadZipUrl)) {
    sendError(res, 'downloadZipUrl harus berupa URL http/https yang valid.', 400);
    return;
  }

  const note = requireCap(asString(body.devNote), LIMITS.devNote, 'Catatan delivery');
  if (!note.value) { sendError(res, 'devNote wajib diisi.', 400); return; }
  if (!note.ok) { sendError(res, note.error!, 400); return; }

  const updated = updateDelivery(id, {
    liveWebsiteUrl,
    downloadZipUrl,
    devNote: note.value,
  });
  if (!updated) { sendError(res, 'Delivery gagal disimpan.', 500); return; }
  sendOk(res, { order: updated });
});

export default router;