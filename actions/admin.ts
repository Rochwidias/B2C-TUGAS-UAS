"use server";

import { revalidatePath } from "next/cache";

import { updateOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { firstError, posterSchema } from "@/lib/validation";
import { variantMatrix } from "@/lib/pricing";
import { slugify } from "@/lib/slug";

export type AdminState = { error?: string; success?: string };

function parsePosterForm(formData: FormData) {
  return posterSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    aiPrompt: formData.get("aiPrompt") ?? "",
    humanNote: formData.get("humanNote") ?? "",
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl"),
    basePrice: formData.get("basePrice"),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
}

async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "poster";
  let candidate = base;
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const clash = await prisma.poster.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === ignoreId) return candidate;
    candidate = `${base}-${attempt + 1}`;
  }
  return `${base}-${Date.now()}`;
}

export async function createPosterAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const parsed = parsePosterForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const data = parsed.data;
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stockInput = stockRaw === "" ? 10 : Number(stockRaw);
  const stock = Number.isFinite(stockInput) && stockInput >= 0 ? Math.trunc(stockInput) : 10;

  await prisma.poster.create({
    data: {
      slug: await uniqueSlug(data.title),
      title: data.title,
      description: data.description,
      aiPrompt: data.aiPrompt || null,
      humanNote: data.humanNote || null,
      category: data.category,
      imageUrl: data.imageUrl,
      basePrice: data.basePrice,
      featured: data.featured,
      active: data.active,
      variants: { create: variantMatrix(data.basePrice, stock) },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: "Poster baru dibuat beserta 9 variannya." };
}

export async function updatePosterAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Poster tidak ditemukan." };

  const parsed = parsePosterForm(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const poster = await prisma.poster.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!poster) return { error: "Poster tidak ditemukan." };

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.poster.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        aiPrompt: data.aiPrompt || null,
        humanNote: data.humanNote || null,
        category: data.category,
        imageUrl: data.imageUrl,
        basePrice: data.basePrice,
        featured: data.featured,
        active: data.active,
      },
    });

    // Harga varian mengikuti harga dasar; stok yang sudah ada tidak diubah.
    if (poster.basePrice !== data.basePrice) {
      for (const variant of poster.variants) {
        await tx.variant.update({
          where: { id: variant.id },
          data: { price: variantMatrix(data.basePrice).find(
            (row) => row.size === variant.size && row.frame === variant.frame,
          )!.price },
        });
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${poster.slug}`);
  return { success: "Perubahan disimpan." };
}

export async function togglePosterAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const poster = await prisma.poster.findUnique({ where: { id } });
  if (!poster) return;

  await prisma.poster.update({
    where: { id },
    data: { active: !poster.active },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${poster.slug}`);
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  if (!order) return;

  await updateOrderStatus(id, status);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/account/orders/${order.orderNumber}`);
}

export async function updateCustomOrderAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const quotedRaw = String(formData.get("quotedPrice") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  const allowed = ["REQUESTED", "QUOTED", "IN_PROGRESS", "REVIEW", "COMPLETED", "REJECTED"];
  if (!id || !allowed.includes(status)) return;

  const quotedPrice = quotedRaw ? Math.trunc(Number(quotedRaw)) : null;
  if (quotedPrice !== null && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) return;

  await prisma.customOrder.update({
    where: { id },
    data: { status, quotedPrice, adminNote: adminNote || null },
  });

  revalidatePath("/admin/custom-orders");
  revalidatePath("/custom-order");
}
