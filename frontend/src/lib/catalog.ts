// Katalog poster statis (docs/FRONTEND-ONLY.md): aplikasi berjalan tanpa
// backend dan tanpa database, jadi daftar contoh poster didefinisikan langsung
// di sini. Halaman depan, customizer, lacak pesanan, dan sitemap memakai
// modul ini — tidak ada fetch sama sekali.
import type { Template } from '@/components/shop/types';

export const CATALOG_TEMPLATES: Template[] = [
  {
    id: 'artisan-cafe',
    name: 'Poster Promo Kuliner',
    category: 'kuliner',
    description:
      'Poster promo kedai kopi, rumah makan, dan jajanan — menonjolkan menu andalan, jam buka, dan tombol pesan WhatsApp.',
    emoji: '☕',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(139,92,246,0.4), rgba(109,40,217,0.4))',
    is_active: 1,
    recommendedPackage: 'hemat',
  },
  {
    id: 'creative-portfolio',
    name: 'Poster Kreator & Portofolio',
    category: 'kreator',
    description:
      'Poster pengumuman jasa dan karya kreator digital — cocok untuk promosi layanan, open slot, dan pameran portofolio.',
    emoji: '💼',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(59,75,216,0.4), rgba(39,53,168,0.4))',
    is_active: 1,
    recommendedPackage: 'satuan',
  },
  {
    id: 'dtc-store',
    name: 'Poster Toko Online',
    category: 'toko',
    description:
      'Poster diskon dan peluncuran produk toko online — menonjolkan produk unggulan, pengiriman, dan konfirmasi order kilat.',
    emoji: '🛍️',
    base_price: 50000,
    preview_gradient: 'linear-gradient(to top right, rgba(245,158,11,0.4), rgba(180,83,9,0.4))',
    is_active: 1,
    recommendedPackage: 'hemat',
  },
];

/** Cari satu template berdasarkan id; null bila id tidak ada di katalog. */
export function getTemplateById(id: string): Template | null {
  return CATALOG_TEMPLATES.find((template) => template.id === id) ?? null;
}
