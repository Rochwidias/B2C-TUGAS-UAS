'use client';

// Loading state bersama: dipakai halaman/komponen yang menunggu data.
// Bentuknya mengikuti bahasa cetak (garis, bukan blur), dan hormat pada
// prefers-reduced-motion karena pulse dimatikan lewat CSS di globals.

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse bg-rule ${className}`} aria-hidden="true" />;
}

export function SkeletonLines({
  rows = 3,
  className = '',
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === rows - 1 ? 'w-2/3' : index === 0 ? 'w-full' : 'w-5/6'}`}
        />
      ))}
    </div>
  );
}

/** Blok status pemuatan dengan label yang dibacakan screen reader. */
export function LoadingBlock({
  label = 'Memuat data',
  rows = 3,
  className = '',
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`border border-rule bg-surface p-4 ${className}`} aria-busy="true">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse bg-accent motion-reduce:animate-none"
        />
        {label}
      </p>
      <SkeletonLines rows={rows} className="mt-3" />
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3.5 animate-spin border-2 border-current border-t-transparent motion-reduce:animate-none ${className}`}
    />
  );
}