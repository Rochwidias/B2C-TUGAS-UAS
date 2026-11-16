'use client';

// Peringatan sesi berakhir. Dipakai bersama oleh papan, kartu kanban, dan form
// detail agar pesan 401 selalu berbentuk sama: sebab + satu tautan perbaikan.
// `from` diteruskan ke /admin/login supaya admin kembali ke halaman yang sama.

import Link from 'next/link';

export default function SessionExpired({
  from,
  compact = false,
  detail,
}: {
  /** Path asal, mis. /admin/orders/<id>. Dibatasi ke path internal. */
  from?: string;
  compact?: boolean;
  detail?: string;
}) {
  const target = from && from.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin';
  const href = `/admin/login?from=${encodeURIComponent(target)}`;

  return (
    <div
      role="alert"
      className={`border-[1.5px] border-danger bg-surface ${compact ? 'px-2.5 py-2' : 'p-4'}`}
    >
      <p className="font-mono text-[10px] tracking-[0.14em] text-danger uppercase">
        Sesi berakhir
      </p>
      <p className={`font-semibold text-ink ${compact ? 'mt-0.5 text-[12px]' : 'mt-1 text-sm'}`}>
        Sesi berakhir, silakan login ulang.
      </p>
      <p
        className={`leading-relaxed text-ink-soft ${compact ? 'mt-0.5 text-[10.5px]' : 'mt-1 text-[12px]'}`}
      >
        {detail ?? 'Perubahan tidak tersimpan karena cookie admin sudah tidak berlaku. Data order tetap aman.'}
      </p>
      <Link
        href={href}
        className={`inline-flex min-h-11 items-center border border-ink bg-ink font-semibold text-paper transition hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          compact ? 'mt-2 px-2.5 text-[11px]' : 'mt-3 px-3.5 text-[11.5px]'
        }`}
      >
        Login ulang
      </Link>
    </div>
  );
}