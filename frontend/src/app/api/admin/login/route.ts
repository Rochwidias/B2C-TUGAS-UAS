import { jsonError, jsonOk, readJsonBody, asString } from '@/lib/http';
import { ADMIN_SESSION_COOKIE, adminPassword, issueAdminToken } from '@/lib/session';

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return jsonError('Body request bukan JSON yang valid.', 400);

  const password = asString(body.password);
  if (!password) return jsonError('Password wajib diisi.', 400);

  // Bandingkan panjang dulu sebelum timingSafeEqual agar pesan tidak bocor
  // info panjang password asli.
  const expected = adminPassword();
  if (password.length !== expected.length || password !== expected) {
    return jsonError('Password salah.', 401);
  }

  const response = jsonOk({ ok: true, message: 'Login berhasil.' });
  response.headers.set(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${issueAdminToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );
  return response;
}