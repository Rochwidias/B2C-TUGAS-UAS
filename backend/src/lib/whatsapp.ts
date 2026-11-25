// Kanal WhatsApp: nomor kontak, tautan `wa.me`, dan pesan pesanan/serah terima
// (kontrak docs/WHATSAPP-FLOW.md). Nomor diambil dari env `WHATSAPP_NUMBER`;
// nilai bawaan adalah placeholder 6281234567890 yang wajib diganti di produksi
// (didokumentasikan di README + DEPLOY).

import type { OrderBrief } from '../types';

/** Placeholder bawaan bila `WHATSAPP_NUMBER` belum diset. */
const DEFAULT_NUMBER = '6281234567890';

/** Pesan serah terima umum untuk `whatsappSupportUrl` (footer halaman). */
export const SUPPORT_MESSAGE =
  'Halo Aether Creative! Saya mau menerima hasil poster pesanan saya dan menanyakan status pengerjaannya. Terima kasih.';

function onlyDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

/** Nomor WhatsApp aktif: env `WHATSAPP_NUMBER`, fallback placeholder. */
export function whatsappNumber(): string {
  return onlyDigits(process.env.WHATSAPP_NUMBER ?? '') || DEFAULT_NUMBER;
}

/** `https://wa.me/<nomor>` — opsional `text` di-encode sebagai query `?text=`. */
export function waMeUrl(text?: string): string {
  const base = `https://wa.me/${whatsappNumber()}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export interface ContactInfo {
  whatsappNumber: string;
  whatsappUrl: string;
  whatsappSupportUrl: string;
}

/** Body `GET /api/contact` (docs/WHATSAPP-FLOW.md). */
export function contactInfo(): ContactInfo {
  return {
    whatsappNumber: whatsappNumber(),
    whatsappUrl: waMeUrl(),
    whatsappSupportUrl: waMeUrl(SUPPORT_MESSAGE),
  };
}

export interface OrderMessageInput {
  orderNumber: string;
  packageName: string;
  eta: string;
  price: number;
  brief: OrderBrief;
  contact: { name: string; whatsapp: string; email: string };
}

const BRIEF_LABELS: Array<{ key: keyof OrderBrief; label: string }> = [
  { key: 'merekLokasi', label: 'Merek & lokasi' },
  { key: 'segmenTarget', label: 'Segmen target' },
  { key: 'suasanaMerek', label: 'Suasana merek' },
  { key: 'aksiUtama', label: 'Aksi utama' },
  { key: 'nadaRekaman', label: 'Nada rekaman' },
];

/**
 * Pesan yang mengisi `whatsappUrl` pada respons `POST /api/orders`: nomor order,
 * nama paket, ETA, dan brief — supaya customer tinggal menekan satu tombol untuk
 * konfirmasi di WhatsApp.
 */
export function orderMessage(input: OrderMessageInput): string {
  const lines = [
    'Halo Aether Creative! Saya baru saja memesan poster.',
    '',
    `No. order: ${input.orderNumber}`,
    `Paket: ${input.packageName}`,
    `Harga: Rp${input.price.toLocaleString('id-ID')}`,
    `Estimasi: ${input.eta}`,
    '',
    'Brief pesanan saya:',
  ];

  for (const { key, label } of BRIEF_LABELS) {
    const value = input.brief[key].trim();
    if (value) lines.push(`- ${label}: ${value}`);
  }

  lines.push('', `Nama: ${input.contact.name.trim()}`);
  lines.push(`WhatsApp: ${input.contact.whatsapp.trim()}`);
  if (input.contact.email.trim()) lines.push(`Email: ${input.contact.email.trim()}`);
  lines.push('', 'Mohon konfirmasi pesanan saya. Terima kasih!');

  return lines.join('\n');
}