'use client';

// Tombol "Chat via WhatsApp" — dipakai halaman pelacakan dan petunjuk pesanan
// terakhir. Nomor yang dihubungi selalu nomor resmi dari env
// NEXT_PUBLIC_WHATSAPP_NUMBER (bukan nomor pelanggan).

import { whatsappStageHint } from './types';
import { contactChatUrl, useContact } from './whatsapp';

interface WhatsAppChatProps {
  /** Tahap pesanan; menentukan panduan pembuka chat di bawah tombol. */
  status?: string | null;
  orderNumber?: string | null;
  label?: string;
  className?: string;
}

export function WhatsAppChat({ status, orderNumber, label, className }: WhatsAppChatProps) {
  const contact = useContact();
  const hint = whatsappStageHint(status);
  const href = contactChatUrl(contact, orderNumber, hint);

  // Endpoint kontak belum tersedia/jaringan gagal: tombol disembunyikan,
  // bukan diarahkan ke nomor karangan.
  if (!href) return null;

  return (
    <div className={['flex flex-col items-start gap-1.5', className ?? ''].join(' ')}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
      >
        <span>{label ?? 'Chat via WhatsApp'}</span>
        <span aria-hidden="true" className="font-mono text-[11px]">
          ↗
        </span>
      </a>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">{hint}</span>
    </div>
  );
}