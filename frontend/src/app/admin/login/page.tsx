import type { Metadata } from 'next';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata: Metadata = {
  title: 'Masuk Back Office',
  description:
    'Formulir akses admin CraftAI Studio: kelola papan pesanan, brief customer, dan penyerahan hasil produksi.',
  // Halaman login tidak boleh masuk indeks mesin telusur.
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}