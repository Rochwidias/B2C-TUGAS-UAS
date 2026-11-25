// Katalog poster mandiri: daftar bawaan identik dengan seed di backend
// (backend/src/lib/db.ts — SEED_TEMPLATES), plus fetcher yang menempa backend
// dengan batas waktu. Halaman depan, customizer, dan sitemap memakai modul ini
// supaya build tetap menghasilkan katalog tiga kartu walaupun env
// BACKEND_ORIGIN kosong dan backend tidak terjangkau saat build/SSR.
//
// Perbedaan penting dengan versi lama: fetchCatalogResult TIDAK menelan
// kegagalan. Pemanggil tahu apakah data berasal dari server atau dari daftar
// bawaan, sehingga UI bisa menampilkan state error yang jujur + tombol coba
// lagi (docs/REDESIGN.md §12), sementara daftar bawaan hanya dipakai sebagai
// isi awal yang belum pernah termuat.
import type { Template } from '@/components/shop/types';
import { API_BASE } from '@/lib/api';

// Isi wajib sama dengan SEED_TEMPLATES di backend/src/lib/db.ts (nama, kategori,
// deskripsi, gradasi, dan id template — id lama dipertahankan backend supaya FK
// order lama tidak menggantung). Backend adalah sumber kebenaran katalog.
export const FALLBACK_TEMPLATES: Template[] = [
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

/** Batas tunggu backend (ms): di prod tanpa backend, katalog tidak boleh
 *  menahan render — lewat batas ini langsung jatuh ke data bawaan. */
const CATALOG_TIMEOUT_MS = 2500;

export interface CatalogResult {
  templates: Template[];
  /** true bila daftar berasal dari backend; false bila daftar bawaan. */
  ok: boolean;
  error: string | null;
}

function activeOnly(templates: Template[]): Template[] {
  return templates.filter((template) => template.is_active !== 0);
}

/**
 * Ambil daftar template dari backend. Kegagalan (timeout, jaringan, status
 * non-2xx, daftar kosong) tetap dilaporkan lewat `ok: false` + pesan, dengan
 * `templates` berisi daftar bawaan supaya halaman tetap punya isi awal.
 */
export async function fetchCatalogResult(init?: RequestInit): Promise<CatalogResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}/api/templates`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        templates: FALLBACK_TEMPLATES,
        ok: false,
        error: `Server katalog menjawab HTTP ${response.status}.`,
      };
    }
    const payload = (await response.json()) as { templates?: Template[] };
    const templates = activeOnly(payload.templates ?? []);
    if (templates.length === 0) {
      return { templates: FALLBACK_TEMPLATES, ok: false, error: 'Katalog masih kosong di server.' };
    }
    return { templates, ok: true, error: null };
  } catch {
    return {
      templates: FALLBACK_TEMPLATES,
      ok: false,
      error: 'Backend tidak terjangkau. Periksa apakah layanan API sudah berjalan.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Versi ringkas: hanya daftarnya. Dipakai sitemap, customizer, dan halaman
 *  lacak yang tidak perlu menampilkan state error katalog. */
export async function fetchCatalog(init?: RequestInit): Promise<Template[]> {
  return (await fetchCatalogResult(init)).templates;
}