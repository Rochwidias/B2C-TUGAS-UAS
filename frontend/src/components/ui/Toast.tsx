'use client';

// Toast: satu provider di layout, dipakai halaman mana pun lewat useToast().
// Alasan: setiap aksi pengguna (simpan, kirim pesanan, revisi) butuh umpan balik
// yang sama bentuknya; tanpa ini tiap halaman bikin alert sendiri.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

interface ToastApi {
  push: (tone: ToastTone, title: string, detail?: string) => void;
  success: (title: string, detail?: string) => void;
  error: (title: string, detail?: string) => void;
  info: (title: string, detail?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_MARK: Record<ToastTone, string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, detail?: string) => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { id, tone, title, detail }]);
      // 6 detik: cukup untuk membaca dua baris, tidak menutupi konten lama.
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 6000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, detail) => push('success', title, detail),
      error: (title, detail) => push('error', title, detail),
      info: (title, detail) => push('info', title, detail),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={[
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 border bg-surface px-3.5 py-3 shadow-[4px_4px_0_0_var(--ink)]',
              item.tone === 'error' ? 'border-danger' : 'border-ink',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'mt-0.5 grid size-5 shrink-0 place-items-center border font-mono text-[11px] font-bold',
                item.tone === 'error'
                  ? 'border-danger text-danger'
                  : item.tone === 'success'
                    ? 'border-ok text-ok'
                    : 'border-ink text-ink',
              ].join(' ')}
            >
              {TONE_MARK[item.tone]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-ink">{item.title}</p>
              {item.detail ? (
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{item.detail}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Tutup notifikasi"
              className="-mr-1 grid size-7 shrink-0 place-items-center text-ink-soft transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span aria-hidden="true" className="font-mono text-[13px] leading-none">
                ×
              </span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus dipakai di dalam ToastProvider.');
  }
  return context;
}