"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { customOrderSchema, firstError } from "@/lib/validation";

export type CustomOrderState = { error?: string; success?: string };

export async function createCustomOrderAction(
  _prev: CustomOrderState,
  formData: FormData,
): Promise<CustomOrderState> {
  const session = await getSession();
  if (!session) return { error: "Masuk terlebih dahulu untuk mengirim brief." };

  const parsed = customOrderSchema.safeParse({
    title: formData.get("title"),
    brief: formData.get("brief"),
    style: formData.get("style"),
    size: formData.get("size"),
    referenceUrl: formData.get("referenceUrl") ?? "",
    budget: formData.get("budget") ?? "",
  });

  if (!parsed.success) return { error: firstError(parsed.error) };

  const { title, brief, style, size, referenceUrl, budget } = parsed.data;

  await prisma.customOrder.create({
    data: {
      userId: session.id,
      title,
      brief,
      style,
      size,
      referenceUrl: referenceUrl || null,
      budget: typeof budget === "number" ? budget : null,
    },
  });

  revalidatePath("/custom-order");
  return { success: "Brief terkirim. Tim kami akan mengirim penawaran harga." };
}
