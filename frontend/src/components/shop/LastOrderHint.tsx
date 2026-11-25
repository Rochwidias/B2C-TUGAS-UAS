'use client';

// Tombol "Lanjutkan pesanan terakhir" di /orders. Membaca pintasan yang
// disimpan store (setLastOrder) setelah checkout di customizer — key
// LAST_ORDER_KEY ('craftai-last-order'), pembaruan lewat LAST_ORDER_EVENT.
// Tidak menampilkan apa pun bila belum pernah checkout di perangkat ini.

import { useSyncExternalStore } from 'react';
import { WhatsAppChat } from '@/components/shop/WhatsAppChat';
import { LAST_ORDER_EVENT, LAST_ORDER_KEY } from '@/lib/orders-store';

interface LastOrder {
  number: string;
  id: string;
  at: number;
  /** Tahap pesanan terakhir — menentukan panduan chat WhatsApp. */
  status?: string;
}

// useSyncExternalStore: server mengirim snapshot "kosong" yang sama dengan
// render pertama klien, jadi HTML server dan klien cocok dan hydration tidak
// gagal. Setelah hydration, React membaca snapshot sebenarnya dan mem-baca
// ulang komponen ini bila nilainya berbeda.
const emptySnapshot = JSON.stringify(null);

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(LAST_ORDER_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LAST_ORDER_EVENT, onChange);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(LAST_ORDER_KEY) ?? emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

const getServerSnapshot = (): string => emptySnapshot;

export function LastOrderHint({ onUse }: { onUse: (number: string) => void }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let last: LastOrder | null = null;
  if (raw !== emptySnapshot) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof (parsed as LastOrder).number === 'string') {
        const candidate = parsed as LastOrder;
        last = {
          ...candidate,
          status: typeof candidate.status === 'string' ? candidate.status : '',
        };
      }
    } catch {
      last = null;
    }
  }

  if (!last) {
    return (
      <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
        Setelah pesanan dikirim, nomor order terakhir Anda akan muncul di sini sebagai pintasan.
      </p>
    );
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        Lanjutkan pesanan terakhir
      </p>
      <button
        type="button"
        onClick={() => onUse(last.number)}
        className="mt-2 inline-flex min-h-11 items-center gap-3 border border-ink bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="font-mono">{last.number}</span>
        <span aria-hidden="true">&rarr;</span>
        <span className="sr-only">Isi nomor ini ke kolom pencarian</span>
      </button>
      <WhatsAppChat className="mt-4" status={last.status ?? ''} orderNumber={last.number} />
    </div>
  );
}
