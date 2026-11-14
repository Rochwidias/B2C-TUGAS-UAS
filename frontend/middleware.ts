import { NextResponse, type NextRequest } from 'next/server';

// Cookie admin_session di-set oleh POST /api/admin/login (milik Agent-BACKEND).
// Middleware hanya memverifikasi keberadaan nilai — validasi sesi sebenarnya
// tetap dipegang API agar tugas ini tidak bergantung pada implementasi backend.
const ADMIN_SESSION_COOKIE = 'admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (pathname === '/admin/login') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};