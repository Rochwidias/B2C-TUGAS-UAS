import type { MetadataRoute } from 'next';
import { FALLBACK_TEMPLATES, fetchCatalog } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Base URL backend (lihat src/lib/api.ts): SSR fetch harus absolut, jadi
// NEXT_PUBLIC_API_URL lalu BACKEND_ORIGIN (server-side di Vercel), default lokal.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_ORIGIN ?? 'http://localhost:4000';

// Route statis didahulukan, lalu tiap template dapat halaman customizer-nya.
// Prioritas 0.9 untuk halaman utama karena itu pintu masuk utama layanan.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Daftar bawaan dulu, supaya sitemap selalu memuat ketiga halaman customizer
  // walau backend tidak terjangkau. Lalu backend (fetch mutlak di SSR) bila hidup,
  // lalu fetchCatalog yang jatuh ke data bawaan bila backend mati. Semua
  // kegagalan fetch ditelan: sitemap tidak boleh ikut tumbang saat build.
  const ids: string[] = [];
  const addId = (id: string | undefined): void => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  FALLBACK_TEMPLATES.forEach((template) => addId(template.id));

  try {
    const response = await fetch(`${API_BASE}/api/templates`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (response.ok) {
      const payload = (await response.json()) as { templates?: { id: string }[] };
      (payload.templates ?? []).forEach((template) => addId(template.id));
    }
  } catch {
    // Backend mati / belum siap saat build: daftar bawaan tetap dipakai.
  }

  (await fetchCatalog()).forEach((template) => addId(template.id));

  const templateRoutes: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/customizer/${id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...templateRoutes];
}