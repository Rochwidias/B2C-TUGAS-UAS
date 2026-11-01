"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const tabs = [
  {
    href: "/admin",
    label: "Ringkasan",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 13h6V4H4v9zm0 7h6v-4H4v4zm10 0h6v-9h-6v9zm0-16v4h6V4h-6z" />
    ),
  },
  {
    href: "/admin/products",
    label: "Produk",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h10" />
    ),
  },
  {
    href: "/admin/orders",
    label: "Pesanan",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
  },
  {
    href: "/admin/custom-orders",
    label: "Custom Order",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l2.09 4.26L19 8l-3.5 3.4.83 4.85L12 14l-4.33 2.25.83-4.85L5 8l4.91-.74L12 3z" />
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav aria-label="Navigasi admin" className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-2 shadow-sm scrollbar-hide lg:flex-col lg:overflow-visible">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 font-display text-body-sm font-medium transition-colors",
              isActive(tab.href)
                ? "bg-ink text-bg"
                : "text-ink-muted hover:bg-bg-alt hover:text-ink",
            )}
            aria-current={isActive(tab.href) ? "page" : undefined}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="mt-2 hidden rounded-xl px-4 py-2.5 font-display text-caption font-medium text-ink-soft transition-colors hover:bg-bg-alt hover:text-ink lg:flex"
      >
        ← Lihat toko
      </Link>
    </nav>
  );
}
