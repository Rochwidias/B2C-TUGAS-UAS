"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { categoryGradient, categoryLabel, categorySoftBg } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

export const staggerClasses = [
  "stagger-1",
  "stagger-2",
  "stagger-3",
  "stagger-4",
  "stagger-5",
  "stagger-6",
  "stagger-7",
  "stagger-8",
  "stagger-9",
  "stagger-10",
  "stagger-11",
  "stagger-12",
];

type PosterCardProps = {
  poster: {
    slug: string;
    title: string;
    imageUrl: string;
    category: string;
  };
  fromPrice: number;
  index?: number;
  className?: string;
};

export function PosterCard({ poster, fromPrice, index = 0, className }: PosterCardProps) {
  const wishlist = useWishlist();
  const wishlisted = wishlist.includes(poster.slug);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleWishlist() {
    const saved = toggleWishlist(poster.slug);
    setFeedback(saved ? "Disimpan ke wishlist" : "Dihapus dari wishlist");
  }

  async function share() {
    const url = `${window.location.origin}/products/${poster.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: poster.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setFeedback("Tautan disalin");
    } catch {
      setFeedback("Gagal membagikan");
    }
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-line/70 bg-surface shadow-card transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-hover",
        staggerClasses[index % staggerClasses.length],
        className,
      )}
    >
      <div className="relative aspect-3-4 overflow-hidden bg-bg-alt poster-mask">
        <span
          className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
          style={{ backgroundImage: categoryGradient(poster.category) }}
          aria-hidden="true"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster.imageUrl}
          alt={`Poster ${poster.title}`}
          loading={index < 4 ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />

        <span
          className="absolute left-3 top-3 z-20 rounded-full px-3 py-1 font-display text-micro font-semibold uppercase tracking-wider text-bg shadow-sm"
          style={{ backgroundImage: categoryGradient(poster.category) }}
        >
          {categoryLabel(poster.category)}
        </span>

        <div className="absolute inset-0 z-20 flex items-start justify-end gap-2 p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={share}
            className="flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card transition-all hover:bg-bg-alt hover:text-accent"
            aria-label={`Bagikan ${poster.title}`}
            title="Bagikan"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-surface shadow-card transition-all hover:bg-bg-alt",
              wishlisted ? "text-coral" : "text-ink-muted hover:text-accent",
            )}
            aria-label={wishlisted ? `Hapus ${poster.title} dari wishlist` : `Simpan ${poster.title} ke wishlist`}
            aria-pressed={wishlisted}
            title="Wishlist"
          >
            <svg className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <Link
          href={`/products/${poster.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`Lihat detail ${poster.title}`}
        />

        {feedback && (
          <span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/90 px-3 py-1 text-caption text-bg animate-fade-in">
            {feedback}
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div
          className="inline-flex rounded-full px-2.5 py-1 font-display text-micro font-semibold uppercase tracking-wider text-ink-muted"
          style={{ backgroundColor: categorySoftBg(poster.category) }}
        >
          {categoryLabel(poster.category)}
        </div>
        <h3 className="font-display text-heading-lg font-bold leading-tight text-ink">
          <Link href={`/products/${poster.slug}`} className="transition-colors hover:text-accent">
            {poster.title}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-3 border-t border-bg-alt pt-3">
          <span className="font-display text-heading-md font-bold text-accent">
            Mulai {formatIDR(fromPrice)}
          </span>
          <span className="text-caption text-ink-muted">3 ukuran · 3 bingkai</span>
        </div>
      </div>
    </article>
  );
}
