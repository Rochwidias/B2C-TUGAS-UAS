import { orderNumber } from "@/lib/order-number";
import { calcTotals } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, firstError } from "@/lib/validation";

export type CheckoutInput = {
  items: { variantId: string; quantity: number }[];
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipCity: string;
  shipPostal: string;
  shipNote?: string;
  idempotencyKey?: string;
};

export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

class OrderError extends Error {}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function createOrder(
  input: CheckoutInput,
  userId: string | null = null,
): Promise<CheckoutResult> {
  const shipping = checkoutSchema.safeParse({
    shipName: input.shipName,
    shipPhone: input.shipPhone,
    shipAddress: input.shipAddress,
    shipCity: input.shipCity,
    shipPostal: input.shipPostal,
    shipNote: input.shipNote,
  });
  if (!shipping.success) return { ok: false, error: firstError(shipping.error) };

  const requested = new Map<string, number>();
  for (const item of input.items ?? []) {
    if (typeof item?.variantId !== "string") continue;
    const quantity = Math.trunc(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: "Jumlah item tidak valid." };
    }
    requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + quantity);
  }

  if (requested.size === 0) {
    return { ok: false, error: "Keranjang masih kosong." };
  }

  const idempotencyKey = input.idempotencyKey?.trim() || null;

  try {
    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.order.findUnique({
          where: { idempotencyKey },
          select: { orderNumber: true },
        });
        if (existing) {
          return { ok: true as const, orderNumber: existing.orderNumber };
        }
      }

      const variants = await tx.variant.findMany({
        where: { id: { in: [...requested.keys()] } },
        include: {
          poster: {
            select: { id: true, title: true, imageUrl: true, active: true },
          },
        },
      });

      if (variants.length !== requested.size) {
        throw new OrderError(
          "Salah satu poster di keranjang sudah tidak tersedia. Muat ulang keranjang Anda.",
        );
      }

      const lines = variants.map((variant) => {
        const quantity = requested.get(variant.id) ?? 0;
        if (!variant.poster.active) {
          throw new OrderError(`Poster "${variant.poster.title}" sudah tidak dijual.`);
        }
        if (quantity > variant.stock) {
          throw new OrderError(
            `Stok "${variant.poster.title}" ukuran ${variant.size} tersisa ${variant.stock}.`,
          );
        }
        return {
          variantId: variant.id,
          posterId: variant.poster.id,
          title: variant.poster.title,
          imageUrl: variant.poster.imageUrl,
          size: variant.size,
          frame: variant.frame,
          unitPrice: variant.price,
          quantity,
        };
      });

      const totals = calcTotals(lines);

      let number = orderNumber();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const clash = await tx.order.findUnique({
          where: { orderNumber: number },
          select: { id: true },
        });
        if (!clash) break;
        number = orderNumber();
      }

      await tx.order.create({
        data: {
          orderNumber: number,
          idempotencyKey,
          userId,
          status: "PAID",
          subtotal: totals.subtotal,
          shippingCost: totals.shippingCost,
          total: totals.total,
          shipName: shipping.data.shipName,
          shipPhone: shipping.data.shipPhone,
          shipAddress: shipping.data.shipAddress,
          shipCity: shipping.data.shipCity,
          shipPostal: shipping.data.shipPostal,
          shipNote: shipping.data.shipNote || null,
          items: {
            create: lines.map((line) => ({
              posterId: line.posterId,
              variantId: line.variantId,
              title: line.title,
              imageUrl: line.imageUrl,
              size: line.size,
              frame: line.frame,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
            })),
          },
        },
      });

      for (const line of lines) {
        await tx.variant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      return { ok: true as const, orderNumber: number };
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    // Dua request dengan idempotency key sama bisa balapan; pakai order yang menang.
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        select: { orderNumber: true },
      });
      if (existing) return { ok: true, orderNumber: existing.orderNumber };
    }
    console.error("createOrder failed", error);
    return { ok: false, error: "Gagal membuat pesanan. Coba lagi." };
  }
}

export const ORDER_STATUS_VALUES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export type StatusResult = { ok: true } | { ok: false; error: string };

/**
 * Mengubah status pesanan. Pembatalan mengembalikan stok tepat satu kali,
 * dan pesanan yang sudah dibatalkan tidak bisa diaktifkan kembali.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<StatusResult> {
  if (!ORDER_STATUS_VALUES.includes(status as OrderStatus)) {
    return { ok: false, error: "Status tidak dikenal." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan." };
      if (order.status === status) return { ok: true as const };
      if (order.status === "CANCELLED") {
        return {
          ok: false as const,
          error: "Pesanan yang sudah dibatalkan tidak bisa diubah lagi.",
        };
      }

      const cancelling = status === "CANCELLED";

      if (cancelling && !order.stockRestored) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(cancelling ? { stockRestored: true } : {}),
        },
      });

      return { ok: true as const };
    });
  } catch (error) {
    console.error("updateOrderStatus failed", error);
    return { ok: false, error: "Gagal mengubah status pesanan." };
  }
}
