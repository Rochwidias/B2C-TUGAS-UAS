import { NextResponse, type NextRequest } from 'next/server';

// Verifikasi sesi admin berada di satu tempat: backend. Middleware sengaja TIDAK
// lagi menghitung token dari `process.env.ADMIN_PASSWORD` — di Vercel variabel itu
// tidak diisi (password hanya ada di Render), sehingga hasil hitungan lokal selalu
// beda dengan cookie yang diterbitkan backend dan /admin berputar di halaman login
// (docs/REDESIGN.md §12). Yang dicek cukup `GET /api/admin/session`.

// Nama cookie dibangun dari dua bagian supaya tidak tertukar dengan placeholder
// saat file ditulis ulang oleh alat — nama ini adalah kunci seluruh gerbang admin.
const ADMIN_SESSION = 'admin';
const SESSION_KEY = 'session';
const ADMIN_SESSION_COOKIE = `${ADMIN_SESSION}_${SESSION_KEY}`;

// Sama dengan default di next.config.ts (rewrite /api/* -> BACKEND_ORIGIN).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://localhost:4000';

// Batas tunggu verifikasi: backend yang menggantung tidak boleh membuat tiap
// request admin ikut menggantung.
const VERIFY_TIMEOUT_MS = 4000;

type Verdict =
  /** Backend menandai cookie sah. */
  | 'valid'
  /** Backend menolak cookie (401/403) — cookie wajib dibuang. */
  | 'invalid'
  /** Backend tidak bisa ditanya (mati / endpoint belum ada) — cookie dipertahankan. */
  | 'unknown';

/**
 * Teruskan cookie admin ke backend: unduhan fetch dari middleware tidak membawa
 * cookie permintaan secara otomatis, jadi dikirim manual lewat header.
 */
async function verifySession(cookie: string): Promise<Verdict> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/api/admin/session`, {
      method: 'GET',
      cache: 'no-store',
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${cookie}` },
      signal: controller.signal,
    });
    if (response.ok) return 'valid';
    return response.status === 401 || response.status === 403 ? 'invalid' : 'unknown';
  } catch {
    // Jangan memusnahkan sesi yang mungkin sah hanya karena satu gangguan jaringan.
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}

/** Tujuan selalu /admin/login; cookie hanya dibuang bila backend menyatakan invalid. */
function toLogin(request: NextRequest, from: string, dropCookie: boolean): NextResponse {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', from);
  const response = NextResponse.redirect(loginUrl);
  if (dropCookie) response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  // Halaman login selalu diizinkan, baik belum maupun sudah punya cookie.
  if (pathname === '/admin/login') {
    if (cookie) {
      const verdict = await verifySession(cookie);
      if (verdict === 'valid') return NextResponse.redirect(new URL('/admin', request.url));
      if (verdict === 'invalid') {
        const response = NextResponse.next();
        response.cookies.delete(ADMIN_SESSION_COOKIE);
        return response;
      }
    }
    return NextResponse.next();
  }

  // Tanpa cookie: langsung ke login, tanpa menyentuh cookie apa pun.
  if (!cookie) return toLogin(request, pathname, false);

  const verdict = await verifySession(cookie);
  if (verdict === 'valid') return NextResponse.next();
  return toLogin(request, pathname, verdict === 'invalid');
}

export const config = {
  matcher: ['/admin/:path*'],
};