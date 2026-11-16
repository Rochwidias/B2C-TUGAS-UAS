// Katalog template mandiri: daftar bawaan identik dengan seed di backend
// (backend/src/lib/db.ts — SEED_TEMPLATES), plus fetcher yang menempa backend
// dengan batas waktu. Halaman depan, customizer, dan sitemap memakai modul ini
// supaya build di Vercel tetap menghasilkan katalog 3 kartu walaupun env
// BACKEND_ORIGIN kosong dan backend tidak terjangkau saat build/SSR.
import type { Template } from '@/components/shop/types';
import { API_BASE } from '@/lib/api';

// Isi wajib sama persis dengan SEED_TEMPLATES di backend/src/lib/db.ts
// (kolom id, name, category, description, emoji, base_price, preview_gradient,
// is_active) — backend adalah sumber kebenaran untuk data katalog.
export const FALLBACK_TEMPLATES: Template[] = [
  {
    id: 'artisan-cafe',
    name: 'Artisan Cafe & Resto',
    category: 'fnb',
    description: 'Cocok untuk kedai kopi, bistro, atau rumah makan modern lengkap dengan menu catalog dan booking meja.',
    emoji: '☕',
    base_price: 250000,
    preview_gradient: 'linear-gradient(to top right, rgba(146,64,14,0.4), rgba(69,26,3,0.4))',
    is_active: 1,
  },
  {
    id: 'creative-portfolio',
    name: 'Modern Creative Portfolio',
    category: 'portfolio',
    description: 'Template showcase karya desainer, fotografer, software engineer, atau konsultan digital.',
    emoji: '💼',
    base_price: 300000,
    preview_gradient: 'linear-gradient(to top right, rgba(30,64,175,0.4), rgba(30,27,75,0.4))',
    is_active: 1,
  },
  {
    id: 'dtc-store',
    name: 'Direct-to-Consumer Store',
    category: 'shop',
    description: 'Landing page produk unggulan dengan integrasi checkout WhatsApp otomatis.',
    emoji: '🛍️',
    base_price: 350000,
    preview_gradient: 'linear-gradient(to top right, rgba(6,78,59,0.4), rgba(19,78,74,0.4))',
    is_active: 1,
  },
];

/** Batas tunggu backend (ms): di prod tanpa backend, katalog tidak boleh
 *  menahan render — lewat batas ini langsung jatuh ke data bawaan. */
const CATALOG_TIMEOUT_MS = 2500;

function activeOnly(templates: Template[]): Template[] {
  return templates.filter((template) => template.is_active !== 0);
}

/**
 * Ambil daftar template dari backend. Segala kegagalan (timeout, jaringan,
 * status non-2xx, body bukan JSON, daftar kosong) mengembalikan
 * FALLBACK_TEMPLATES — pemanggil tidak pernah mendapat daftar kosong.
 */
export async function fetchCatalog(init?: RequestInit): Promise<Template[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}/api/templates`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return FALLBACK_TEMPLATES;
    const payload = (await response.json()) as { templates?: Template[] };
    const templates = activeOnly(payload.templates ?? []);
    return templates.length > 0 ? templates : FALLBACK_TEMPLATES;
  } catch {
    return FALLBACK_TEMPLATES;
  } finally {
    clearTimeout(timer);
  }
}