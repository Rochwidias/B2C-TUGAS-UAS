// Server HTTP backend CraftAI Studio — Express + node:sqlite, port 4000.
// Semua endpoint /api/* dipindahkan dari route handler Next.js lama tanpa
// mengubah bentuk respons (status + pesan error identik, dipakai test_api.py
// & test_security.py).

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import templatesRouter from './routes/templates';
import draftsRouter from './routes/drafts';
import ordersRouter from './routes/orders';
import deliveryRouter from './routes/delivery';
import adminRouter from './routes/admin';
import exportRouter from './routes/export';
import { getDb } from './lib/db';

const PORT = Number(process.env.PORT ?? 4000);

// Origin yang diizinkan CORS: localhost/127.0.0.1 pada port berapa pun (dev
// Next.js bisa memakai port arbitrer, mis. 3710/3711 saat verify.sh) plus
// FRONTEND_ORIGIN bila diset. regex dipakai supaya suite tidak perlu mendaftar
// ulang setiap port baru; hanya http (bukan https/web) dan hanya loopback.
const LOOPBACK_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const extraOrigins = (process.env.FRONTEND_ORIGIN ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const app = express();

// X-Powered-By disembunyikan (test_security.py memeriksanya).
app.disable('x-powered-by');

// Body JSON: limit wajar supaya payload raksasa tidak pernah sampai ke DB.
app.use(express.json({ limit: '1mb' }));

app.use(cookieParser());

app.use(
  cors({
    origin(origin, callback) {
      // Tanpa header Origin (curl / server-to-server) selalu diizinkan.
      if (
        !origin ||
        LOOPBACK_ORIGIN.test(origin) ||
        extraOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Security headers untuk semua respons API.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  next();
});

// Pastikan DB (auto-create + seed) siap sebelum request pertama masuk.
getDb();

app.use(templatesRouter);
app.use(draftsRouter);
app.use(ordersRouter);
app.use(deliveryRouter);
app.use(adminRouter);
app.use(exportRouter);

// 404 untuk path API yang tidak dikenal — bentuk {error} + 404, sama seperti
// Next.js sebelumnya.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// Penanganan body JSON rusak -> 400 {error} (persis seperti readJsonBody lama).
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  const status = (err as { status?: number; statusCode?: number } | null)?.status ??
    (err as { statusCode?: number } | null)?.statusCode;
  const type = (err as { type?: string } | null)?.type;
  if (status === 400 || type === 'entity.parse.failed' || type === 'entity.too.large') {
    res.status(400).json({ error: 'Body request bukan JSON yang valid.' });
    return;
  }
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error('[backend] error tak terduga:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`[backend] CraftAI Studio API berjalan di http://localhost:${PORT}`);
});