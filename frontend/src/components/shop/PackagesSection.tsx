'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';
import { formatRupiah, packageEta, packageGuarantee, packageSummary } from './types';
import { PACKAGES } from '@/lib/packages';

/**
 * Section harga: dua kartu paket statis dari PACKAGES (docs/FRONTEND-ONLY.md).
 * Harga, kuota, estimasi waktu, dan garansi didefinisikan satu tempat di
 * frontend/src/lib/packages.ts — tidak ada fetch, tidak ada state loading/error.
 *
 * ETA + garansi sengaja diletakkan di atas tombol ajakan: titik keraguan
 * customer adalah "cemas bayar tanpa hasil jelas".
 */
export function PackagesSection() {
  return (
    <Reveal as="section" id="paket" className="scroll-mt-24 border-t border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
              Rak 03 / Harga &amp; garansi
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
              Estimasi dan garansi tampil sebelum Anda bayar
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">
            Seluruh angka tercantum apa adanya pada daftar paket — bukan harga tebakan.
          </p>
        </div>

        <div className="mt-10" aria-live="polite">
          {PACKAGES.length === 0 ? (
            <div className="border border-dashed border-rule bg-surface p-6">
              <p className="text-[13px] font-semibold">Belum ada paket yang terdaftar</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                Daftar paket kosong. Muat ulang halaman setelah daftar paket diisi.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2" data-testid="package-list">
              {PACKAGES.map((pkg) => {
                const eta = packageEta(pkg);
                const guarantee = packageGuarantee(pkg);
                return (
                  <li
                    key={pkg.key}
                    data-package-key={pkg.key}
                    className="flex h-full flex-col border border-rule bg-surface p-6 transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
                  >
                    <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-4">
                      <h3 className="text-[22px] font-semibold leading-tight tracking-tight">
                        {pkg.name}
                      </h3>
                      <span className="font-mono text-[18px]">{formatRupiah(pkg.price)}</span>
                    </div>

                    <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
                      {packageSummary(pkg)}
                    </p>

                    <dl className="mt-5 flex flex-col gap-3 border-t border-rule pt-4 text-[13px]">
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          Estimasi
                        </dt>
                        <dd className="text-right font-mono text-[12px]">{eta || '—'}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          Garansi
                        </dt>
                        <dd className="text-right font-mono text-[12px]">{guarantee || '—'}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          Kuota
                        </dt>
                        <dd className="text-right font-mono text-[12px]">
                          {pkg.quota} poster per order
                        </dd>
                      </div>
                    </dl>

                    <Link
                      href="/#katalog"
                      className="mt-6 inline-flex min-h-12 items-center justify-between gap-3 border border-ink bg-surface px-4 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
                    >
                      <span>Mulai dengan {pkg.name}</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] text-ink-soft">
          <span className="border border-rule px-1.5 py-0.5 uppercase tracking-wide">Catatan</span>
          <span>
            Paket dipilih pada langkah checkout di halaman customizer, dan estimasi serta garansi
            yang sama ikut ditampilkan di sana sebelum tombol bayar.
          </span>
        </p>
      </div>
    </Reveal>
  );
}
