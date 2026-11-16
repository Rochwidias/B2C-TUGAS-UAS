import type { Metadata } from 'next';
import { CustomizerClient } from '@/components/shop/CustomizerClient';
import { Footer } from '@/components/shop/Footer';
import { Header } from '@/components/shop/Header';

// Base URL backend (lihat src/lib/api.ts) — frontend tidak lagi import DB.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Ambil satu template dari backend. Melempar bila backend tak terjangkau
 *  supaya pemanggil bisa jatuh ke judul generik (perilaku lama tanpa DB). */
async function fetchTemplateName(templateId: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/api/templates`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Backend merespons ${response.status}`);
  const payload = (await response.json()) as { templates?: { id: string; name: string }[] };
  return payload.templates?.find((template) => template.id === templateId)?.name ?? null;
}

// Rute ini bergantung pada param request, tidak bisa masuk static shell.
export const instant = false;

// Judul/metadata mengikuti nama template dari DB. Bila template tidak ada atau
// DB belum siap saat build, jatuh ke judul generik tanpa menggagalkan render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  let name = 'Template';
  try {
    name = (await fetchTemplateName(templateId)) ?? 'Template tidak ditemukan';
  } catch {
    // Backend belum siap (mis. saat prerender): pakai judul generik.
    name = 'Template';
  }
  return {
    title: `${name} — Customizer`,
    description: `Isi brief bisnis untuk template ${name}: nama brand, tagline, deskripsi, warna aksen, teks tombol, dan nada penulisan. AI menyusun draft, developer mengeksekusi sampai live.`,
    alternates: { canonical: `/customizer/${templateId}` },
  };
}

export default async function CustomizerPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return (
    <>
      <Header />
      <CustomizerClient templateId={templateId} />
      <Footer />
    </>
  );
}
