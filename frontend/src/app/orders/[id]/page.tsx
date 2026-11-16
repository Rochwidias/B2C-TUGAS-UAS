import type { Metadata } from 'next';
import { OrderDetailClient } from '@/components/shop/OrderDetailClient';

// Judul dinamis mengikuti nomor order bila diketahui; shell server ini memberi
// metadata dasar, sedangkan isi (data order) diambil di klien via /api/orders/:id.
export const metadata: Metadata = {
  title: 'Detail Pesanan',
  description:
    'Lembar detail pesanan website: peta pengerjaan, catatan developer, tautan live, dan unduhan source code. Bisa dilihat tanpa login memakai nomor pesanan.',
  alternates: { canonical: '/orders' },
};

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
