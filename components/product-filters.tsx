"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CATEGORIES, categoryGradient, categorySoftBg } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Input, Select } from "@/components/ui";

const SORTS = [
  { id: "terbaru", label: "Terbaru" },
  { id: "termurah", label: "Harga terendah" },
  { id: "termahal", label: "Harga tertinggi" },
] as const;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "terbaru";
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [isSearchFocused, setSearchFocused] = useState(false);
  const isFirstRender = useRef(true);

  // Ikuti perubahan URL dari luar (back/forward/reset) tanpa effect + setState.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  const hasActiveFilters = Boolean(
    urlQuery || activeCategory || activeSort !== "terbaru",
  );

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  // Debounce perubahan input pencarian ke URL.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (query === urlQuery) return;

    const timer = window.setTimeout(() => update({ q: query || null }), 350);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery, update]);

  const activeCount = useMemo(
    () =>
      Number(Boolean(urlQuery)) +
      Number(Boolean(activeCategory)) +
      Number(activeSort !== "terbaru"),
    [urlQuery, activeCategory, activeSort],
  );

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface/80 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            "relative flex-1 rounded-xl transition-shadow",
            isSearchFocused && "ring-2 ring-accent/20",
          )}
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Cari poster, tema, atau prompt AI…"
            aria-label="Cari poster"
            className="pl-12"
          />
        </div>

        <div className="sm:w-48">
          <Select
            value={activeSort}
            onChange={(value) => update({ sort: value })}
            options={SORTS.map((sort) => ({ value: sort.id, label: sort.label }))}
            aria-label="Urutkan produk"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              update({ q: null, category: null, sort: null });
            }}
            className="shrink-0 rounded-full border border-line px-4 py-2.5 font-display text-body-sm font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => update({ category: null })}
          className={cn(
            "rounded-full px-4 py-2 font-display text-caption font-semibold uppercase tracking-wider transition-all",
            activeCategory === ""
              ? "bg-ink text-bg shadow-pill"
              : "bg-bg-alt text-ink-muted hover:text-ink",
          )}
          aria-pressed={activeCategory === ""}
        >
          Semua
        </button>

        {CATEGORIES.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => update({ category: category.id })}
              className={cn(
                "rounded-full px-4 py-2 font-display text-caption font-semibold uppercase tracking-wider transition-all hover:scale-105",
                active ? "text-bg shadow-pill" : "text-ink hover:text-accent",
              )}
              style={
                active
                  ? { backgroundImage: categoryGradient(category.id) }
                  : { backgroundColor: categorySoftBg(category.id) }
              }
              aria-pressed={active}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-body-sm text-ink-muted animate-fade-in">
          <span className="font-medium text-ink">Filter aktif:</span>
          {urlQuery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-accent">
              “{urlQuery}”
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  update({ q: null });
                }}
                className="ml-1 rounded p-0.5 hover:bg-accent/15"
                aria-label="Hapus pencarian"
              >
                ×
              </button>
            </span>
          )}
          {activeCategory && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-bg"
              style={{ backgroundImage: categoryGradient(activeCategory) }}
            >
              {CATEGORIES.find((item) => item.id === activeCategory)?.label}
              <button
                type="button"
                onClick={() => update({ category: null })}
                className="ml-1 rounded p-0.5 hover:bg-white/20"
                aria-label="Hapus filter kategori"
              >
                ×
              </button>
            </span>
          )}
          {activeSort !== "terbaru" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-dim px-3 py-1">
              Urut: {SORTS.find((item) => item.id === activeSort)?.label}
              <button
                type="button"
                onClick={() => update({ sort: null })}
                className="ml-1 rounded p-0.5 hover:bg-line"
                aria-label="Reset urutan"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
