import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createOrder } from "@/lib/orders";
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

describe("createOrder", () => {
  it("menolak keranjang kosong", async () => {
    const result = await createOrder({ items: [], ...shipping });
    expect(result.ok).toBe(false);
  });

  it("memakai harga dari database, bukan harga kiriman client", async () => {
    const result = await createOrder({
      items: [
        { variantId: fixture.a4.id, quantity: 2, unitPrice: 1 } as unknown as {
          variantId: string;
          quantity: number;
        },
      ],
      ...shipping,
    });

    expect(result.ok).toBe(true);
    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.ok ? result.orderNumber : "" },
      include: { items: true },
    });
    expect(order.items[0].unitPrice).toBe(100000);
    expect(order.subtotal).toBe(200000);
    expect(order.shippingCost).toBe(20000);
    expect(order.total).toBe(220000);
  });

  it("menolak jumlah melebihi stok tanpa mengubah stok", async () => {
    const result = await createOrder({
      items: [{ variantId: fixture.a4.id, quantity: 4 }],
      ...shipping,
    });

    expect(result.ok).toBe(false);
    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a4.id },
    });
    expect(variant.stock).toBe(3);
  });

  it("menolak varian yang tidak ada", async () => {
    const result = await createOrder({
      items: [{ variantId: "tidak-ada", quantity: 1 }],
      ...shipping,
    });
    expect(result.ok).toBe(false);
  });

  it("menolak poster yang sudah dinonaktifkan", async () => {
    const result = await createOrder({
      items: [{ variantId: fixture.hiddenVariant.id, quantity: 1 }],
      ...shipping,
    });
    expect(result.ok).toBe(false);
  });

  it("mengurangi stok tepat sebesar jumlah yang dibeli", async () => {
    const result = await createOrder({
      items: [{ variantId: fixture.a3.id, quantity: 3 }],
      ...shipping,
    });

    expect(result.ok).toBe(true);
    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(7);
  });

  it("menggabungkan baris dengan varian sama", async () => {
    const result = await createOrder({
      items: [
        { variantId: fixture.a4.id, quantity: 1 },
        { variantId: fixture.a4.id, quantity: 2 },
      ],
      ...shipping,
    });

    expect(result.ok).toBe(true);
    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a4.id },
    });
    expect(variant.stock).toBe(0);
  });

  it("tidak membuat pesanan ganda untuk idempotency key yang sama", async () => {
    const payload = {
      items: [{ variantId: fixture.a3.id, quantity: 2 }],
      ...shipping,
      idempotencyKey: "klik-dobel-001",
    };

    const first = await createOrder(payload);
    const second = await createOrder(payload);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.ok && first.ok && second.orderNumber).toBe(
      first.ok ? first.orderNumber : "",
    );

    const count = await prisma.order.count();
    expect(count).toBe(1);

    const variant = await prisma.variant.findUniqueOrThrow({
      where: { id: fixture.a3.id },
    });
    expect(variant.stock).toBe(8);
  });

  it("menolak alamat yang tidak valid", async () => {
    const result = await createOrder({
      items: [{ variantId: fixture.a4.id, quantity: 1 }],
      ...shipping,
      shipPostal: "123",
    });
    expect(result.ok).toBe(false);
  });
});
