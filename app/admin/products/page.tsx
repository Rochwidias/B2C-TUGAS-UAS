import Link from "next/link";

import { togglePosterAction } from "@/actions/admin";
import { Badge, Card } from "@/components/ui";
import { categoryLabel } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  const posters = await prisma.poster.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { select: { stock: true, price: true } } },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Katalog</p>
          <h1 className="mt-2 font-display text-display-sm">Produk</h1>
          <p className="mt-1 text-body text-ink-muted">
            {posters.length} poster terdaftar.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-gradient-to-r from-accent to-cyan px-5 py-2.5 font-display text-body-sm font-semibold text-bg"
        >
          + Poster baru
        </Link>
      </div>

      {posters.length === 0 ? (
        <Card variant="outlined" padding="xl" className="mt-6 text-center">
          <p className="font-display text-heading-lg">Belum ada poster</p>
          <p className="mt-2 text-body text-ink-muted">Tambahkan poster pertama Anda.</p>
        </Card>
      ) : (
        <Card variant="elevated" padding="none" className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-body-sm">
              <thead className="border-b border-line bg-bg-alt text-left text-caption uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Poster</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 font-medium">Harga</th>
                  <th className="px-5 py-3 font-medium">Stok</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {posters.map((poster) => {
                  const stock = poster.variants.reduce((sum, variant) => sum + variant.stock, 0);
                  const fromPrice =
                    poster.variants.length > 0
                      ? Math.min(...poster.variants.map((variant) => variant.price))
                      : poster.basePrice;

                  return (
                    <tr key={poster.id} className="transition-colors hover:bg-bg-alt/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={poster.imageUrl}
                            alt=""
                            className="h-14 w-10 rounded-lg border border-line object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-display font-semibold text-ink">
                              {poster.title}
                            </p>
                            <p className="mt-0.5 font-mono text-micro text-ink-soft">
                              /{poster.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-caption text-ink-muted">
                        {categoryLabel(poster.category)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{formatIDR(poster.basePrice)}</p>
                        <p className="mt-0.5 text-caption text-ink-soft">
                          mulai {formatIDR(fromPrice)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={stock <= 5 ? "text-error" : "text-ink"}>{stock}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            className={
                              poster.active
                                ? "bg-emerald-soft text-emerald"
                                : "bg-error-soft text-error"
                            }
                          >
                            {poster.active ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {poster.featured ? (
                            <Badge className="bg-butter-soft text-ink">Beranda</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/products/${poster.id}`}
                            className="font-display text-caption font-semibold text-accent hover:underline"
                          >
                            Edit
                          </Link>
                          <form action={togglePosterAction}>
                            <input type="hidden" name="id" value={poster.id} />
                            <button
                              type="submit"
                              className="font-display text-caption font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
                            >
                              {poster.active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
