import { FRAMES, FREE_SHIPPING_MIN, SHIPPING_COST, SIZES } from "@/lib/constants";

export type PricedLine = { unitPrice: number; quantity: number };

export function calcShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
}

export function calcTotals(items: PricedLine[]): {
  subtotal: number;
  shippingCost: number;
  total: number;
} {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shippingCost = calcShipping(subtotal);
  return { subtotal, shippingCost, total: subtotal + shippingCost };
}

export function clampQuantity(quantity: number, stock: number): number {
  if (stock <= 0) return 0;
  return Math.min(Math.max(Math.trunc(quantity), 1), stock);
}

/** Harga satu varian: harga dasar × pengali ukuran + biaya bingkai, dibulatkan ke ribuan. */
export function variantPrice(
  basePrice: number,
  size: string,
  frame: string,
): number {
  const sizeMultiplier = SIZES.find((option) => option.id === size)?.multiplier ?? 1;
  const frameExtra = FRAMES.find((option) => option.id === frame)?.extra ?? 0;
  return Math.round((basePrice * sizeMultiplier + frameExtra) / 1000) * 1000;
}

/** 9 kombinasi ukuran × bingkai untuk poster baru. */
export function variantMatrix(
  basePrice: number,
  stock = 10,
): { size: string; frame: string; price: number; stock: number }[] {
  return SIZES.flatMap((size) =>
    FRAMES.map((frame) => ({
      size: size.id,
      frame: frame.id,
      price: variantPrice(basePrice, size.id, frame.id),
      stock,
    })),
  );
}
