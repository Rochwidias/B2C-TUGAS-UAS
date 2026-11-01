import Link from "next/link";
import { notFound } from "next/navigation";

import { PosterForm } from "@/components/admin/poster-form";
import { Card } from "@/components/ui";
import { formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function EditPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poster = await prisma.poster.findUnique({
    where: { id },
    include: { variants: { orderBy: [{ size: "asc" }, { frame: "asc" }] } },
  });

  if (!poster) notFound();

  return (
    <div className="animate-fade-in">
      <Link
        href="/admin/products"
        className="font-display text-body-sm font-medium text-ink-muted transition-colors hover:text-accent"
      >
        ← Semua produk
      </Link>
      <p className="eyebrow mt-5">Edit produk</p>
      <h1 className="mt-2 font-display text-display-sm">{poster.title}</h1>
      <p className="mt-1 font-mono text-caption text-ink-soft">/{poster.slug}</p>

      <div className="mt-6 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <PosterForm
          poster={{
            id: poster.id,
            title: poster.title,
            description: poster.description,
            aiPrompt: poster.aiPrompt,
            humanNote: poster.humanNote,
            category: poster.category,
            imageUrl: poster.imageUrl,
            basePrice: poster.basePrice,
            featured: poster.featured,
            active: poster.active,
          }}
        />

        <Card variant="outlined" padding="lg" className="h-fit xl:sticky xl:top-24">
          <h2 className="font-display text-heading-lg">Varian & stok</h2>
          <p className="mt-1 text-caption text-ink-muted">
            Stok per kombinasi ukuran dan bingkai.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="text-left text-micro uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="py-2 font-medium">Ukuran</th>
                  <th className="py-2 font-medium">Bingkai</th>
                  <th className="py-2 text-right font-medium">Harga</th>
                  <th className="py-2 text-right font-medium">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {poster.variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="py-2 font-medium">{variant.size}</td>
                    <td className="py-2 text-caption text-ink-muted">{variant.frame}</td>
                    <td className="py-2 text-right text-caption">
                      {formatIDR(variant.price)}
                    </td>
                    <td className="py-2 text-right">
                      <span className={variant.stock <= 2 ? "font-semibold text-error" : ""}>
                        {variant.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
