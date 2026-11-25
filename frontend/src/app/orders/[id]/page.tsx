import type { Metadata } from 'next';
import { OrderDetailClient } from '@/components/shop/OrderDetailClient';

// Shell server ini memberi metadata dasar, sedangkan data order dimuat klien
// dari store lokal (frontend-only, docs/FRONTEND-ONLY.md).
export const metadata: Metadata = {
  title: 'Detail Pesanan',
  description:
    'Lembar detail pesanan poster: peta pengerjaan 5 tahap, estimasi dan garansi sesuai paket, daftar poster dalam kuota, serta tombol minta revisi dan tambah brief. Bisa dilihat tanpa login.',
  alternates: { canonical: '/orders' },
};

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
