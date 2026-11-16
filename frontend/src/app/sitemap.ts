import type { MetadataRoute } from 'next';

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

  let templateRoutes: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${API_BASE}/api/templates`, { cache: 'no-store' });
    if (response.ok) {
      const payload = (await response.json()) as { templates?: { id: string }[] };
      templateRoutes = (payload.templates ?? []).map((template) => ({
        url: `${SITE_URL}/customizer/${template.id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Backend mati / belum siap saat build: sitemap tetap valid tanpa rute template.
    templateRoutes = [];
  }

  return [...staticRoutes, ...templateRoutes];
}