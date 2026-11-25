import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Back-office tidak boleh masuk indeks mesin pencari; rute /api sudah
        // tidak ada (frontend-only, docs/FRONTEND-ONLY.md).
        disallow: ['/admin', '/admin/', '/orders/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}