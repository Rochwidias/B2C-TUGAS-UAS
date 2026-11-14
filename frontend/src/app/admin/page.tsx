import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AdminBoard from '@/components/admin/AdminBoard';

export const metadata: Metadata = {
  title: 'Papan Pesanan — CraftAI Studio Back Office',
  description: 'Kanban pesanan CraftAI Studio untuk tim developer dan admin.',
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Suspense
        fallback={
          <p className="text-sm text-slate-400">Memuat papan pesanan…</p>
        }
      >
        <AdminBoard />
      </Suspense>
    </AdminShell>
  );
}