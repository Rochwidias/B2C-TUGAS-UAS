import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";
import { PosterCard } from "@/components/poster-card";
import { Button } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const steps = [
  {
    number: "01",
    title: "Prompt & Generate",
    body: "Tim menulis prompt rinci per tema, lalu menghasilkan beberapa kandidat gambar dengan model AI generatif.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.734-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: "var(--gradient-cyberpunk)",
  },
  {
    number: "02",
    title: "Finishing Manusia",
    body: "Kandidat terbaik dirapikan manual: komposisi, kontras, tipografi, dan koreksi warna cetak. Detail yang AI lewatkan.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    gradient: "var(--gradient-retro)",
  },
  {
    number: "03",
    title: "Cetak & Kirim",
    body: "Dicetak di kertas fine art 260 gsm, dibingkai bila diminta, dikemas tabung/bingkai kayu, lalu dikirim ke alamat Anda.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    gradient: "var(--gradient-alam)",
  },
];

function StatIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    posters: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l7-6v6h10V8l-3-3-6 6V8L4 8z" />
      </svg>
    ),
    variants: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16M4 18h16" />
      </svg>
    ),
    days: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    shipping: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h1l2-4h8l2 4h1a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9V5a4 4 0 018 0v4" />
      </svg>
    ),
  };
  return <>{icons[name]}</>;
}

const stats = [
  { value: "12+", label: "Koleksi poster", icon: "posters" },
  { value: "9", label: "Varian per poster", icon: "variants" },
  { value: "3–5", label: "Hari produksi", icon: "days" },
  { value: "Gratis", label: "Ongkir > 250rb", icon: "shipping" },
];

function minPrice(variants: { price: number }[], fallback: number) {
  if (variants.length === 0) return fallback;
  return Math.min(...variants.map((variant) => variant.price));
}

