import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="konten" className="flex flex-1 items-center justify-center bg-paper px-4 py-20">
      <div className="w-full max-w-lg border border-rule bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          <span aria-hidden="true" className="size-1.5 bg-accent" />
          Galat / 404
        </p>

        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
          Halaman tidak ditemukan
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          Tautan mungkin salah tulis, atau halaman sudah dipindahkan. Katalog poster Aether
          Creative tetap bisa dibuka dari halaman depan, dan nomor order tetap bisa dilacak
          tanpa login.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)]"
          >
            Ke halaman depan
          </Link>
          <Link
            href="/orders"
            className="inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
          >
            Lacak pesanan
          </Link>
        </div>
      </div>
    </main>
  );
}