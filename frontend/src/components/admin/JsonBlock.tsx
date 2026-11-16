'use client';

// Payload JSON sebagai artefak teknis: header mono, isi pre, garis 1px.
// Blok ini bisa digulung dua arah supaya JSON panjang tidak merusak layout
// halaman pada 320px (R-40 / min-w-0 + overflow-auto).

import { useState } from 'react';

export default function JsonBlock({
  value,
  label,
  maxHeight = 420,
}: {
  value: unknown;
  label: string;
  /** Batas tinggi area gulir dalam px. */
  maxHeight?: number;
}) {
  const [wrap, setWrap] = useState(false);
  let text: string;
  try {
    text = JSON.stringify(value, null, 2) ?? 'null';
  } catch {
    text = '// nilai tidak bisa diserialisasi ke JSON';
  }
  const lines = text.split('\n').length;

  return (
    <figure className="flex min-w-0 max-w-full flex-col overflow-hidden border border-rule bg-surface">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-rule px-3 py-2">
        <h2 className="min-w-0 truncate text-xs font-semibold tracking-tight text-ink">{label}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-ink-soft">{lines} baris</span>
          <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
            JSON
          </span>
          <button
            type="button"
            onClick={() => setWrap((current) => !current)}
            aria-pressed={wrap}
            className="min-h-11 border border-rule px-2 font-mono text-[10px] tracking-wide text-ink-soft uppercase transition hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {wrap ? 'Tanpa bungkus' : 'Bungkus baris'}
          </button>
        </div>
      </figcaption>
      <pre
        tabIndex={0}
        style={{ maxHeight }}
        className={`w-full max-w-full overflow-auto px-3 py-3 font-mono text-[11.5px] leading-relaxed text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
          wrap ? 'break-words whitespace-pre-wrap' : 'whitespace-pre'
        }`}
      >
        {text}
      </pre>
    </figure>
  );
}