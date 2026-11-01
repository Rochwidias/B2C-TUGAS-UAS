import { describe, expect, it } from "vitest";

import { formatIDR } from "@/lib/format";
import { clampQuantity, calcShipping, calcTotals } from "@/lib/pricing";
import { orderNumber } from "@/lib/order-number";
import { slugify } from "@/lib/slug";

describe("formatIDR", () => {
  it("memformat rupiah dengan pemisah ribuan Indonesia", () => {
    expect(formatIDR(125000)).toBe("Rp 125.000");
    expect(formatIDR(0)).toBe("Rp 0");
  });
});

describe("calcShipping", () => {
  it("menagih ongkir di bawah batas gratis", () => {
    expect(calcShipping(249999)).toBe(20000);
  });

  it("gratis ongkir mulai Rp 250.000", () => {
    expect(calcShipping(250000)).toBe(0);
    expect(calcShipping(500000)).toBe(0);
  });

  it("tidak menagih ongkir untuk keranjang kosong", () => {
    expect(calcShipping(0)).toBe(0);
  });
});

describe("calcTotals", () => {
  it("menghitung subtotal, ongkir dan total", () => {
    expect(calcTotals([{ unitPrice: 100000, quantity: 2 }])).toEqual({
      subtotal: 200000,
      shippingCost: 20000,
      total: 220000,
    });
  });

  it("mengembalikan nol untuk keranjang kosong", () => {
    expect(calcTotals([])).toEqual({ subtotal: 0, shippingCost: 0, total: 0 });
  });
});

describe("clampQuantity", () => {
  it("membatasi jumlah ke stok yang tersedia", () => {
    expect(clampQuantity(99, 5)).toBe(5);
    expect(clampQuantity(-3, 5)).toBe(1);
    expect(clampQuantity(2, 5)).toBe(2);
  });

  it("mengembalikan 0 saat stok habis", () => {
    expect(clampQuantity(1, 0)).toBe(0);
  });
});

describe("orderNumber", () => {
  it("mengikuti format PS-YYYYMMDD-XXXX", () => {
    expect(orderNumber(new Date(2026, 9, 29))).toMatch(/^PS-20261029-[0-9A-F]{4}$/);
  });
});

describe("slugify", () => {
  it("membersihkan karakter non alfanumerik", () => {
    expect(slugify("Cyberpunk Sunset ✦ A3")).toBe("cyberpunk-sunset-a3");
    expect(slugify("  Ruang   Sunyi  ")).toBe("ruang-sunyi");
  });
});
