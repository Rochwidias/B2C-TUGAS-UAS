import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

// Navigasi hanya berisi tujuan yang benar-benar ada: /#cara-kerja, /#katalog,
// /#paket, dan /orders. Tanpa backdrop-blur: header kertas pekat dengan garis
// bawah 1px, konsisten dengan bahasa cetak (DESIGN.md).
const NAV = [
  { href: '/#cara-kerja', label: 'Cara kerja' },
  { href: '/#katalog', label: 'Template' },
  { href: '/#paket', label: 'Paket' },
  { href: '/orders', label: 'Lacak pesanan' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center border border-ink bg-ink font-mono text-[13px] font-bold text-paper"
            aria-hidden="true"
          >
            CS
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[15px] font-semibold tracking-tight">CraftAI Studio</span>
            <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:block">
              Riset &amp; cetak web UMKM
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Navigasi utama" className="hidden h-full items-stretch md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center border-l border-rule px-4 text-[13px] text-ink-soft transition-colors hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle className="hidden sm:grid" />

          <Link
            href="/#katalog"
            className="hidden h-11 items-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)] sm:inline-flex"
          >
            Mulai dari katalog
          </Link>
        </div>
      </div>

      {/* Baris kedua khusus ponsel: dua kolom agar tidak ada overflow di 375px. */}
      <div className="grid grid-cols-2 border-t border-rule md:hidden">
        {NAV.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex min-h-11 items-center justify-between gap-2 px-4 text-[12px] text-ink-soft transition-colors active:bg-surface',
              index % 2 === 1 ? 'border-l border-rule' : '',
              index > 1 ? 'border-t border-rule' : '',
            ].join(' ')}
          >
            <span>{item.label}</span>
            <span className="font-mono text-[10px] text-ink-soft" aria-hidden="true">
              0{index + 1}
            </span>
          </Link>
        ))}
      </div>
    </header>
  );
}
