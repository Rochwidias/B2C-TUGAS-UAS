// Daftar paket harga statis (docs/FRONTEND-ONLY.md): aplikasi berjalan tanpa
// backend dan tanpa database, jadi harga, kuota, estimasi, dan garansi
// didefinisikan langsung di sini. Halaman depan, customizer, dan detail order
// memakai modul ini — tidak ada fetch sama sekali.
import type { PackageOption } from '@/components/shop/types';

export const PACKAGES: PackageOption[] = [
  {
    key: 'satuan',
    name: 'Paket Satuan',
    price: 50000,
    quota: 1,
    eta: '2–4 jam kerja',
    guarantee: 'Revisi 2× dalam 3 hari',
    etaGuarantee: '2–4 jam kerja · Revisi 2× dalam 3 hari',
    description:
      'Satu poster untuk promo tunggal, cocok UMKM yang butuh desain cepat dan tarif terjangkau.',
    summary: '1 poster · ETA 2–4 jam kerja · Revisi 2× dalam 3 hari',
  },
  {
    key: 'hemat',
    name: 'Paket Hemat',
    price: 100000,
    quota: 3,
    eta: '1–3 hari kerja',
    guarantee: 'Revisi 3× dalam 7 hari (inkl. review editor)',
    etaGuarantee: '1–3 hari kerja · Revisi 3× dalam 7 hari (inkl. review editor)',
    description:
      'Tiga poster dalam satu paket untuk kampanye berkelanjutan, dilengkapi review editor sebelum produksi.',
    summary: '3 poster · ETA 1–3 hari kerja · Revisi 3× dalam 7 hari (inkl. review editor)',
  },
];

/** Cari paket untuk satu order: cocokkan kunci dulu, lalu nama tampilan. */
export function packageForOrder(
  packages: PackageOption[],
  order: { package_key?: string | null; package_name?: string | null },
): PackageOption | null {
  if (order.package_key) {
    const byKey = packages.find((pkg) => pkg.key === order.package_key);
    if (byKey) return byKey;
  }
  if (order.package_name) {
    const byName = packages.find((pkg) => pkg.name === order.package_name);
    if (byName) return byName;
  }
  return null;
}
