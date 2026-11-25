// Sumber kebenaran TUNGGAL harga, kuota, ETA, dan garansi (docs/REDESIGN.md §2).
// UI tidak boleh meng-hardcode angka ini; semuanya lewat GET /api/packages.

import type { PackageOption } from '../types';

interface PackageSeed {
  key: string;
  name: string;
  price: number;
  quota: number;
  eta: string;
  guarantee: string;
  description: string;
}

const SEEDS: PackageSeed[] = [
  {
    key: 'satuan',
    name: 'Satuan',
    price: 50000,
    quota: 1,
    eta: '2–4 jam kerja',
    guarantee: 'Revisi 2× dalam 3 hari',
    description: '1 poster, cocok untuk sekali unggah/promo dadakan.',
  },
  {
    key: 'hemat',
    name: 'Paket Hemat',
    price: 100000,
    quota: 3,
    eta: '1–3 hari kerja',
    guarantee: 'Revisi 3× dalam 7 hari, termasuk review editor',
    description: '3 poster dalam satu order (kuota), dikerjakan berurutan + review editor.',
  },
];

export const PACKAGES: PackageOption[] = SEEDS.map((seed) => ({
  ...seed,
  etaGuarantee: `${seed.eta} · ${seed.guarantee}`,
}));

export const PACKAGE_KEYS: string[] = PACKAGES.map((pkg) => pkg.key);

/** Cari paket berdasarkan key; `null` bila bukan salah satu dari §2. */
export function findPackage(key: string): PackageOption | null {
  return PACKAGES.find((pkg) => pkg.key === key) ?? null;
}

/**
 * Paket yang direkomendasikan per kategori template (peta statis §3):
 * kuliner & toko butuh unggahan rutin, kreator pesan sesuai kebutuhan.
 */
export const RECOMMENDED_PACKAGE: Record<string, string> = {
  kuliner: 'hemat',
  kreator: 'satuan',
  toko: 'hemat',
};

export function recommendedPackageFor(category: string): string | null {
  return RECOMMENDED_PACKAGE[category] ?? null;
}