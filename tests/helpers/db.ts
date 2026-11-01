import { execSync } from "node:child_process";

import { prisma } from "@/lib/prisma";

export const TEST_DATABASE_URL = "file:./test.db";

export async function prepareTestDb(): Promise<void> {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}

export async function resetTestDb(): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customOrder.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.poster.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedFixture() {
  const poster = await prisma.poster.create({
    data: {
      slug: "poster-uji",
      title: "Poster Uji",
      description: "Poster untuk keperluan pengujian otomatis.",
      category: "abstrak",
      imageUrl: "/posters/kromatik-ii.svg",
      basePrice: 100000,
      variants: {
        create: [
          { size: "A4", frame: "none", price: 100000, stock: 3 },
          { size: "A3", frame: "black", price: 250000, stock: 10 },
        ],
      },
    },
    include: { variants: true },
  });

  const hidden = await prisma.poster.create({
    data: {
      slug: "poster-nonaktif",
      title: "Poster Nonaktif",
      description: "Poster yang sudah tidak dijual.",
      category: "abstrak",
      imageUrl: "/posters/kromatik-ii.svg",
      basePrice: 90000,
      active: false,
      variants: { create: [{ size: "A4", frame: "none", price: 90000, stock: 5 }] },
    },
    include: { variants: true },
  });

  return {
    poster,
    hidden,
    a4: poster.variants.find((variant) => variant.size === "A4")!,
    a3: poster.variants.find((variant) => variant.size === "A3")!,
    hiddenVariant: hidden.variants[0],
  };
}

export const shipping = {
  shipName: "Raka Demo",
  shipPhone: "081234567890",
  shipAddress: "Jl. Kaliurang Km 5 No. 12",
  shipCity: "Yogyakarta",
  shipPostal: "55281",
};
