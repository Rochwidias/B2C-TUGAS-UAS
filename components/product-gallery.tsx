"use client";

import { useEffect, useState } from "react";

import { categoryGradient, categoryLabel } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

type Props = {
  images: string[];
  title: string;
  slug: string;
  category: string;
};

export function ProductGallery({ images, title, slug, category }: Props) {
  const gallery = images.length > 0 ? images : [""];
  const [active, setActive] = useState(gallery[0]);
  const wishlist = useWishlist();
  const wishlisted = wishlist.includes(slug);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleWishlist() {
    const saved = toggleWishlist(slug);
    setFeedback(saved ? "Disimpan ke wishlist" : "Dihapus dari wishlist");
  }

  async function share() {
    const url = `${window.location.origin}/products/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setFeedback("Tautan disalin");
    } catch {
      setFeedback("Gagal membagikan");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="aspect-3-4 relative">
          {active ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={active}
              alt={`Poster ${title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-muted">
              Gambar tidak tersedia
            </div>
          )}

          <span
            className="absolute bottom-4 left-4 rounded-full px-3 py-1.5 font-display text-micro font-semibold uppercase tracking-wider text-bg shadow-pill"
            style={{ backgroundImage: categoryGradient(category) }}
          >
            {categoryLabel(category)}
          </span>

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={share}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card transition-all hover:bg-bg-alt hover:text-accent"
              aria-label="Bagikan poster"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card transition-all hover:bg-bg-alt",
                wishlisted ? "text-coral" : "text-ink-muted hover:text-accent",
              )}
              aria-label={wishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
              aria-pressed={wishlisted}
            >
              <svg className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {feedback && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/90 px-3 py-1 text-caption text-bg animate-fade-in">
              {feedback}
            </span>
          )}
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-3 gap-3" role="group" aria-label="Galeri poster">
          {gallery.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(src)}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 bg-surface transition-all",
                active === src
                  ? "border-accent shadow-[0_0_0_2px_var(--color-accent)]"
                  : "border-line opacity-80 hover:opacity-100",
              )}
              aria-label={`Gambar ${index + 1} dari ${gallery.length}`}
              aria-pressed={active === src}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="aspect-3-4 w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
