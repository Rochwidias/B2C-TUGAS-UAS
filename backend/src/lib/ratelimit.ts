// Rate limiter proses tunggal (Map di memori).
// Cukup untuk satu instance Node; kalau nanti di-scale multi-instance, ganti
// ke store bersama (Redis) tanpa mengubah pemanggil.

import type { Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/** Batas & jendela tiap bucket — didefinisikan di SATU tempat (SPEC §Keamanan). */
export const RATE_BUCKETS = {
  /** Login admin: 6 percobaan / 15 menit. */
  adminLogin: { limit: 6, windowMs: 15 * 60_000 },
  /** Generate draft AI: 8 / 5 menit. */
  drafts: { limit: 8, windowMs: 5 * 60_000 },
  /** Checkout: 5 / 10 menit. */
  checkout: { limit: 5, windowMs: 10 * 60_000 },
  /** Lacak order (publik): 20 / menit. */
  lookup: { limit: 20, windowMs: 60_000 },
  /** Tulis admin (PATCH status / PUT delivery): 60 / menit. */
  adminWrite: { limit: 60, windowMs: 60_000 },
  /** Tulis pelanggan (brief tambahan & revisi): 10 / menit. */
  customerWrite: { limit: 10, windowMs: 60_000 },
} as const;

export type RateBucketName = keyof typeof RATE_BUCKETS;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Jendela geser sederhana per kunci (IP + rute).
 * `limit` = jumlah permintaan yang diizinkan dalam `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Kunci per IP memakai `req.ip` SAJA (audit §12): header `X-Forwarded-For` /
 * `X-Real-IP` dikendalikan klien, jadi membacanya membuat limit bisa dibypass.
 * Express sudah menghitung `req.ip` sesuai `trust proxy` yang diset server.
 */
export function clientKey(req: Request, scope: string): string {
  return `${scope}:${req.ip ?? 'lokal'}`;
}

/**
 * Terapkan satu bucket: bila melewati batas, kirim 429 berisi
 * `retryAfterSeconds` (JSON) + header `Retry-After` lalu return `false`.
 */
export function enforceRateLimit(
  req: Request,
  res: Response,
  scope: string,
  bucketName: RateBucketName,
  message: string,
): boolean {
  const bucket = RATE_BUCKETS[bucketName];
  const limit = rateLimit(clientKey(req, scope), bucket.limit, bucket.windowMs);
  if (limit.ok) return true;

  res.setHeader('Retry-After', String(limit.retryAfterSeconds));
  res.status(429).json({
    error: `${message} Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    retryAfterSeconds: limit.retryAfterSeconds,
  });
  return false;
}

/** Buang bucket kedaluwarsa supaya Map tidak tumbuh tanpa batas pada proses panjang. */
export function pruneRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Panggilan berkala; interval longgar karena ini hanya kebersihan memori.
const pruneTimer = setInterval(pruneRateLimits, 10 * 60 * 1000);
pruneTimer.unref?.();