'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Reveal } from './Reveal';
import {
  type PackageOption,
  formatRupiah,
  packageEta,
  packageGuarantee,
  packageSummary,
} from './types';
import { fetchPackages } from '@/lib/packages';

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; packages: PackageOption[] }
  | { phase: 'error'; message: string };

/**
 * Section harga: dua kartu paket dari GET /api/packages (docs/REDESIGN.md §2).
 * Harga, kuota, estimasi waktu, dan garansi tidak pernah ditulis tangan di UI —
 * semuanya datang dari endpoint ini, dan kegagalan endpoint tampil sebagai state
 * error dengan tombol coba lagi, bukan harga karangan.
 *
 * ETA + garansi sengaja diletakkan di atas tombol ajakan: titik keraguan
 * customer adalah "cemas bayar tanpa hasil jelas".
 */
export function PackagesSection() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    const result = await fetchPackages();
    if (!aliveRef.current) return;
    if (!result.ok) {
      setState({ phase: 'error', message: result.error ?? 'Daftar paket tidak bisa dimuat.' });
      return;
    }
    setState({ phase: 'ready', packages: result.packages });
  }, []);

  // Pemuatan awal memakai rantai promise supaya tidak ada setState sinkron
  // di dalam effect (react-hooks/set-state-in-effect); `load` hanya untuk
  // tombol coba lagi yang dijalankan dari event handler.
  useEffect(() => {
    aliveRef.current = true;
    fetchPackages().then((result) => {
      if (!aliveRef.current) return;
      if (!result.ok) {
        setState({ phase: 'error', message: result.error ?? 'Daftar paket tidak bisa dimuat.' });
        return;
      }
      setState({ phase: 'ready', packages: result.packages });
    });
    return () => {
      aliveRef.current = false;
    };
  }, []);

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
            Seluruh angka diambil dari server saat halaman dibuka. Bila daftar paket belum bisa
            dimuat, kami menampilkan keadaannya apa adanya — bukan harga tebakan.
          </p>
        </div>

        <div className="mt-10" aria-live="polite">
          {state.phase === 'loading' && (
            <div aria-busy="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:col-span-2">
                Memuat daftar paket dari server
              </p>
              {[0, 1].map((row) => (
                <div key={row} className="border border-rule bg-surface p-6">
                  <div className="h-4 w-32 animate-pulse bg-rule" aria-hidden="true" />
                  <div className="mt-4 h-8 w-40 animate-pulse bg-rule" aria-hidden="true" />
                  <div className="mt-4 h-3 w-full animate-pulse bg-rule" aria-hidden="true" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse bg-rule" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}

          {state.phase === 'error' && (
            <div
              role="alert"
              className="flex flex-col gap-4 border border-danger bg-surface p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                  Daftar paket tidak tersedia
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{state.message}</p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-11 shrink-0 items-center justify-center border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
              >
                Coba lagi
              </button>
            </div>
          )}

          {state.phase === 'ready' && state.packages.length === 0 && (
            <div className="border border-dashed border-rule bg-surface p-6">
              <p className="text-[13px] font-semibold">Belum ada paket yang terdaftar</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                Server belum mengirim paket apa pun. Muat ulang halaman setelah daftar paket
                diisi.
              </p>
            </div>
          )}

          {state.phase === 'ready' && state.packages.length > 0 && (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2" data-testid="package-list">
              {state.packages.map((pkg) => {
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