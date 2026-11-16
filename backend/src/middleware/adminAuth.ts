// Gate admin: token stateless yang diturunkan dari password, sehingga tidak
// perlu tabel sesi tambahan tetapi tetap bisa diverifikasi. Dipakai oleh
// middleware Express yang melindungi route tulis admin.

import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

function expectedToken(): string {
  return createHash('sha256').update(`craftai-studio:${adminPassword()}`).digest('hex');
}

export function issueAdminToken(): string {
  return expectedToken();
}

export function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(expectedToken(), 'utf8');
  const actual = Buffer.from(token, 'utf8');
  // panjang berbeda = langsung salah; timingSafeEqual akan melempar kalau beda.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Baca nilai cookie `admin_session` langsung dari header Cookie request. */
export function readAdminSessionCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== ADMIN_SESSION_COOKIE) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

export function isAdminAuthenticated(req: Request): boolean {
  return isValidAdminToken(readAdminSessionCookie(req));
}

/**
 * Gate untuk route tulis admin (PATCH/PUT delivery, GET admin/orders & stats).
 * Status + pesan 401 identik dengan route handler Next.js lama.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (isAdminAuthenticated(req)) {
    next();
    return;
  }
  res.status(401).json({ error: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.' });
}