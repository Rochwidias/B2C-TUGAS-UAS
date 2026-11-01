import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("tidak menyimpan password apa adanya", async () => {
    const hash = await hashPassword("rahasia12345");
    expect(hash).not.toContain("rahasia12345");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("menghasilkan salt berbeda untuk password yang sama", async () => {
    const a = await hashPassword("rahasia12345");
    const b = await hashPassword("rahasia12345");
    expect(a).not.toBe(b);
  });

  it("memverifikasi password benar dan menolak yang salah", async () => {
    const hash = await hashPassword("rahasia12345");
    await expect(verifyPassword("rahasia12345", hash)).resolves.toBe(true);
    await expect(verifyPassword("salah12345", hash)).resolves.toBe(false);
  });
});
