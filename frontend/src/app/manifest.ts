import type { MetadataRoute } from 'next';

// Manifest membuat aplikasi bisa dipasang di layar utama ponsel (PWA ringan).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CraftAI Studio',
    short_name: 'CraftAI',
    description:
      'Kustomisasi template website dengan AI: pilih template, isi brief, draft dibuat otomatis, developer mengeksekusi sampai live.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F0E6',
    theme_color: '#C63C1C',
    lang: 'id',
    dir: 'ltr',
    categories: ['business', 'productivity', 'design'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}