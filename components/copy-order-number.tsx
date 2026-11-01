"use client";

import { useState } from "react";

export function CopyOrderNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-body-sm text-ink transition-colors hover:border-accent hover:text-accent"
      aria-label="Salin nomor pesanan"
    >
      {value}
      <span className="font-display text-caption text-ink-soft">
        {copied ? "Tersalin" : "Salin"}
      </span>
    </button>
  );
}
