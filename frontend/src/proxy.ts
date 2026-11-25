import { NextResponse, type NextRequest } from 'next/server';

// Gate back-office versi frontend-only (docs/FRONTEND-ONLY.md §4): aplikasi
// tidak punya backend, jadi proxy hanya memeriksa KEBERADAAN cookie sesi,
// bukan keabsahannya. Cookie diterbitkan AdminLogin lewat `document.cookie`
// setelah password dicocokkan dengan NEXT_PUBLIC_ADMIN_PASSWORD, dan hanya
// dihapus oleh tombol logout di AdminShell — proxy tidak pernah
// menghapus/mengubah cookie. Gate ini tingkat demo: password ikut bundle
// client, jadi jangan anggap ini pengaman produksi.
//
// Catatan Next.js 16: konvensi `middleware.ts` deprecated dan diganti
// `proxy.ts` (node_modules/next/dist/docs/01-app/.../file-conventions/proxy.md).
// Karena App Router ada di `src/app`, file ini WAJIB berada di `src/` —
// di root proyek ia tidak pernah dimuat (gate /admin membalas 200 tanpa cookie).

// Nama cookie dibangun dari dua bagian supaya tidak tertukar dengan placeholder
// saat file ditulis ulang oleh alat — nama ini adalah kunci seluruh gerbang admin.
const ADMIN_PART = 'admin';
const SESSION_PART = 'session';
const ADMIN_SESSION_COOKIE = `${ADMIN_PART}_${SESSION_PART}`;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Halaman login selalu bisa dibuka — tanpa pengecualian ini, kunjungan tanpa
  // cookie ke /admin/login akan diarahkan ke dirinya sendiri tanpa akhir.
  if (pathname === '/admin/login') return NextResponse.next();

  // Cookie ada → dianggap masuk. Tidak ada verifikasi ke mana pun.
  if (request.cookies.has(ADMIN_SESSION_COOKIE)) return NextResponse.next();

  // Tanpa cookie → ke login, membawa path asal supaya AdminLogin bisa
  // mengembalikan admin ke halaman yang sama setelah masuk.
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
