'use client';

// Error boundary tingkat rute: menjaga satu halaman rusak tidak menjatuhkan
// seluruh aplikasi. Client component karena harus memakai reset() dari Next.

import Link from 'next/link';
import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke konsol server/klien agar penyebab tidak hilang saat produksi.
    console.error('[route-error]', error);
  }, [error]);

  return (
    <main id="konten" className="flex flex-1 items-center justify-center bg-paper px-4 py-20">
      <div className="w-full max-w-lg border border-rule bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          <span aria-hidden="true" className="size-1.5 bg-danger" />
          Galat / 500
        </p>

        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
          Halaman ini gagal dimuat
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          Keadaan Anda tidak hilang. Coba muat ulang langkah ini; kalau masih gagal, kembali ke
          halaman depan dan mulai lagi dari katalog.
        </p>

        {error.digest ? (
          <p className="mt-4 border border-rule bg-paper px-3 py-2 font-mono text-[10px] text-ink-soft">
            Kode acuan: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)]"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
          >
            Kembali ke halaman depan
          </Link>
        </div>
      </div>
    </main>
  );
}