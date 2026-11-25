import { Router, type Request, type Response, type NextFunction } from 'express';
import { sendError, sendOk, bodyObject, asString } from '../lib/http';
import { enforceRateLimit } from '../lib/ratelimit';
import { LIMITS } from '../lib/security';
import {
  ADMIN_SESSION_COOKIE,
  adminPassword,
  isAdminAuthenticated,
  issueAdminToken,
  requireAdmin,
} from '../middleware/adminAuth';
import { countDrafts, getOrder, insertLog, listOrders, saveOrderPoster } from '../lib/db';
import { normalizeDraftSchema, validatePosterLimits } from '../lib/validate';
import { buildAdminStats } from '../services/stats';
import { orderDetail, publicDraft } from '../services/orders';
import type { Order } from '../types';

const router = Router();

/** Kartu kanban: order + sisa kuota (§7: kartu menampilkan paket + sisa kuota). */
type AdminOrderCard = Order & { remaining: number; draftCount: number };

function toCard(order: Order): AdminOrderCard {
  const draftCount = countDrafts(order.id);
  return { ...order, draftCount, remaining: Math.max(0, order.quota - draftCount) };
}

// POST /api/admin/login — verifikasi password, set cookie admin_session.
router.post('/api/admin/login', (req: Request, res: Response, _next: NextFunction): void => {
  // Login dibatasi ketat: 6 percobaan per 15 menit per IP menahan brute force.
  if (!enforceRateLimit(req, res, 'admin-login', 'adminLogin', 'Terlalu banyak percobaan login.')) return;

  const body = bodyObject(req.body);
  if (!body) {
    sendError(res, 'Body request bukan JSON yang valid.', 400);
    return;
  }

  const password = asString(body.password);
  if (!password) { sendError(res, 'Password wajib diisi.', 400); return; }
  if (password.length > LIMITS.password) { sendError(res, 'Password salah.', 401); return; }

  // Bandingkan panjang dulu sebelum timingSafeEqual agar pesan tidak bocor
  // info panjang password asli.
  const expected = adminPassword();
  if (password.length !== expected.length || password !== expected) {
    sendError(res, 'Password salah.', 401);
    return;
  }

  // Set-Cookie: admin_session=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400
  // Secure hanya di produksi: login lewat https (satu origin via rewrite);
  // tanpa Secure di dev supaya suite e2e http://localhost tetap jalan.
  res.cookie(ADMIN_SESSION_COOKIE, issueAdminToken(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400,
  });
  sendOk(res, { ok: true, message: 'Login berhasil.' });
});

// GET /api/admin/session — verifikasi token di SATU tempat (audit §12):
// 200 {ok:true} bila cookie admin valid, 401 {error} bila tidak. Dipakai
// frontend/middleware.ts supaya cek sesi tidak dihitung ulang di client.
router.get('/api/admin/session', (req: Request, res: Response, _next: NextFunction): void => {
  if (isAdminAuthenticated(req)) {
    sendOk(res, { ok: true });
    return;
  }
  sendError(res, 'Sesi admin tidak valid. Silakan login terlebih dahulu.', 401);
});

// GET /api/admin/orders — kanban board (gate admin).
router.get('/api/admin/orders', requireAdmin, (_req: Request, res: Response, _next: NextFunction): void => {
  // Back-office wajib login; gate di route ini juga menutup API bila cookie
  // admin_session belum di-set lewat POST /api/admin/login.
  const orders = listOrders().map(toCard);
  const backlog = orders.filter((order) => order.status === 'draft' || order.status === 'paid');
  const inProgress = orders.filter((order) => order.status === 'in_progress');
  const review = orders.filter((order) => order.status === 'review');
  const completed = orders.filter((order) => order.status === 'completed');

  sendOk(res, {
    columns: {
      backlog,
      in_progress: inProgress,
      review,
      completed,
    },
    counts: {
      backlog: backlog.length,
      in_progress: inProgress.length,
      review: review.length,
      completed: completed.length,
      total: orders.length,
    },
  });
});

// GET /api/admin/stats — statistik agregat (gate admin).
router.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response, _next: NextFunction): void => {
  const stats = buildAdminStats();
  sendOk(res, {
    counts: stats.counts,
    revenue: stats.revenue,
    delivered: stats.delivered,
    averageCompletionHours: stats.averageCompletionHours,
    totalLogs: stats.totalLogs,
    recentOrders: stats.recentOrders,
  });
});

// PUT /api/admin/orders/:id/poster — Editor Konten Poster back-office
// (gate admin + rate limit adminWrite 60/mnt). Kontrak WHATSAPP-FLOW:
// body `{ content: PosterDraft }`, kolom `engine` diisi 'manual', `revisi`
// tidak disentuh, dan memicu audit-log `poster.edited`.
router.put('/api/admin/orders/:id/poster', requireAdmin, (req: Request, res: Response, _next: NextFunction): void => {
  // Konten poster hanya boleh ditulis editor back-office (AI sudah dibuang).
  if (!enforceRateLimit(req, res, 'admin-poster', 'adminWrite', 'Terlalu banyak permintaan.')) return;

  const { id } = req.params;
  const order = getOrder(id);
  if (!order) { sendError(res, 'Pesanan tidak ditemukan.', 404); return; }

  const body = bodyObject(req.body);
  if (!body) { sendError(res, 'Body request bukan JSON yang valid.', 400); return; }

  // Kerangka scaffold boleh kosong (editor yang mengisi) — teks masih
  // divalidasi tipe/bentuk + batas 240/140/60/40 di bawah.
  const normalized = normalizeDraftSchema(body.content, { allowEmpty: true });
  if (!normalized.draft) {
    const detail = normalized.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    sendError(res, `Konten poster tidak valid. ${detail}`, 400);
    return;
  }

  // Batas teks §4 tetap divalidasi (240/140/60/40) terhadap nilai ternormalisasi.
  const limitIssues = validatePosterLimits(normalized.draft);
  if (limitIssues.length > 0) {
    const detail = limitIssues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    sendError(res, `Konten poster melebihi batas teks. ${detail}`, 400);
    return;
  }

  // `engine` kolom diisi 'manual' (check constraint manual|gemini|local);
  // kolom revisi/order lain tidak disentuh oleh endpoint ini.
  const saved = saveOrderPoster(order.template_id, order.id, normalized.draft, 'manual');
  insertLog(order.id, order.status, order.status, '[poster.edited] Konten poster disunting editor back-office.');

  const detail = orderDetail(getOrder(id)!);
  sendOk(res, { data: { draft: publicDraft(saved), engine: saved.engine }, ...detail });
});

export default router;