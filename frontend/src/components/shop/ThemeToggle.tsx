'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const ROOT_ATTR = 'data-theme';

// Tema dibaca dari atribut <html> sebagai store eksternal, bukan state lokal.
// Nilai tersebut memang diubah di luar React (script pre-paint di layout.tsx dan
// tombol ini), jadi React menyarankan useSyncExternalStore, sekaligus menghindari
// setState synchronously di dalam useEffect.
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [ROOT_ATTR],
  });
  return () => observer.disconnect();
}

function readTheme(): string {
  return document.documentElement.getAttribute(ROOT_ATTR) ?? '';
}

// Snapshot server dan client sengaja sama ('light') supaya markup awal identik
// saat hydration. Ikon bulan dan matahari dirender dua-duanya; CSS di
// globals.css yang memilih mana yang tampil berdasarkan data-theme. Dengan
// begitu tidak ada teks atau ikon yang berubah antara server dan browser.
function readThemeServer(): string {
  return 'light';
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  // Berlangganan perubahan atribut supaya komponen ikut render ulang; nilainya
  // sendiri dipakai CSS, bukan untuk memilih cabang markup.
  useSyncExternalStore(subscribe, readTheme, readThemeServer);

  function toggle() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute(ROOT_ATTR, next);
    try {
      localStorage.setItem('craftai-theme', next);
    } catch {
      // Penyimpanan diblokir (mode privat): tema tetap berganti untuk sesi ini.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema terang atau gelap"
      className={`grid size-11 place-items-center border border-rule bg-surface text-ink transition hover:border-ink ${className}`}
    >
      {/* Bulan = sedang mode terang (klik untuk gelap). */}
      <svg
        viewBox="0 0 24 24"
        className="theme-icon-moon size-5"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
      </svg>
      {/* Matahari = sedang mode gelap (klik untuk terang). */}
      <svg
        viewBox="0 0 24 24"
        className="theme-icon-sun size-5"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}