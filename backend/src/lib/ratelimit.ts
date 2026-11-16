// Rate limiter proses tunggal (Map di memori).
// Cukup untuk satu instance Node; kalau nanti di-scale multi-instance, ganti
// ke store bersama (Redis) tanpa mengubah pemanggil.

import type { Request } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

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

/** IP pemanggil; header proxy dipakai bila ada, karena demo bisa jalan di belakang proxy. */
export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const realIp = req.headers['x-real-ip'];
  const ip =
    firstForwarded?.split(',')[0]?.trim() ||
    (typeof realIp === 'string' ? realIp : undefined) ||
    req.ip ||
    'lokal';
  return `${scope}:${ip}`;
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