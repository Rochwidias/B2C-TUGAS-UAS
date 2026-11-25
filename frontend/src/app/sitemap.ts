import type { MetadataRoute } from 'next';
import { FALLBACK_TEMPLATES, fetchCatalog } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Route statis didahulukan, lalu tiap template dapat halaman customizer-nya.
// Prioritas 0.9 untuk halaman utama karena itu pintu masuk utama layanan.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Daftar bawaan dari katalog (tidak ada backend), sitemap tidak boleh
  // ikut tumbang saat build meski backend tidak terjangkau.
  const ids: string[] = [];
  const addId = (id: string | undefined): void => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  FALLBACK_TEMPLATES.forEach((template) => addId(template.id));

  (await fetchCatalog()).forEach((template) => addId(template.id));

  const templateRoutes: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/customizer/${id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...templateRoutes];
}