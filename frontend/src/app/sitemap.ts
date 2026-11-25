import type { MetadataRoute } from 'next';
import { CATALOG_TEMPLATES } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Route statis didahulukan, lalu tiap template dapat halaman customizer-nya.
// Prioritas 0.9 untuk halaman utama karena itu pintu masuk utama layanan.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Katalog statis (docs/FRONTEND-ONLY.md) — sitemap tidak bergantung backend.
  const templateRoutes: MetadataRoute.Sitemap = CATALOG_TEMPLATES.map((template) => ({
    url: `${SITE_URL}/customizer/${template.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...templateRoutes];
}
