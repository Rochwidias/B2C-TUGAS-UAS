import Link from 'next/link';
import { Sparkles, WandSparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            CraftAI Studio
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <Link href="/#cara-kerja" className="hover:text-white transition">
            Cara Kerja
          </Link>
          <Link href="/#katalog" className="hover:text-white transition">
            Pilihan Template
          </Link>
          <Link href="/orders" className="hover:text-white transition">
            Lacak Pesanan
          </Link>
        </nav>

        <Link
          href="/#katalog"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 transition flex items-center gap-2 text-white shadow-lg shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <WandSparkles className="w-4 h-4" aria-hidden="true" />
          <span>Mulai Kustomisasi</span>
        </Link>
      </div>
      {/* nav mobile: teks kecil agar 375px tetap nyaman */}
      <nav aria-label="Navigasi mobile" className="md:hidden border-t border-slate-800/70 px-4 py-2 flex gap-5 text-xs font-medium text-slate-400">
        <Link href="/#cara-kerja" className="hover:text-white transition">
          Cara Kerja
        </Link>
        <Link href="/#katalog" className="hover:text-white transition">
          Template
        </Link>
        <Link href="/orders" className="hover:text-white transition">
          Lacak Pesanan
        </Link>
      </nav>
    </header>
  );
}