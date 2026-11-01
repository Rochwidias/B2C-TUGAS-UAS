"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { logoutAction } from "@/actions/auth";
import { CartBadge } from "@/components/cart-badge";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/products", label: "Katalog" },
  { href: "/custom-order", label: "Custom Order" },
];

type HeaderUser = { name: string; role: "USER" | "ADMIN" } | null;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-bg-alt bg-bg/90 backdrop-blur-xl transition-all duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-2"
          aria-label="PosterAI - Beranda"
        >
          <span className="font-display text-heading-lg font-extrabold tracking-tight text-ink">
            PosterAI
          </span>
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-accent"
            aria-hidden="true"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 font-display text-body-sm font-medium transition-colors",
                isActive(pathname, link.href)
                  ? "bg-bg-alt text-ink"
                  : "text-ink-muted hover:bg-bg-alt hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartBadge />

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="rounded-full px-4 py-2 font-display text-body-sm font-medium text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink"
                  >
                    Admin
                  </Link>
                ) : null}
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-display text-body-sm font-medium text-ink transition-all hover:border-accent/40 hover:text-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate">{firstName}</span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full px-3 py-2 font-display text-caption font-medium text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink"
                  >
                    Keluar
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 font-display text-body-sm font-medium text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-cyan px-5 py-2 font-display text-body-sm font-semibold text-bg transition-all hover:-translate-y-0.5"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="animate-slide-down border-t border-line bg-bg md:hidden"
          role="navigation"
          aria-label="Menu mobile"
        >
          <nav className="container-page space-y-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-3 font-display text-body font-medium transition-colors",
                  isActive(pathname, link.href)
                    ? "bg-bg-alt text-ink"
                    : "text-ink-muted hover:bg-bg-alt hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="space-y-2 border-t border-line pt-4">
              {user ? (
                <>
                  <p className="px-4 pb-1 text-caption text-ink-muted">
                    Masuk sebagai <span className="font-medium text-ink">{user.name}</span>
                  </p>
                  <Link
                    href="/account/orders"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 font-display text-body font-medium text-ink-muted hover:bg-bg-alt hover:text-ink"
                  >
                    Pesanan Saya
                  </Link>
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 font-display text-body font-medium text-ink-muted hover:bg-bg-alt hover:text-ink"
                    >
                      Panel Admin
                    </Link>
                  ) : null}
                  <form action={logoutAction} className="px-4 pt-1">
                    <button
                      type="submit"
                      className="w-full rounded-full border-2 border-line-strong px-4 py-2.5 font-display text-body-sm font-medium text-ink transition-colors hover:border-error hover:text-error"
                    >
                      Keluar
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border-2 border-accent px-4 py-2.5 text-center font-display text-body-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-gradient-to-r from-accent to-cyan px-4 py-2.5 text-center font-display text-body-sm font-semibold text-bg"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
