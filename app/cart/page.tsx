"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import { Button, Card } from "@/components/ui";
import { FREE_SHIPPING_MIN, frameLabel, sizeLabel } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { calcTotals } from "@/lib/pricing";
import { cn } from "@/lib/cn";

export default function CartPage() {
  const { items, ready, setQty, removeItem, clear } = useCart();
  const totals = calcTotals(items);
  const [removing, setRemoving] = useState<string | null>(null);

  const remaining = Math.max(0, FREE_SHIPPING_MIN - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_SHIPPING_MIN) * 100);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mb-8 animate-slide-up">
        <p className="eyebrow">Keranjang</p>
        <h1 className="mt-3 font-display text-display-md">Keranjang belanja</h1>
        <p className="mt-2 text-body text-ink-muted">
          {ready ? `${items.length} varian dipilih` : "Memuat keranjang…"}
        </p>
      </div>

      {!ready ? (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-bg-alt" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-bg-alt" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line bg-bg-alt/50 px-6 py-16 text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="font-display text-display-sm">Keranjang masih kosong</p>
          <p className="mx-auto mt-2 max-w-sm text-body text-ink-muted">
            Pilih poster yang Anda suka, lalu atur ukuran dan bingkainya.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/products">Jelajahi katalog</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className={cn(
                    "flex gap-4 p-5 transition-opacity",
                    removing === item.variantId && "opacity-40",
                  )}
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="h-28 w-21 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-alt"
                    aria-label={`Lihat detail ${item.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          className="block truncate font-display font-semibold text-ink transition-colors hover:text-accent"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-body-sm text-ink-muted">
                          {sizeLabel(item.size)} · {frameLabel(item.frame)}
                        </p>
                        <p className="mt-1 text-caption text-ink-soft">
                          Stok tersedia {item.stock}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-heading-md font-bold text-accent">
                        {formatIDR(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(item.variantId, item.quantity - 1)}
                          className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-bg-alt"
                          aria-label={`Kurangi jumlah ${item.title}`}
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-display text-body-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-bg-alt disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`Tambah jumlah ${item.title}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRemoving(item.variantId);
                          window.setTimeout(() => removeItem(item.variantId), 180);
                        }}
                        disabled={removing === item.variantId}
                        className="rounded-full px-3 py-2 text-caption text-ink-muted transition-colors hover:bg-error-soft hover:text-error"
                        aria-label={`Hapus ${item.title} dari keranjang`}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card variant="elevated" padding="lg" className="shadow-card-hover">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-display text-heading-lg">Ringkasan</h2>
                <span className="text-caption text-ink-muted">{items.length} varian</span>
              </div>

              <dl className="space-y-3 border-t border-line pt-5 text-body">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="font-medium text-ink">{formatIDR(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">Ongkir</dt>
                  <dd className="font-medium text-ink">
                    {totals.shippingCost === 0 ? (
                      <span className="text-emerald">Gratis</span>
                    ) : (
                      formatIDR(totals.shippingCost)
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-4">
                  <dt className="font-display text-heading-md">Total</dt>
                  <dd className="font-display text-heading-md font-bold text-accent">
                    {formatIDR(totals.total)}
                  </dd>
                </div>
              </dl>

              {remaining > 0 && (
                <div className="mt-5 rounded-xl border border-amber/20 bg-amber-soft p-4">
                  <p className="text-caption leading-relaxed text-amber">
                    Tambah <strong>{formatIDR(remaining)}</strong> lagi untuk gratis ongkir.
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber/20">
                    <div
                      className="h-full rounded-full bg-amber transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button asChild size="xl" fullWidth className="mt-6">
                <Link href="/checkout">Lanjut ke checkout</Link>
              </Button>

              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full text-center text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-accent"
              >
                Kosongkan keranjang
              </button>

              <ul className="mt-6 space-y-2 border-t border-line pt-5 text-caption text-ink-muted">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6m-2 0V9a6 6 0 00-12 0v4l-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2l-2-2z" />
                  </svg>
                  Pembayaran simulasi, tanpa tagihan nyata
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Dikemas aman dengan tabung atau bingkai kayu
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M4 4l7 7 7-7" />
                  </svg>
                  Klaim kerusakan maksimal 7 hari
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
