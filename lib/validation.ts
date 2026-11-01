import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter."),
    email: z.email("Format email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export const checkoutSchema = z.object({
  shipName: z.string().trim().min(2, "Nama penerima wajib diisi."),
  shipPhone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit.")
    .regex(/^[0-9+\-\s]+$/, "Nomor telepon hanya boleh angka."),
  shipAddress: z.string().trim().min(10, "Alamat minimal 10 karakter."),
  shipCity: z.string().trim().min(2, "Kota wajib diisi."),
  shipPostal: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit."),
  shipNote: z.string().trim().max(300).optional(),
});

export const customOrderSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter."),
  brief: z.string().trim().min(20, "Brief minimal 20 karakter."),
  style: z.string().trim().min(2, "Pilih gaya poster."),
  size: z.enum(["A4", "A3", "A2"]),
  referenceUrl: z.union([z.url("URL tidak valid."), z.literal("")]).optional(),
  budget: z
    .union([z.coerce.number().int().min(50000, "Budget minimal Rp 50.000."), z.literal("")])
    .optional(),
});

export const posterSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter."),
  description: z.string().trim().min(20, "Deskripsi minimal 20 karakter."),
  aiPrompt: z.string().trim().optional(),
  humanNote: z.string().trim().optional(),
  category: z.enum(["cyberpunk", "minimalis", "retro", "alam", "abstrak", "tipografi"]),
  imageUrl: z.string().trim().min(1, "Gambar poster wajib diisi."),
  basePrice: z.coerce.number().int().min(10000, "Harga minimal Rp 10.000."),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}
