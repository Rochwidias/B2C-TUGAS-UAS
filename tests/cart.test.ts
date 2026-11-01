import { describe, expect, it } from "vitest";

import { cartCount, cartReducer, readCart, type CartItem } from "@/lib/cart";

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: "var-1",
    posterId: "poster-1",
    slug: "cyberpunk-sunset",
    title: "Cyberpunk Sunset",
    imageUrl: "/posters/cyberpunk-sunset.svg",
    size: "A3",
    frame: "black",
    unitPrice: 261000,
    quantity: 1,
    stock: 5,
    ...overrides,
  };
}

describe("cartReducer", () => {
  it("menambahkan baris baru", () => {
    const next = cartReducer([], { type: "add", item: item() });
    expect(next).toHaveLength(1);
    expect(next[0].quantity).toBe(1);
  });

  it("menggabungkan varian yang sama, bukan menambah baris", () => {
    const next = cartReducer([item({ quantity: 2 })], {
      type: "add",
      item: item(),
    });
    expect(next).toHaveLength(1);
    expect(next[0].quantity).toBe(3);
  });

  it("tidak melebihi stok saat menambah", () => {
    const next = cartReducer([item({ quantity: 4, stock: 5 })], {
      type: "add",
      item: item({ quantity: 3, stock: 5 }),
    });
    expect(next[0].quantity).toBe(5);
  });

  it("mengabaikan penambahan saat stok habis", () => {
    const next = cartReducer([], { type: "add", item: item({ stock: 0 }) });
    expect(next).toHaveLength(0);
  });

  it("membatasi setQty ke rentang 1..stok", () => {
    expect(
      cartReducer([item({ stock: 3 })], {
        type: "setQty",
        variantId: "var-1",
        quantity: 9,
      })[0].quantity,
    ).toBe(3);
  });

  it("menghapus baris ketika jumlah diset 0", () => {
    const next = cartReducer([item()], {
      type: "setQty",
      variantId: "var-1",
      quantity: 0,
    });
    expect(next).toHaveLength(0);
  });

  it("menghapus baris berdasarkan variantId", () => {
    expect(cartReducer([item()], { type: "remove", variantId: "var-1" })).toEqual([]);
  });

  it("mengosongkan keranjang", () => {
    expect(cartReducer([item()], { type: "clear" })).toEqual([]);
  });
});

describe("cartCount", () => {
  it("menjumlahkan seluruh quantity", () => {
    expect(cartCount([item({ quantity: 2 }), item({ variantId: "var-2", quantity: 3 })])).toBe(5);
  });
});

describe("readCart", () => {
  it("mengembalikan array kosong untuk data rusak", () => {
    expect(readCart("bukan json")).toEqual([]);
    expect(readCart("null")).toEqual([]);
    expect(readCart(null)).toEqual([]);
  });

  it("menyaring entri yang tidak lengkap", () => {
    const raw = JSON.stringify([item(), { variantId: 1 }]);
    expect(readCart(raw)).toHaveLength(1);
  });

  it("menyaring entri dengan field wajib kosong atau jumlah tidak masuk akal", () => {
    const raw = JSON.stringify([
      item({ quantity: 99, stock: 3 }),
      item({ variantId: "var-2", slug: undefined as unknown as string }),
      item({ variantId: "var-3", quantity: -2 }),
    ]);

    const result = readCart(raw);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });
});
