import type { Metadata } from 'next';
import AdminOrderDetail from '@/components/admin/AdminOrderDetail';

// Rute ini bergantung pada param request, sama seperti /customizer/[templateId],
// jadi tidak bisa masuk static shell. `instant = false` membuat Next men-render
// halaman saat diminta alih-alih menyisakan lubang Suspense yang tidak pernah
// terisi pada hard load.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shortId = id.slice(0, 8).toUpperCase();
  return {
    title: `Detail Order ${shortId}`,
    description:
      'Berkas order back office CraftAI Studio: brief customer, payload draft AI, form update status, dan penyerahan hasil produksi.',
    robots: { index: false, follow: false },
  };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminOrderDetail orderId={id} />;
}