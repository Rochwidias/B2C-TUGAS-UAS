import type { Metadata } from 'next';
import { OrderDetailClient } from '@/components/shop/OrderDetailClient';

// Judul dinamis mengikuti nomor order bila diketahui; shell server ini memberi
// metadata dasar, sedangkan isi (data order) diambil di klien via /api/orders/:id.
export const metadata: Metadata = {
  title: 'Detail Pesanan',
  description:
    'Lembar detail pesanan poster: peta pengerjaan 5 tahap, estimasi dan garansi sesuai paket, daftar draft dalam kuota, serta tombol minta revisi dan tambah brief. Bisa dilihat tanpa login.',
  alternates: { canonical: '/orders' },
};

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
