import type { Metadata } from 'next';
import { CustomizerClient } from '@/components/shop/CustomizerClient';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';
import { type Template } from '@/components/shop/types';
import { API_BASE_SERVER } from '@/lib/api';
import { FALLBACK_TEMPLATES, fetchCatalog } from '@/lib/catalog';

/**
 * Cari satu template: data terbaru dari backend bila terjangkau, lalu jatuh ke
 * daftar bawaan. Tidak pernah melempar, sehingga build/SSR tanpa env
 * BACKEND_ORIGIN tetap menghasilkan halaman valid.
 *
 * Fungsi ini di-cache ("use cache") karena generateMetadata() ikut
 * prerender saat build: fetch tanpa cache dianggap data runtime oleh
 * cacheComponents dan akan mematikan build.
 */
async function findTemplate(templateId: string): Promise<Template | null> {
  'use cache';
  try {
    const response = await fetch(`${API_BASE_SERVER}/api/templates`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (response.ok) {
      const payload = (await response.json()) as { templates?: Template[] };
      const found = (payload.templates ?? []).find((template) => template.id === templateId);
      if (found) return found;
    }
  } catch {
    // Backend tidak terjangkau: lanjut ke daftar bawaan.
  }
  // fetchCatalog jatuh ke data bawaan bila backend mati, lalu dicocokkan lagi
  // dengan daftar bawaan agar id yang tidak dikenal tetap null.
  const catalog = await fetchCatalog().catch(() => FALLBACK_TEMPLATES);
  return (
    catalog.find((template) => template.id === templateId) ??
    FALLBACK_TEMPLATES.find((template) => template.id === templateId) ??
    null
  );
}

// Rute ini bergantung pada param request, tidak bisa masuk static shell.
export const instant = false;

// Slug dari daftar bawaan: build Vercel tidak menunggu backend dan tetap
// mencetak halaman untuk ketiga template.
export function generateStaticParams(): { templateId: string }[] {
  return FALLBACK_TEMPLATES.map((template) => ({ templateId: template.id }));
}

// Judul/metadata mengikuti nama template dari DB. Bila template tidak ada atau
// DB belum siap saat build, jatuh ke judul generik tanpa menggagalkan render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = await findTemplate(templateId);
  const name = template?.name ?? 'Contoh poster tidak ditemukan';
  return {
    title: `${name} — Customizer Poster`,
    description: `Isi brief merek untuk ${name}: nama brand, tagline, deskripsi, warna aksen, teks tombol, dan nada penulisan. Kirim pesanan via WhatsApp, lalu editor menyusun poster Anda sebelum diserahkan.`,
    alternates: { canonical: `/customizer/${templateId}` },
  };
}

export default async function CustomizerPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  // Slug dicocokkan saat render juga: id tak dikenal tetap merender halaman,
  // sedangkan nama template dari server tersedia untuk metadata di atas.
  // fetchCatalog() di dalam findTemplate() tidak pernah melempar.
  await findTemplate(templateId).catch(() => null);
  // Shell halaman: header + footer + klien customizer (form brief kiri,
  // live preview poster kanan).
  return (
    <>
      <Header />
      <CustomizerClient templateId={templateId} />
      <Footer />
    </>
  );
}
