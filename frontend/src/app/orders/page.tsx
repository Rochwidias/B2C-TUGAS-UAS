import type { Metadata } from 'next';
import { OrdersClient } from '@/components/shop/OrdersClient';

export const metadata: Metadata = {
  title: 'Lacak Pesanan',
  description:
    'Lacak posisi pesanan website Anda tanpa login. Cukup nomor pesanan (UK-ORD-XXXX) untuk melihat tahap pengerjaan, catatan developer, dan status serah terima.',
  alternates: { canonical: '/orders' },
};

// Rute /orders: shell server tipis (metadata) + UI interaktif di OrdersClient.
export default function OrdersPage() {
  return <OrdersClient />;
}
