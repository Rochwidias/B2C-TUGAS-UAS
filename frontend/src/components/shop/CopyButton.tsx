'use client';

// Tombol salin kecil untuk data teknis (nomor order, URL). Memakai
// navigator.clipboard bila tersedia; bila tidak, jatuh ke select+execCommand
// supaya tetap berfungsi di browser lama / konteks tanpa izin clipboard.

import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'copied' | 'manual';

export function CopyButton({
  value,
  label,
  className = '',
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const manualRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (status !== 'copied' && status !== 'manual') return;
    const t = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setStatus('copied');
        return;
      }
    } catch {
      // Izin ditolak atau API tidak ada: coba fallback di bawah.
    }
    // Fallback: pilih teks di input tersembunyi, pengguna menyalin manual.
    const node = manualRef.current;
    if (node) {
      node.focus();
      node.select();
      setStatus('manual');
    }
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center justify-center border border-rule bg-surface px-3 text-[12px] font-medium text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={label}
      >
        {status === 'copied' ? 'Tersalin' : label}
      </button>
      <input
        ref={manualRef}
        type="text"
        readOnly
        value={value}
        aria-hidden="true"
        tabIndex={-1}
        className={
          status === 'manual'
            ? 'h-9 w-40 border border-ink bg-paper px-2 font-mono text-[11px] text-ink'
            : 'sr-only'
        }
      />
      {status === 'manual' && (
        <span className="font-mono text-[10px] text-ink-soft">Teks terpilih, tekan Ctrl+C</span>
      )}
    </span>
  );
}