export default async function HomePage() {
  const featured = await prisma.poster.findMany({
    where: { active: true, featured: true },
    include: { variants: { select: { price: true } } },
    orderBy: { title: "asc" },
    take: 4,
  });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="blob-bg" aria-hidden="true">
          <span />
        </div>

        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="max-w-2xl animate-slide-up">
            <p className="eyebrow">Marketplace Poster AI + Finishing Manusia</p>
            <h1 className="mt-5 text-balance font-display text-display-lg leading-[1.05]">
              Dibuat <span className="gradient-text">AI</span>,
              <br />
              diselesaikan <span className="text-accent">manusia</span>.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-body-lg leading-relaxed text-ink-muted">
              Setiap poster di PosterAI dibuat dengan model generatif, lalu dikurasi,
              diwarnai ulang, dan dirapikan satu per satu sebelum masuk produksi.
              Hasilnya gambar yang terasa dibuat, bukan dihasilkan.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="xl" asChild>
                <Link href="/products">Jelajahi Katalog</Link>
              </Button>
              <Button size="xl" variant="secondary" asChild>
                <Link href="/custom-order">Pesan Custom</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center animate-count"
                  style={{ animationDelay: `${180 + index * 80}ms` }}
                >
                  <div className="mb-2 flex justify-center text-accent" aria-hidden="true">
                    <StatIcon name={stat.icon} />
                  </div>
                  <p className="font-display text-2xl font-extrabold leading-none text-ink sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-caption text-ink-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden animate-scale-in lg:block">
            <div
              className="absolute inset-0 rotate-3 rounded-3xl border border-line bg-bg-alt/70"
              aria-hidden="true"
            />
            <div className="relative -rotate-3 overflow-hidden rounded-3xl border border-line bg-surface shadow-card-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/posters/cyberpunk-sunset.svg"
                alt="Contoh poster Cyberpunk Sunset: kota neon di matahari terbenam"
                className="aspect-3-4 w-full object-cover"
                loading="eager"
              />
              <div
                className="absolute bottom-0 right-0 h-24 w-24 rounded-bl-3xl bg-gradient-to-tr from-accent/25 to-transparent"
                aria-hidden="true"
              />
            </div>

            <div className="absolute -bottom-6 -left-6 animate-float">
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center shadow-card">
                <p className="font-display text-2xl font-extrabold text-coral">12</p>
                <p className="text-micro uppercase tracking-wider text-ink-muted">Koleksi unik</p>
              </div>
            </div>
            <div
              className="absolute -bottom-6 right-4 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center shadow-card">
                <p className="font-display text-2xl font-extrabold text-cyan">9</p>
                <p className="text-micro uppercase tracking-wider text-ink-muted">Varian/poster</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-y border-line bg-bg-alt" aria-labelledby="process-title">
        <div className="container-page py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">Proses kami</p>
            <h2 id="process-title" className="mt-3 font-display text-display-sm sm:text-display-md">
              Bagaimana poster ini dibuat
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Setiap langkah melibatkan kecerdasan buatan dan kepekaan tangan manusia.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="group relative rounded-3xl border border-line bg-surface p-7 shadow-card transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-hover animate-enter"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span
                  className="absolute -top-4 left-7 flex h-10 w-10 items-center justify-center rounded-xl font-display text-body font-extrabold text-bg shadow-pill"
                  style={{ backgroundImage: step.gradient }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <div className="mb-4 mt-2 inline-flex rounded-xl bg-accent-soft p-3 text-accent">
                  {step.icon}
                </div>
                <h3 className="font-display text-heading-lg">{step.title}</h3>
                <p className="mt-3 text-body leading-relaxed text-ink-muted">{step.body}</p>
                <div
                  className="absolute inset-x-0 bottom-0 h-1 origin-center scale-x-0 rounded-b-3xl transition-transform duration-200 group-hover:scale-x-100"
                  style={{ backgroundImage: "var(--gradient-accent)" }}
                  aria-hidden="true"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-20" aria-labelledby="featured-title">
        <div className="container-page">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Pilihan kurator</p>
              <h2 id="featured-title" className="mt-2 font-display text-display-sm sm:text-display-md">
                Poster unggulan
              </h2>
              <p className="mt-2 text-body text-ink-muted">
                Koleksi terbaik yang dipilih tim: siap cetak dalam 3–5 hari.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-2 font-display text-body font-semibold text-accent transition-all hover:gap-3"
            >
              Semua poster
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((poster, index) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                fromPrice={minPrice(poster.variants, poster.basePrice)}
                index={index}
              />
            ))}
          </div>

          {featured.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-ink-muted">
              Belum ada poster unggulan. Lihat seluruh katalog untuk koleksi lainnya.
            </p>
          )}
        </div>
      </section>

      {/* CUSTOM CTA */}
      <section className="border-y border-line bg-bg-alt">
        <div className="container-page py-16 lg:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 sm:px-12 lg:px-16">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-soft opacity-60 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-coral-soft opacity-60 blur-3xl" />
            </div>

            <div className="relative max-w-2xl">
              <p className="eyebrow text-paper/60">Layanan custom</p>
              <h2 className="mt-4 text-balance font-display text-display-md leading-tight text-bg">
                Punya ide yang belum ada di katalog?
              </h2>
              <p className="mt-4 max-w-xl text-body-lg leading-relaxed text-paper/70">
                Kirim brief, pilih gaya dan ukuran. Tim kami akan membuat draf dengan AI,
                lalu dirapikan manual oleh desainer. Anda hanya membayar setelah menyetujui
                penawaran harga.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/custom-order"
                  className="inline-flex items-center justify-center rounded-full border-2 border-paper/30 px-6 py-3 font-display text-body-sm font-semibold text-bg transition-colors hover:border-paper hover:bg-white/10"
                >
                  Ajukan Custom Order
                </Link>
                <Link
                  href="/custom-order"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 font-display text-body-sm font-semibold text-paper/70 transition-colors hover:bg-white/10 hover:text-bg"
                >
                  Lihat Proses Custom
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-body-sm text-paper/60">
                {[
                  "Revisi hingga puas",
                  "Estimasi 1×24 jam",
                  "Desain eksklusif",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Tetap terhubung</p>
            <h2 className="mt-3 font-display text-display-sm">
              Dapatkan inspirasi desain & akses eksklusif
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Koleksi baru, promo terbatas, dan behind-the-scene proses AI + manusia.
            </p>
            <div className="mt-7">
              <NewsletterForm />
            </div>
            <p className="mt-3 text-caption text-ink-soft">
              Tidak ada spam. Hanya hal-hal keren. Batalkan kapan saja.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
