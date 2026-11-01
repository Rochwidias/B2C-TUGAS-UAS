import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createOrder, updateOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { prepareTestDb, resetTestDb, seedFixture, shipping } from "./helpers/db";

let fixture: Awaited<ReturnType<typeof seedFixture>>;

beforeAll(async () => {
  await prepareTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  fixture = await seedFixture();
});

async function placeOrder(quantity = 3) {
  const result = await createOrder({
    items: [{ variantId: fixture.a3.id, quantity }],
    ...shipping,
  });
  if (!result.ok) throw new Error(result.error);

  return prisma.order.findUniqueOrThrow({
    where: { orderNumber: result.orderNumber },
    include: { items: true },
  });
}

describe("updateOrderStatus", () => {
  it("mengubah status tanpa menyentuh stok", async () => {
    const order = await placeOrder(2);

    const result = await updateOrderStatus(order.id, "SHIPPED");
    expect(result.ok).toBe(true);

    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(8);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("SHIPPED");
  });

  it("mengembalikan stok saat pesanan dibatalkan", async () => {
    const order = await placeOrder(3);

    const result = await updateOrderStatus(order.id, "CANCELLED");
    expect(result.ok).toBe(true);

    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(10);
  });

  it("tidak mengembalikan stok dua kali", async () => {
    const order = await placeOrder(3);

    await updateOrderStatus(order.id, "CANCELLED");
    await updateOrderStatus(order.id, "CANCELLED");

    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(10);
  });

  it("menolak mengaktifkan kembali pesanan yang dibatalkan", async () => {
    const order = await placeOrder(2);
    await updateOrderStatus(order.id, "CANCELLED");

    const result = await updateOrderStatus(order.id, "PROCESSING");
    expect(result.ok).toBe(false);

    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(10);
  });

  it("menolak status yang tidak dikenal", async () => {
    const order = await placeOrder(1);
    const result = await updateOrderStatus(order.id, "REFUNDED");
    expect(result.ok).toBe(false);
  });

  it("mengembalikan stok untuk semua baris pesanan", async () => {
    const result = await createOrder({
      items: [
        { variantId: fixture.a4.id, quantity: 2 },
        { variantId: fixture.a3.id, quantity: 4 },
      ],
      ...shipping,
    });
    expect(result.ok).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.ok ? result.orderNumber : "" },
    });
    await updateOrderStatus(order.id, "CANCELLED");

    const [a4, a3] = await Promise.all([
      prisma.variant.findUniqueOrThrow({ where: { id: fixture.a4.id } }),
      prisma.variant.findUniqueOrThrow({ where: { id: fixture.a3.id } }),
    ]);
    expect(a4.stock).toBe(3);
    expect(a3.stock).toBe(10);
  });
});
