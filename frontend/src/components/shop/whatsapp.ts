'use client';

// Sumber tunggal nomor WhatsApp resmi = GET /api/contact (env WHATSAPP_NUMBER,
// docs/WHATSAPP-FLOW.md §Baru). Hasilnya di-cache di modul karena nilai yang
// dikirim server jarang berubah dan beberapa halaman memakainya berulang.

import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';
import type { ContactInfo } from './types';

let cached: ContactInfo | null | undefined;
let inflight: Promise<ContactInfo | null> | null = null;

/** Kontak WhatsApp cadangan (demo/simulasi) bila GET /api/contact tidak tersedia.
 *  Nomor dan tautan wa.me bersifat contoh; footer mencatat bahwa demo ini simulasi.
 */
export const FALLBACK_CONTACT: ContactInfo = {
  whatsappNumber: '6281234567890',
  whatsappUrl: 'https://wa.me/6281234567890',
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

/** Ambil kontak resmi; cadangan simulasi bila endpoint belum ada atau jaringan gagal. */
export async function fetchContact(): Promise<ContactInfo | null> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contact`, { cache: 'no-store' });
      if (!res.ok) return FALLBACK_CONTACT;
      const body = (await res.json().catch(() => null)) as
        | (ContactInfo & { data?: ContactInfo })
        | null;
      const info = body?.data ?? body ?? null;
      if (!info || typeof info.whatsappUrl !== 'string' || !info.whatsappUrl.trim()) return FALLBACK_CONTACT;
      cached = info;
      return info;
    } catch {
      return FALLBACK_CONTACT;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function useContact(): ContactInfo | null {
  const [contact, setContact] = useState<ContactInfo | null>(() => cached ?? null);

  useEffect(() => {
    let alive = true;
    void fetchContact().then((info) => {
      if (alive) setContact(info);
    });
    return () => {
      alive = false;
    };
  }, []);

  return contact;
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