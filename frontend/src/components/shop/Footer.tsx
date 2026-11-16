import Link from 'next/link';

// Footer faktual: hanya tautan ke bagian dan halaman yang benar-benar ada.
// Tidak ada klaim jumlah klien, uptime, atau testimoni (R-17, R-18).
export function Footer() {
  return (
    <footer className="mt-16 border-t border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span
                className="grid size-8 place-items-center border border-ink bg-ink font-mono text-[11px] font-bold text-paper"
                aria-hidden="true"
              >
                CS
              </span>
              <span className="text-sm font-semibold">CraftAI Studio</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Layanan kustomisasi template website: brief Anda diolah menjadi draft konten, lalu
              developer yang menulis dan men-deploy kode finalnya.
            </p>
          </div>

          <nav
            aria-label="Navigasi footer"
            className="grid grid-cols-2 gap-x-10 gap-y-1 text-[13px]"
          >
            {/* Target sentuh dijaga >=44px: link footer sering diklik di layar
                sentuh, dan jarak antar baris dibuat cukup untuk jempol. */}
            <Link href="/#cara-kerja" className="flex min-h-11 items-center text-ink-soft hover:text-ink hover:underline">
              Cara kerja
            </Link>
            <Link href="/#katalog" className="flex min-h-11 items-center text-ink-soft hover:text-ink hover:underline">
              Katalog template
            </Link>
            <Link href="/#paket" className="flex min-h-11 items-center text-ink-soft hover:text-ink hover:underline">
              Harga paket
            </Link>
            <Link href="/orders" className="flex min-h-11 items-center text-ink-soft hover:text-ink hover:underline">
              Lacak pesanan
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-6 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 CraftAI Studio. Proyek tugas akhir, bukan layanan komersial.</p>
          <p className="font-mono">Pembayaran &amp; delivery pada demo ini adalah simulasi.</p>
        </div>
      </div>
    </footer>
  );
}
