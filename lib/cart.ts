import { clampQuantity } from "@/lib/pricing";

export type CartItem = {
  variantId: string;
  posterId: string;
  slug: string;
  title: string;
  imageUrl: string;
  size: string;
  frame: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem; quantity?: number }
  | { type: "remove"; variantId: string }
  | { type: "setQty"; variantId: string; quantity: number }
  | { type: "clear" };

export const CART_STORAGE_KEY = "posterai-cart-v1";

export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.items;

    case "add": {
      const requested = clampQuantity(action.quantity ?? 1, action.item.stock);
      if (requested === 0) return items;

      const existing = items.find((i) => i.variantId === action.item.variantId);
      if (!existing) {
        return [...items, { ...action.item, quantity: requested }];
      }

      return items.map((item) =>
        item.variantId === action.item.variantId
          ? {
              ...item,
              quantity: clampQuantity(item.quantity + requested, item.stock),
            }
          : item,
      );
    }

    case "remove":
      return items.filter((item) => item.variantId !== action.variantId);

    case "setQty":
      if (action.quantity <= 0) {
        return items.filter((item) => item.variantId !== action.variantId);
      }
      return items.map((item) =>
        item.variantId === action.variantId
          ? {
              ...item,
              quantity: clampQuantity(action.quantity, item.stock),
            }
          : item,
      );

    case "clear":
      return [];

    default:
      return items;
  }
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

const TEXT_FIELDS = [
  "variantId",
  "posterId",
  "slug",
  "title",
  "imageUrl",
  "size",
  "frame",
] as const;

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function readCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): CartItem[] => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;

      const complete = TEXT_FIELDS.every(
        (field) => typeof item[field] === "string" && item[field] !== "",
      );
      if (!complete) return [];
      if (!isNonNegativeNumber(item.unitPrice)) return [];
      if (!isNonNegativeNumber(item.stock)) return [];
      if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity)) return [];
      if (item.quantity <= 0) return [];

      const stock = Math.trunc(item.stock);
      const quantity = Math.min(Math.trunc(item.quantity), Math.max(stock, 1));
      return [{ ...(item as unknown as CartItem), stock, quantity }];
    });
  } catch {
    return [];
  }
}
