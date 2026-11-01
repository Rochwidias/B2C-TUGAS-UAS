import type { Metadata } from "next";
import Link from "next/link";

import { PosterCard } from "@/components/poster-card";
import { ProductFilters } from "@/components/product-filters";
import { categoryLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Katalog poster: PosterAI" };

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const category = first(params.category);
  const sort = first(params.sort) || "terbaru";
  const requestedPage = Number.parseInt(first(params.page) || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const posters = await prisma.poster.findMany({
    where: {
      active: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { aiPrompt: { contains: q } },
            ],
          }
        : {}),
    },
    include: { variants: { select: { price: true, stock: true } } },
  });

  const withPrice = posters.map((poster) => ({
    ...poster,
    fromPrice:
      poster.variants.length > 0
        ? Math.min(...poster.variants.map((variant) => variant.price))
        : poster.basePrice,
    totalStock: poster.variants.reduce((sum, variant) => sum + variant.stock, 0),
  }));

  withPrice.sort((a, b) => {
    if (sort === "termurah") return a.fromPrice - b.fromPrice;
    if (sort === "termahal") return b.fromPrice - a.fromPrice;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const totalPages = Math.max(1, Math.ceil(withPrice.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = withPrice.slice(start, start + PAGE_SIZE);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (sort !== "terbaru") next.set("sort", sort);
    if (target > 1) next.set("page", String(target));
    const queryString = next.toString();
    return queryString ? `/products?${queryString}` : "/products";
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mb-8 animate-slide-up">
        <p className="eyebrow">Katalog</p>
        <h1 className="mt-3 font-display text-display-md sm:text-display-lg">
          {category ? categoryLabel(category) : "Semua poster"}
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-muted">
          {withPrice.length} poster tersedia. Setiap karya dibuat dengan AI lalu
          dirapikan manual sebelum dicetak.
        </p>
      </div>

      <div className="sticky top-20 z-30 -mx-1 px-1 pb-2">
        <ProductFilters />
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-3xl border-2 border-dashed border-line bg-bg-alt/50 px-6 py-16 text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="font-display text-display-sm">Tidak ada poster yang cocok</p>
          <p className="mx-auto mt-2 max-w-sm text-body text-ink-muted">
            Coba kata kunci lain atau lepas filter kategori yang sedang aktif.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-body-sm font-semibold text-bg transition-colors hover:bg-accent"
          >
            Lihat semua poster
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((poster, index) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                fromPrice={poster.fromPrice}
                index={index}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
              aria-label="Pagination"
            >
              <p className="text-body-sm text-ink-muted">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-1">
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1)}
                    className="rounded-full border border-line px-4 py-2.5 font-display text-body-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                    aria-label="Halaman sebelumnya"
                  >
                    ← Sebelumnya
                  </Link>
                ) : null}

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (target) =>
                      target === 1 ||
                      target === totalPages ||
                      Math.abs(target - currentPage) <= 1,
                  )
                  .map((target, index, list) => {
                    const previous = list[index - 1];
                    const gap = previous !== undefined && target - previous > 1;
                    return (
                      <span key={target} className="flex items-center gap-1">
                        {gap ? <span className="px-1 text-ink-soft">…</span> : null}
                        <Link
                          href={pageHref(target)}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full font-display text-body-sm font-medium transition-all",
                            target === currentPage
                              ? "bg-accent text-bg shadow-pill"
                              : "text-ink hover:bg-bg-alt",
                          )}
                          aria-label={`Halaman ${target}`}
                          aria-current={target === currentPage ? "page" : undefined}
                        >
                          {target}
                        </Link>
                      </span>
                    );
                  })}

                {currentPage < totalPages ? (
                  <Link
                    href={pageHref(currentPage + 1)}
                    className="rounded-full border border-line px-4 py-2.5 font-display text-body-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                    aria-label="Halaman berikutnya"
                  >
                    Berikutnya →
                  </Link>
                ) : null}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
