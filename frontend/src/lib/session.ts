// Gate admin sederhana: token stateless yang diturunkan dari password,
// sehingga tidak perlu tabel sesi tambahan tetapi tetap bisa diverifikasi.

import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

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

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidAdminToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}