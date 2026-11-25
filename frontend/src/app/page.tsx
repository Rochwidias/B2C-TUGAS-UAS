import type { Metadata } from 'next';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { PackagesSection } from '@/components/shop/PackagesSection';
import { Reveal } from '@/components/shop/Reveal';
import { TemplateCatalog } from '@/components/shop/TemplateCatalog';

export const metadata: Metadata = {
  // absolute: template "%s | Aether Creative" hanya berlaku untuk segmen anak,
  // jadi halaman depan harus menyebut brandnya sendiri.
  title: { absolute: 'Aether Creative | Platform Pembuatan Poster untuk UMKM' },
  description:
    'Platform pembuatan poster untuk membantu UMKM lebih tepercaya. Cepat, terjangkau, sesuai karakter usaha, dan lebih tepercaya: brief merek, editor validasi, hasil siap pakai.',
  alternates: { canonical: '/' },
};

// Alur tiga langkah persis docs/REDESIGN.md §1: Brief merek -> Editor
// validasi -> Hasil siap pakai. Angka 01-03 adalah motif ledger, bukan hiasan.
const STEPS = [
  {
    n: '01',
    title: 'Brief merek',
    desc: 'Isi nama usaha, tagline, deskripsi, warna aksen, teks tombol, dan nada penulisan. Satu formulir, tanpa unggah berkas.',
    meta: 'Tanpa konsultasi, bisa dikerjakan dari ponsel',
  },
  {
    n: '02',
    title: 'Editor validasi',
    desc: 'Server menyusun draft poster: badge, headline, subheadline, tombol ajakan, dan tiga poin. Editor memeriksa ketepatan brief sebelum dikerjakan.',
    meta: 'Badge engine menyebut asal konten apa adanya',
  },
  {
    n: '03',
    title: 'Hasil siap pakai',
    desc: 'Poster final diserahkan sesuai paket, lengkap dengan estimasi waktu, garansi revisi, dan status yang bisa dilacak.',
    meta: 'Estimasi & garansi tampil sebelum Anda membayar',
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="konten" className="flex-1 bg-paper">
        {/* Hero: kolom kiri identitas + nilai jual, kolom kanan alur 3 langkah. */}
        <section className="relative overflow-hidden border-b border-rule">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-60" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.55fr_1fr] lg:gap-12 lg:py-24">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                <span className="grid size-6 place-items-center border border-ink bg-accent font-mono text-[10px] text-accent-ink">
                  AC
                </span>
                Aether Creative / poster untuk UMKM
              </p>

              <h1 className="mt-6 text-[40px] font-semibold leading-[0.98] tracking-[-0.02em] sm:text-[58px] lg:text-[66px]">
                Platform pembuatan poster untuk membantu UMKM{' '}
                <span className="font-serif font-normal italic tracking-normal text-accent">
                  lebih tepercaya
                </span>
                .
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
                Cepat, terjangkau, sesuai karakter usaha, dan lebih tepercaya. Anda mengirim brief
                merek, editor memvalidasi draftnya, lalu poster siap pakai dikirim beserta estimasi
                waktu kerja dan garansi revisi — semuanya ditampilkan sebelum Anda membayar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#katalog"
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
                >
                  Lihat contoh poster
                </a>
                <a
                  href="#paket"
                  className="inline-flex min-h-12 items-center justify-center border border-rule bg-surface px-6 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  Cek harga &amp; garansi
                </a>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-rule pt-5 sm:max-w-lg">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Segmen poster
                  </dt>
                  <dd className="mt-1 font-mono text-lg">3</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Alur kerja
                  </dt>
                  <dd className="mt-1 font-mono text-lg">3 langkah</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Lacak pesanan
                  </dt>
                  <dd className="mt-1 font-mono text-lg">Tanpa login</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Estimasi &amp; garansi
                  </dt>
                  <dd className="mt-1 font-mono text-lg">Sebelum bayar</dd>
                </div>
              </dl>
            </div>

            <Reveal as="section" delay={80} className="relative flex flex-col justify-between gap-6 border border-rule bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Lembar kerja / alur 3 langkah
                </span>
                <span className="font-mono text-[10px] text-ink-soft" aria-hidden="true">
                  +
                </span>
              </div>

              <ol className="flex flex-col gap-4">
                {STEPS.map((step) => (
                  <li key={step.n} className="grid grid-cols-[32px_1fr] gap-3 border-b border-rule pb-4 last:border-b-0 last:pb-0">
                    <span className="font-mono text-[11px] text-accent">{step.n}</span>
                    <div>
                      <p className="text-[13px] font-semibold leading-snug">{step.title}</p>
                      <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">
                        {step.meta}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="border-t border-rule pt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                Pembayaran dan delivery pada demo ini adalah simulasi. Tidak ada transaksi nyata.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Cara kerja: tiga langkah sebagai tabel kerja, bukan kartu ikon. */}
        <section id="cara-kerja" className="scroll-mt-24 border-b border-rule bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                  Rak 01 / Cara kerja
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
                  Brief merek, editor validasi, hasil siap pakai
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                  Bagian yang dikerjakan mesin dan bagian yang dikerjakan manusia dipisah sejak
                  awal, supaya Anda tahu apa yang sedang ditunggu dan berapa lama.
                </p>
                <p className="mt-6 inline-flex items-center gap-2 border border-rule bg-surface px-3 py-2 font-mono text-[11px] text-ink-soft">
                  <span className="size-1.5 bg-accent" aria-hidden="true" />
                  Tahap 02 dan 03 diperiksa editor
                </p>
              </div>

              <ol className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-3">
                {STEPS.map((step) => (
                  <li key={step.n} className="flex flex-col gap-2 border-t border-rule py-5">
                    <span className="font-mono text-[11px] text-accent">{step.n}</span>
                    <h3 className="text-[17px] font-semibold leading-snug">{step.title}</h3>
                    <p className="text-[13px] leading-relaxed text-ink-soft">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* Katalog contoh poster per segmen, dengan filter kategori. */}
        <TemplateCatalog />

        {/* Harga: dua paket dari GET /api/packages, termasuk ETA + garansi. */}
        <PackagesSection />
      </main>
      <Footer />
    </>
  );
}