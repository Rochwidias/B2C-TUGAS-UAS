import { Router, type Request, type Response, type NextFunction } from 'express';
import { sendError, sendOk, bodyObject, asString } from '../lib/http';
import { clientKey, rateLimit } from '../lib/ratelimit';
import { LIMITS } from '../lib/security';
import {
  ADMIN_SESSION_COOKIE,
  adminPassword,
  issueAdminToken,
} from '../middleware/adminAuth';
import { listOrders } from '../lib/db';
import { buildAdminStats } from '../services/stats';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// POST /api/admin/login — verifikasi password, set cookie admin_session.
router.post('/api/admin/login', (req: Request, res: Response, _next: NextFunction): void => {
  // Login dibatasi ketat: 6 percobaan per 15 menit per IP menahan brute force.
  const limit = rateLimit(clientKey(req, 'admin-login'), 6, 15 * 60_000);
  if (!limit.ok) {
    sendError(res, `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
    return;
  }

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
  res.cookie(ADMIN_SESSION_COOKIE, issueAdminToken(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400,
  });
  sendOk(res, { ok: true, message: 'Login berhasil.' });
});

// GET /api/admin/orders — kanban board (gate admin).
router.get('/api/admin/orders', requireAdmin, (_req: Request, res: Response, _next: NextFunction): void => {
  // Back-office wajib login; gate di route ini juga menutup API bila cookie
  // admin_session belum di-set lewat POST /api/admin/login.
  const orders = listOrders();
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

export default router;