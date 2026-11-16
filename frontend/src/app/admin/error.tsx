'use client';

// Back-office punya boundary sendiri supaya satu papan rusak tidak menjatuhkan
// halaman customer yang berbagi root layout.

import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin-error]', error);
  }, [error]);

  return (
    <main id="konten" className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-lg border border-rule bg-surface p-6">
        <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          <span aria-hidden="true" className="size-1.5 bg-danger" />
          Back office / galat
        </p>
        <h1 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight">
          Panel ini gagal dimuat
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Data order tidak berubah. Coba muat ulang panel, atau kembali ke papan pesanan.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink"
          >
            Coba lagi
          </button>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center border border-rule bg-paper px-4 text-[13px] font-medium transition-colors hover:border-ink"
          >
            Ke papan pesanan
          </Link>
        </div>
      </div>
    </main>
  );
}