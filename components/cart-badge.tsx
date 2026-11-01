"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/cn";

export function CartBadge() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      className={cn(
        "relative inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-ink transition-all hover:border-accent hover:text-accent",
        !ready && "opacity-70",
      )}
      aria-label={
        !ready
          ? "Keranjang (memuat)"
          : count > 0
            ? `Keranjang (${count} item)`
            : "Keranjang (kosong)"
      }
    >
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <span className="hidden font-display text-body-sm font-medium sm:inline">
        Keranjang
      </span>

      {ready && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-display text-micro font-bold text-bg">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
