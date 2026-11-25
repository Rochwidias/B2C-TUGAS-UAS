'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/shop/ThemeToggle';

// Nama cookie sesi — harus persis 'admin_session' agar cocok dengan yang
// diterbitkan AdminLogin dan diperiksa middleware. Logout satu-satunya tempat
// cookie dihapus (middleware tidak pernah menyentuhnya).
const ADMIN_PART = 'admin';
const SESSION_PART = 'session';
const ADMIN_SESSION_COOKIE = `${ADMIN_PART}_${SESSION_PART}`;

// Navigasi hanya memuat tujuan yang benar benar ada: papan (/admin) dan
// storefront customer (/). Halaman daftar order belum ada, jadi tidak diiklankan.
const NAV_ITEMS = [
  { href: '/admin', label: 'Papan' },
  { href: '/', label: 'Situs customer' },
];

// Kerangka back-office: bilah identitas tipis + area kerja. Bahasa visualnya sama
// dengan kanvas customer (kertas, tinta, garis), tetapi lebih padat karena layar
// ini dipakai berjam-jam oleh developer.
export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-ink bg-paper">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-5 px-4 pt-2 pb-0 sm:px-6 sm:py-2.5">
          <Link
            href="/admin"
            className="group -my-1.5 flex min-h-11 min-w-0 items-center gap-2.5 py-1.5"
            aria-label="Aether Creative: kembali ke papan pesanan"
          >
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center bg-ink font-mono text-[13px] font-bold text-paper"
            >
              A
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm leading-tight font-semibold tracking-tight">
                Aether Creative
              </span>
              <span className="block font-mono text-[10px] leading-tight tracking-wide text-ink-soft uppercase">
                Back office
              </span>
            </span>
          </Link>

          <span aria-hidden="true" className="hidden h-8 w-px bg-rule sm:block" />

          {/* usePathname hanya tersedia saat runtime, dibungkus Suspense agar
              prerender halaman admin tidak gagal. Di layar sempit navigasi turun
              ke baris sendiri selebar header supaya tombol tema tidak menggantung. */}
          <div className="-mx-4 order-3 w-[calc(100%+2rem)] border-t border-rule sm:order-none sm:mx-0 sm:w-auto sm:border-t-0">
            <Suspense fallback={null}>
              <AdminNav />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <p className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wide text-ink-soft uppercase sm:flex">
              <span aria-hidden="true" className="size-[7px] bg-ok" />
              Sesi admin
            </p>
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="konten" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 font-mono text-[10px] tracking-wide text-ink-soft uppercase sm:px-6">
          <span>Aether Creative · meja kerja produksi poster</span>
          <span>Internal · data demo</span>
        </div>
      </footer>
    </div>
  );
}

// Tombol keluar: hapus cookie sesi lokal lalu kembali ke halaman login.
// Middleware hanya memeriksa keberadaan cookie, jadi menghapusnya cukup untuk
// menutup sesi — tidak ada endpoint apa pun yang perlu dihubungi.
function LogoutButton() {
  const router = useRouter();

  function logout() {
    document.cookie = `${ADMIN_SESSION_COOKIE}=; path=/; max-age=0`;
    router.push('/admin/login');
  }

  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Keluar dari back office"
      className="flex min-h-9 items-center gap-1.5 border border-rule px-2.5 font-mono text-[10px] tracking-wide text-ink-soft uppercase transition hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      Keluar
    </button>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="flex items-stretch gap-0">
      {NAV_ITEMS.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : false;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center border-b-2 px-3 text-xs font-medium tracking-wide transition first:pl-4 last:pr-4 sm:first:pl-3 sm:last:pr-3 ${
              active
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-soft hover:border-rule hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
