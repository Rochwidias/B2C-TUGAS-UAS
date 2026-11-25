// Pambil kartu paket dari GET /api/packages (docs/REDESIGN.md §2).
// UI tidak boleh meng-hardcode harga, ETA, atau garansi, jadi semua angka dan
// teks transparansi pada halaman depan, customizer, dan detail order datang
// dari endpoint ini — dengan state error yang jujur bila endpoint gagal.
import type { PackageOption } from '@/components/shop/types';
import { API_BASE, API_BASE_SERVER } from '@/lib/api';

export interface PackagesResult {
  packages: PackageOption[];
  /** true bila daftar berasal dari backend yang valid. */
  ok: boolean;
  error: string | null;
}

/** Base URL yang benar untuk konteks pemanggilan: absolut di server. */
export function packagesBase(isServer: boolean): string {
  return isServer ? API_BASE_SERVER : API_BASE;
}

function normalize(item: unknown): PackageOption | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  const price = Number(raw.price);
  if (!Number.isFinite(price)) return null;
  const key = typeof raw.key === 'string' ? raw.key : typeof raw.id === 'string' ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name : null;
  if (!key || !name) return null;
  const quotaRaw = Number(raw.quota);
  return {
    key,
    name,
    price,
    quota: Number.isFinite(quotaRaw) && quotaRaw > 0 ? quotaRaw : 1,
    eta: typeof raw.eta === 'string' ? raw.eta : null,
    guarantee: typeof raw.guarantee === 'string' ? raw.guarantee : null,
    etaGuarantee: typeof raw.etaGuarantee === 'string' ? raw.etaGuarantee : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    summary: typeof raw.summary === 'string' ? raw.summary : null,
  };
}

/** Ambil kartu paket. Kegagalan tidak pernah mengembalikan harga karangan. */
export async function fetchPackages(base: string = API_BASE): Promise<PackagesResult> {
  try {
    const response = await fetch(`${base}/api/packages`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      return { packages: [], ok: false, error: `Server paket menjawab HTTP ${response.status}.` };
    }
    const payload = (await response.json()) as { packages?: unknown };
    const packages = (Array.isArray(payload.packages) ? payload.packages : [])
      .map(normalize)
      .filter((pkg): pkg is PackageOption => pkg !== null);
    if (packages.length === 0) {
      return { packages: [], ok: false, error: 'Daftar paket kosong atau tidak lengkap dari server.' };
    }
    return { packages, ok: true, error: null };
  } catch {
    return {
      packages: [],
      ok: false,
      error: 'Backend tidak terjangkau. Harga, estimasi, dan garansi tidak bisa dipastikan.',
    };
  }
}

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