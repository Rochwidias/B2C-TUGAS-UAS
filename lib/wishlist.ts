"use client";

import { useSyncExternalStore } from "react";

const WISHLIST_KEY = "posterai-wishlist-v1";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(WISHLIST_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

function parse(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function useWishlist(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return parse(raw);
}

/** Mengembalikan true bila poster sekarang tersimpan di wishlist. */
export function toggleWishlist(slug: string): boolean {
  const current = parse(getSnapshot());
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];

  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
  return next.includes(slug);
}
