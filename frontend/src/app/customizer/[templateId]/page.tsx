import type { Metadata } from 'next';
import { CustomizerClient } from '@/components/shop/CustomizerClient';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';
import { CATALOG_TEMPLATES, getTemplateById } from '@/lib/catalog';

// Slug dari katalog statis: build tidak menunggu backend dan tetap
// mencetak halaman untuk ketiga template.
export function generateStaticParams(): { templateId: string }[] {
  return CATALOG_TEMPLATES.map((template) => ({ templateId: template.id }));
}

// Rute ini bergantung pada param request, tidak bisa masuk static shell.
export const instant = false;

// Judul/metadata mengikuti nama template dari katalog statis. Bila template
// tidak ada, jatuh ke judul generik tanpa menggagalkan render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplateById(templateId);
  const name = template?.name ?? 'Contoh poster tidak ditemukan';
  return {
    title: `${name} — Customizer Poster`,
    description: `Isi brief merek untuk ${name}: nama brand, tagline, deskripsi, warna aksen, teks tombol, dan nada penulisan. Kirim pesanan via WhatsApp, lalu editor menyusun poster Anda sebelum diserahkan.`,
    alternates: { canonical: `/customizer/${templateId}` },
  };
}

export default async function CustomizerPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  // Shell halaman: header + footer + klien customizer (form brief kiri,
  // live preview poster kanan). Data template statis, tidak ada fetch.
  return (
    <>
      <Header />
      <CustomizerClient templateId={templateId} />
      <Footer />
    </>
  );
}
