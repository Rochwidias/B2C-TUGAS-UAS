import { NextResponse, type NextRequest } from 'next/server';

// Middleware memverifikasi token sesi, bukan sekadar keberadaan cookie: tanpa
// ini, cookie "admin_session=apa-saja" sudah cukup untuk membuka /admin.
// Web Crypto dipakai (bukan node:crypto) supaya middleware tetap ringan dan
// bisa jalan di runtime edge maupun node.

const ADMIN_SESSION_COOKIE = 'admin_session';

async function expectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`craftai-studio:${password}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Perbandingan waktu-konstan supaya cookie palsu tidak bisa ditebak via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = cookie ? safeEqual(cookie, await expectedToken()) : false;

  if (pathname === '/admin/login') {
    if (valid) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (!valid) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Cookie invalid dibuang supaya tidak terus dikirim pada setiap request.
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};