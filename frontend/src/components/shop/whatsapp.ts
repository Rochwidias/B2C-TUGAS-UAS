'use client';

// Sumber tunggal nomor WhatsApp resmi (docs/FRONTEND-ONLY.md): env
// NEXT_PUBLIC_WHATSAPP_NUMBER dengan placeholder bawaan. Statis — tidak ada
// fetch; hook dan helper dipertahankan agar pemakai tidak banyak berubah.

import type { ContactInfo } from './types';

/** Nomor WhatsApp resmi studio: env publik, dengan nilai contoh bila kosong. */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281234567890';

/** Kontak WhatsApp resmi — konstanta statis, sama bentuknya dengan respons lama. */
export const CONTACT: ContactInfo = {
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  whatsappSupportUrl: null,
};

/** Ganti/isi parameter `text` pada tautan wa.me agar pesannya terbuka terisi. */
export function withText(url: string, text: string): string {
  const message = text.trim();
  if (!message) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('text', message);
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}text=${encodeURIComponent(message)}`;
  }
}

/** Kontak resmi: tetap berupa hook supaya pemakai lama tidak banyak berubah. */
export function useContact(): ContactInfo {
  return CONTACT;
}

/**
 * Tautan chat dengan pesan terisi: nomor order (bila ada) plus panduan tahap.
 * Bila tombol sudah memiliki pesan pendukung di `whatsappSupportUrl`, pesan
 * tersebut ditimpa supaya tidak ada dua parameter `text` dalam satu URL.
 */
export function contactChatUrl(
  contact: ContactInfo | null | undefined,
  orderNumber?: string | null,
  hint?: string | null,
): string | null {
  const base = (contact?.whatsappSupportUrl ?? '').trim() || (contact?.whatsappUrl ?? '').trim();
  if (!base) return null;

  const parts: string[] = ['Halo Aether Creative,'];
  const number = (orderNumber ?? '').trim();
  if (number) parts.push(`saya ingin menanyakan pesanan ${number}.`);
  const stage = (hint ?? '').trim();
  if (stage) parts.push(stage);

  return parts.length > 1 ? withText(base, parts.join(' ')) : base;
}
