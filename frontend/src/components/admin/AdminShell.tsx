'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Papan Kanban' },
  { href: '/admin/orders', label: 'Daftar Order' },
];

// Kerangka back-office: topbar sticky + area konten. Dipakai halaman /admin dan
// /admin/orders/[id] supaya navigasi dan identitas brand konsisten.
export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-indigo-500 text-base text-white shadow-lg shadow-indigo-500/30"
            >
              ✦
            </span>
            CraftAI Studio
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-slate-700">
              Back Office
            </span>
          </Link>

          {/* usePathname hanya tersedia saat runtime — dibungkus Suspense agar
              prerender halaman admin tidak gagal. */}
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>

          <p className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span aria-hidden="true" className="size-2 rounded-full bg-emerald-400" />
            Sesi admin aktif
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              active
                ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}