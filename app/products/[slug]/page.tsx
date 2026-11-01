import Link from "next/link";
import { notFound } from "next/navigation";

import { PosterCard } from "@/components/poster-card";
import { ProductGallery } from "@/components/product-gallery";
import { VariantPicker } from "@/components/variant-picker";
import { Card, Divider, SectionTitle } from "@/components/ui";
import {
  categoryColor,
  categoryLabel,
  categorySoftBg,
} from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const specs = [
  {
    label: "Bahan",
    value: "Fine art paper 260 gsm, tinta pigmen archival",
  },
  {
    label: "Produksi",
    value: "3–5 hari kerja setelah pembayaran dikonfirmasi",
  },
  {
    label: "Pengiriman",
    value: "Dikemas tabung keras / bingkai kayu, gratis ongkir di atas Rp 250.000",
  },
];

function minPrice(variants: { price: number }[], fallback: number) {
  if (variants.length === 0) return fallback;
  return Math.min(...variants.map((variant) => variant.price));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const poster = await prisma.poster.findUnique({
    where: { slug },
    include: { variants: { orderBy: { price: "asc" } } },
  });

  if (!poster || !poster.active) notFound();

  let gallery: string[] = [];
  try {
    const parsed = JSON.parse(poster.gallery);
    if (Array.isArray(parsed)) {
      gallery = parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    gallery = [];
  }
  if (gallery.length === 0) gallery = [poster.imageUrl];

  const related = await prisma.poster.findMany({
    where: {
      active: true,
      category: poster.category,
      id: { not: poster.id },
    },
    include: { variants: { select: { price: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const catColor = categoryColor(poster.category);

  return (
    <div className="container-page py-8 sm:py-12">
      <nav
        className="mb-8 flex flex-wrap items-center gap-2 text-body-sm text-ink-soft animate-slide-up"
        aria-label="Breadcrumb"
      >
        <Link href="/products" className="transition-colors hover:text-accent">
          Katalog
        </Link>
        <span className="text-line">/</span>
        <Link
          href={`/products?category=${poster.category}`}
          className="flex items-center gap-1.5 transition-colors hover:text-accent"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: catColor }}
            aria-hidden="true"
          />
          {categoryLabel(poster.category)}
        </Link>
        <span className="text-line">/</span>
        <span className="max-w-xs truncate text-ink">{poster.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-slide-up">
          <ProductGallery
            images={gallery}
            title={poster.title}
            slug={poster.slug}
            category={poster.category}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start animate-slide-up stagger-1">
          <Card variant="elevated" padding="lg" className="relative overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: catColor }}
              aria-hidden="true"
            />
            <div className="space-y-6 pt-1">
              <div>
                <Link
                  href={`/products?category=${poster.category}`}
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-caption font-semibold uppercase tracking-wider text-ink-muted"
                  style={{ backgroundColor: categorySoftBg(poster.category) }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: catColor }}
                    aria-hidden="true"
                  />
                  {categoryLabel(poster.category)}
                </Link>
                <h1 className="text-balance font-display text-display-sm leading-tight">
                  {poster.title}
                </h1>
              </div>

              <p className="border-t border-line pt-5 text-body-lg leading-relaxed text-ink-muted">
                {poster.description}
              </p>

              <VariantPicker
                poster={{
                  id: poster.id,
                  slug: poster.slug,
                  title: poster.title,
                  imageUrl: poster.imageUrl,
                }}
                variants={poster.variants.map((variant) => ({
                  id: variant.id,
                  size: variant.size,
                  frame: variant.frame,
                  price: variant.price,
                  stock: variant.stock,
                }))}
              />

              <Divider text="Spesifikasi" />

              <dl className="space-y-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                    <dt className="font-display text-body-sm font-semibold text-ink">
                      {spec.label}
                    </dt>
                    <dd className="text-body-sm leading-relaxed text-ink-muted">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex items-center justify-between rounded-xl bg-bg-alt px-4 py-3 text-body-sm">
                <span className="text-ink-muted">Harga mulai</span>
                <span className="font-display font-bold text-accent">
                  {formatIDR(minPrice(poster.variants, poster.basePrice))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section className="mt-16 animate-slide-up stagger-2" aria-labelledby="behind-heading">
        <h2 id="behind-heading" className="sr-only">
          Di balik poster ini
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            variant="outlined"
            padding="lg"
            className="relative overflow-hidden"
          >
            <p className="eyebrow text-cyan">Di balik poster ini</p>
            <h2 className="mt-2 font-display text-heading-xl">Prompt yang dipakai</h2>
            <pre className="mt-5 overflow-x-auto rounded-xl bg-ink p-5 font-mono text-body-sm leading-relaxed text-paper/90">
              <code>{poster.aiPrompt ?? "Prompt tidak dicatat untuk poster ini."}</code>
            </pre>
          </Card>

          <Card
            variant="outlined"
            padding="lg"
            className="relative overflow-hidden"
          >
            <p className="eyebrow text-magenta">Sentuhan manusia</p>
            <h2 className="mt-2 font-display text-heading-xl">Apa yang diubah</h2>
            <div className="mt-5 rounded-xl border border-line/60 bg-magenta-soft p-5">
              <p className="text-body leading-relaxed text-ink-muted">
                {poster.humanNote ??
                  "Poster ini dirapikan manual untuk memastikan hasil cetak sesuai standar kualitas."}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20 animate-slide-up stagger-3" aria-labelledby="related-heading">
          <SectionTitle
            eyebrow="Jelajahi lagi"
            title="Poster serupa"
            subtitle={`Koleksi lain dari kategori ${categoryLabel(poster.category)}.`}
            action={
              <Link
                href={`/products?category=${poster.category}`}
                className="inline-flex items-center gap-2 font-display text-body font-semibold text-accent transition-colors hover:text-accent-hover"
              >
                Lihat semua
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <PosterCard
                key={item.id}
                poster={item}
                fromPrice={minPrice(item.variants, item.basePrice)}
                index={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
