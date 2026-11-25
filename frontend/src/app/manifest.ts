import type { MetadataRoute } from 'next';

// Manifest membuat aplikasi bisa dipasang di layar utama ponsel (PWA ringan).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aether Creative',
    short_name: 'Aether',
    description:
      'Platform pembuatan poster untuk UMKM: brief merek, editor validasi, hasil siap pakai.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F5FB',
    theme_color: '#7C3AED',
    lang: 'id',
    dir: 'ltr',
    categories: ['business', 'productivity', 'design'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}