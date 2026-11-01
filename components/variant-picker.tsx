"use client";

import { useMemo, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui";
import { FRAMES, SIZES, frameLabel, sizeLabel } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/format";

export type PickerVariant = {
  id: string;
  size: string;
  frame: string;
  price: number;
  stock: number;
};

type Props = {
  poster: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string;
  };
  variants: PickerVariant[];
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function stockLabel(stock: number) {
  if (stock <= 0) return "Stok habis";
  if (stock <= 3) return `Sisa ${stock} pcs`;
  return `Stok ${stock}`;
}

export function VariantPicker({ poster, variants }: Props) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string>(
    SIZES.find((option) => variants.some((variant) => variant.size === option.id && variant.stock > 0))?.id ??
      SIZES[0].id,
  );
  const [frame, setFrame] = useState<string>(
    variants.find((variant) => variant.size === size && variant.stock > 0)?.frame ?? "none",
  );
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(false);

  const variant = useMemo(
    () => variants.find((item) => item.size === size && item.frame === frame),
    [variants, size, frame],
  );

  const stock = variant?.stock ?? 0;
  const maxQty = Math.max(1, stock);
  const disabled = !variant || stock === 0;

  function chooseSize(nextSize: string) {
    setSize(nextSize);
    setQuantity(1);
    setFeedback(false);
    const current = variants.find((item) => item.size === nextSize && item.frame === frame);
    if (!current || current.stock === 0) {
      const fallback = variants.find((item) => item.size === nextSize && item.stock > 0);
      if (fallback) setFrame(fallback.frame);
    }
  }

  function chooseFrame(nextFrame: string) {
    setFrame(nextFrame);
    setQuantity(1);
    setFeedback(false);
  }

  function handleAdd() {
    if (!variant || variant.stock === 0) return;
    addItem(
      {
        variantId: variant.id,
        posterId: poster.id,
        slug: poster.slug,
        title: poster.title,
        imageUrl: poster.imageUrl,
        size: variant.size,
        frame: variant.frame,
        unitPrice: variant.price,
        quantity: 1,
        stock: variant.stock,
      },
      Math.min(quantity, variant.stock),
    );
    setFeedback(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-y border-line py-5">
        <div>
          <p className="eyebrow mb-1">Harga varian terpilih</p>
          <p className="font-display text-4xl font-extrabold text-accent">
            {variant ? formatIDR(variant.price) : "N/A"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-caption font-medium",
            stock <= 0
              ? "bg-error-soft text-error"
              : stock <= 3
                ? "bg-amber-soft text-amber"
                : "bg-emerald-soft text-emerald",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
          {stockLabel(stock)}
        </span>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-display text-caption font-semibold uppercase tracking-wider text-ink-muted">
            Ukuran
          </p>
          <p className="text-caption text-ink-soft">3 pilihan</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SIZES.map((option) => {
            const available = variants.some((item) => item.size === option.id && item.stock > 0);
            const selected = size === option.id;
            const optionPrice = variants
              .filter((item) => item.size === option.id)
              .sort((a, b) => a.price - b.price)[0]?.price;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseSize(option.id)}
                disabled={!available}
                className={cn(
                  "relative rounded-2xl border-2 p-4 text-left transition-all",
                  selected
                    ? "border-accent bg-accent-soft shadow-[0_0_0_2px_var(--color-accent)]"
                    : "border-line bg-surface hover:-translate-y-0.5 hover:border-accent/50",
                  !available && "cursor-not-allowed opacity-40",
                )}
                aria-pressed={selected}
              >
                <span className="mb-1 block font-display text-lg font-bold">{option.id}</span>
                <span className="block text-caption text-ink-muted">{sizeLabel(option.id)}</span>
                {optionPrice !== undefined && (
                  <span className="mt-2 block font-display text-caption font-semibold text-accent">
                    {formatIDR(optionPrice)}
                  </span>
                )}
                {selected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg animate-scale-in">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-display text-caption font-semibold uppercase tracking-wider text-ink-muted">
            Bingkai
          </p>
          <p className="text-caption text-ink-soft">Opsional</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {FRAMES.map((option) => {
            const available = variants.some(
              (item) => item.size === size && item.frame === option.id && item.stock > 0,
            );
            const selected = frame === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseFrame(option.id)}
                disabled={!available}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all",
                  selected
                    ? "border-accent bg-accent-soft shadow-[0_0_0_2px_var(--color-accent)]"
                    : "border-line bg-surface hover:-translate-y-0.5 hover:border-accent/50",
                  !available && "cursor-not-allowed opacity-40",
                )}
                aria-pressed={selected}
              >
                <span
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-lg border",
                    option.id === "none" && "border-dashed border-line bg-bg-alt",
                    option.id === "black" && "border-ink bg-ink",
                    option.id === "white" && "border-line bg-white",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-body-sm font-semibold">
                    {option.id === "none" ? "Tanpa bingkai" : frameLabel(option.id)}
                  </span>
                  <span className="block text-caption text-ink-soft">
                    {option.extra > 0 ? `+${formatIDR(option.extra)}` : "Hemat"}
                  </span>
                </span>
                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-bg">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <p className="shrink-0 font-display text-caption font-semibold uppercase tracking-wider text-ink-muted">
          Jumlah
        </p>
        <div className="inline-flex items-center overflow-hidden rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-bg-alt"
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10) || 1;
              setQuantity(Math.min(maxQty, Math.max(1, next)));
            }}
            className="w-14 border-x border-line bg-surface py-2.5 text-center font-display font-semibold text-ink outline-none"
            min={1}
            max={maxQty}
            aria-label="Jumlah"
          />
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
            disabled={quantity >= maxQty}
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-bg-alt disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
        <span className="text-caption text-ink-soft">Maks {maxQty} pcs</span>
      </div>

      <Button type="button" onClick={handleAdd} disabled={disabled} size="xl" fullWidth>
        {disabled ? "Stok habis" : "Tambah ke keranjang"}
      </Button>

      {feedback && (
        <div
          className="flex items-center gap-2 rounded-xl border border-success/25 bg-success-soft p-3 text-body-sm text-success animate-fade-in-up"
          role="status"
        >
          <CheckIcon className="shrink-0" />
          <span>
            Ditambahkan ke keranjang.{" "}
            <a href="/cart" className="font-medium underline underline-offset-4">
              Lihat keranjang
            </a>
          </span>
        </div>
      )}

      <p className="text-center text-caption text-ink-soft">
        Harga dan stok dihitung ulang di server saat checkout.
      </p>
    </div>
  );
}
