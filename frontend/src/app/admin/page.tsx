import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AdminBoard from '@/components/admin/AdminBoard';

export const metadata: Metadata = {
  title: 'Papan Pesanan',
  description:
    'Kanban pesanan Aether Creative untuk tim editor dan admin: statistik order, pencarian, filter status, sisa kuota paket, dan pemindahan tahap produksi.',
  // Panel internal: jangan pernah masuk indeks mesin telusur.
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Suspense
        fallback={
          <p className="border border-rule bg-surface px-3 py-2 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
            Memuat papan pesanan…
          </p>
        }
      >
        <AdminBoard />
      </Suspense>
    </AdminShell>
  );
}
