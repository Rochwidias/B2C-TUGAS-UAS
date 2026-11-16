import type { Metadata } from 'next';
import { TemplateCatalog } from '@/components/shop/TemplateCatalog';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Reveal } from '@/components/shop/Reveal';
import { PACKAGES, formatRupiah } from '@/components/shop/types';

export const metadata: Metadata = {
  // absolute: template "%s | CraftAI Studio" hanya berlaku untuk segmen anak,
  // jadi halaman depan harus menyebut brandnya sendiri.
  title: { absolute: 'CraftAI Studio | Kustomisasi Template Website dengan AI' },
  description:
    'Pilih template, isi brief bisnis, AI menyusun draft kontennya, lalu developer mengeksekusi sampai halaman live beserta source code. Harga transparan mulai Rp 150.000.',
  alternates: { canonical: '/' },
};

// Empat tahap yang benar-benar dijalankan sistem: pilih template -> brief ->
// AI menyusun draft -> developer mengeksekusi sampai live. Angka 01-04 adalah
// motif ledger DESIGN.md, bukan hiasan.
const STEPS = [
  {
    n: '01',
    title: 'Pilih template',
    desc: 'Tiga template dasar tersedia di katalog: kuliner, portofolio, dan toko online.',
    meta: 'Harga template mulai Rp 250.000',
  },
  {
    n: '02',
    title: 'Isi brief',
    desc: 'Nama brand, tagline, deskripsi bisnis, warna aksen, teks tombol, dan nada penulisan.',
    meta: 'Satu formulir, tanpa unggah file',
  },
  {
    n: '03',
    title: 'AI menyusun draft',
    desc: 'Server mengubah brief menjadi struktur halaman: hero, tiga fitur, dan dua tanya jawab.',
    meta: 'Badge engine menyebut asal konten apa adanya',
  },
  {
    n: '04',
    title: 'Developer mengeksekusi',
    desc: 'Tim kami merapikan kode, men-deploy, lalu menyerahkan URL live dan unduhan source code.',
    meta: 'Status tiap tahap bisa dilacak tanpa login',
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="konten" className="flex-1 bg-paper">
        {/* Hero asimetris: kolom kiri judul poster, kolom kanan metadata teknis. */}
        <section className="relative overflow-hidden border-b border-rule">
          <div className="pointer-events-none absolute inset-0 grid-paper opacity-60" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.55fr_1fr] lg:gap-12 lg:py-24">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                <span className="grid size-6 place-items-center border border-ink font-mono text-[10px] text-ink">
                  R
                </span>
                Riset cetak web UMKM / 2026
              </p>

              <h1 className="mt-6 text-[42px] font-semibold leading-[0.95] tracking-[-0.02em] sm:text-[62px] lg:text-[72px]">
                Pilih Template. AI Modifikasi.{' '}
                <span className="font-serif font-normal italic tracking-normal text-accent">
                  Kami yang eksekusi.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
                Anda tidak menulis kode dan tidak mendesain dari nol. Pilih template, kirim brief
                bisnis, server menyusun draft kontennya, lalu developer yang menyelesaikan kode dan
                men-deploy sampai halaman bisa dibuka publik.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#katalog"
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
                >
                  Pilih template sekarang
                </a>
                <a
                  href="#cara-kerja"
                  className="inline-flex min-h-12 items-center justify-center border border-rule bg-surface px-6 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  Baca alur kerjanya
                </a>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-rule pt-5 sm:max-w-lg">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Template aktif
                  </dt>
                  <dd className="mt-1 font-mono text-lg">3</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Rentang harga paket
                  </dt>
                  <dd className="mt-1 font-mono text-lg">{formatRupiah(PACKAGES[0].price)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Nomor order demo
                  </dt>
                  <dd className="mt-1 font-mono text-lg">UK-ORD-8812</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Login untuk lacak
                  </dt>
                  <dd className="mt-1 font-mono text-lg">Tidak perlu</dd>
                </div>
              </dl>
            </div>

            <Reveal as="section" delay={80} className="relative flex flex-col justify-between gap-6 border border-rule bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Lembar kerja / alur
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

        {/* Cara kerja: empat langkah sebagai tabel kerja, bukan empat kartu ikon. */}
        <section id="cara-kerja" className="scroll-mt-24 border-b border-rule bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Reveal className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                  Rak 01 / Cara kerja
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
                  Empat tahap, tanpa langkah tersembunyi
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                  Bagian yang dikerjakan mesin dan bagian yang dikerjakan manusia dipisah sejak awal,
                  supaya Anda tahu apa yang sedang ditunggu.
                </p>
                <p className="mt-6 inline-flex items-center gap-2 border border-rule bg-surface px-3 py-2 font-mono text-[11px] text-ink-soft">
                  <span className="size-1.5 bg-accent" aria-hidden="true" />
                  Tahap 04 dikerjakan manusia
                </p>
              </div>

              <ol className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
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

        {/* Reveal membungkus section di dalam TemplateCatalog lewat prop as. */}
        <TemplateCatalog />

        {/* Harga: ledger, bukan tiga kartu pricing dengan badge tengah. */}
        <section id="paket" className="scroll-mt-24 border-t border-ink bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                  Rak 03 / Paket eksekusi
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
                  Harga tetap, ditulis di tabel
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">
                Harga di bawah adalah biaya eksekusi di atas harga template. Rinciannya ditampilkan
                apa adanya, termasuk catatan bahwa pembayaran pada demo ini disimulasikan.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <caption className="sr-only">Perbandingan paket eksekusi CraftAI Studio</caption>
                <thead>
                  <tr className="border-y border-ink">
                    <th scope="col" className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Paket
                    </th>
                    <th scope="col" className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Harga
                    </th>
                    <th scope="col" className="py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Isi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGES.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-rule align-top">
                      <th scope="row" className="py-4 pr-4 text-[15px] font-semibold">
                        {pkg.name}
                      </th>
                      <td className="whitespace-nowrap py-4 pr-4 font-mono text-[15px]">
                        {formatRupiah(pkg.price)}
                      </td>
                      <td className="py-4 text-[13px] leading-relaxed text-ink-soft">{pkg.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
                Paket dipilih pada langkah checkout di halaman customizer.
              </p>
              <a
                href="#katalog"
                className="inline-flex min-h-12 items-center justify-center border border-ink bg-surface px-5 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
              >
                Mulai dari template
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
