'use client';

import { useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/Toast';
import { setDelivery } from '@/lib/orders-store';
import type { AdminOrder } from './types';

// Form delivery -> setDelivery dari store lokal (live URL, unduhan ZIP,
// catatan). URL yang tersimpan di sini yang kemudian mengaktifkan tombol
// customer di /orders/[id]; store menyebar RECENT_EVENT agar halaman induk
// menyegarkan sendiri datanya.
export default function DeliveryForm({ order }: { order: AdminOrder }) {
  const toast = useToast();
  const [liveUrl, setLiveUrl] = useState(order.live_website_url ?? '');
  const [zipUrl, setZipUrl] = useState(order.download_zip_url ?? '');
  const [note, setNote] = useState(order.dev_note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Ikuti nilai terbaru dari store (mis. setelah simpan pertama kali) tanpa
  // mereset pesan sukses yang sedang ditampilkan. Disesuaikan saat render,
  // bukan di effect, agar tidak memicu render berantai.
  const [prevOrder, setPrevOrder] = useState(order);
  if (order !== prevOrder) {
    setPrevOrder(order);
    setLiveUrl(order.live_website_url ?? '');
    setZipUrl(order.download_zip_url ?? '');
    setNote(order.dev_note ?? '');
  }

  const validLive = liveUrl.trim() === '' || /^https?:\/\S+$/i.test(liveUrl.trim());
  const validZip = zipUrl.trim() === '' || /^https?:\/\S+$/i.test(zipUrl.trim());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);
    if (!validLive || !validZip) {
      setError('URL harus diawali http:// atau https://.');
      return;
    }
    if (!liveUrl.trim()) {
      setError('Live URL wajib diisi. Customer tidak bisa membuka hasil tanpa alamat ini.');
      return;
    }
    if (!zipUrl.trim()) {
      setError('Source code (zip URL) wajib diisi.');
      return;
    }
    if (!note.trim()) {
      setError('Catatan delivery wajib diisi agar riwayat order punya keterangan.');
      return;
    }
    setError(null);

    const updated = setDelivery(order.id, {
      live_website_url: liveUrl.trim(),
      download_zip_url: zipUrl.trim(),
      dev_note: note.trim(),
    });
    if (!updated) {
      const message = 'Order tidak ditemukan di penyimpanan lokal.';
      setError(message);
      toast.error('Delivery gagal disimpan', message);
      return;
    }

    const detail = 'Customer sekarang bisa mengakses live URL dan source code.';
    setSaved(detail);
    toast.success('Delivery tersimpan', detail);
    // Event RECENT_EVENT dari store memicu pembaruan halaman induk.
  }

  const fieldClass = (valid: boolean) =>
    `min-h-11 w-full border bg-paper px-2.5 text-[12.5px] text-ink placeholder:text-ink-soft/80 transition focus:border-ink ${
      valid ? 'border-rule' : 'border-danger'
    }`;

  return (
    <form onSubmit={submit} className="flex flex-col border border-rule bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-rule px-3 py-2">
        <h2 className="text-xs font-semibold tracking-tight text-ink">Form delivery</h2>
        <span aria-hidden="true" className="font-mono text-[10px] text-ink-soft">
          02
        </span>
      </div>

      <p className="border-b border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Isi setelah poster di-deploy. Ketiga kolom wajib diisi supaya riwayat serah terima lengkap,
        dan customer hanya melihat tombol unduh setelah status{' '}
        <span className="font-semibold text-ink">Completed</span>.
      </p>

      <div className="grid gap-3 px-3 py-3">
        <div>
          <label
            htmlFor="live-url"
            className="mb-1 block font-mono text-[10px] tracking-wide text-ink-soft uppercase"
          >
            Live URL
          </label>
          <input
            id="live-url"
            type="url"
            inputMode="url"
            value={liveUrl}
            onChange={(event) => {
              setLiveUrl(event.target.value);
              setSaved(null);
            }}
            placeholder="https://poster-aether.my.id/UK-ORD-8812"
            aria-invalid={!validLive}
            aria-describedby={!validLive ? 'live-url-error' : undefined}
            className={fieldClass(validLive)}
          />
          {!validLive ? (
            <p id="live-url-error" className="mt-1 text-[10.5px] font-medium text-danger">
              Format URL tidak valid. Harus diawali http:// atau https://.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="zip-url"
            className="mb-1 block font-mono text-[10px] tracking-wide text-ink-soft uppercase"
          >
            Source code (zip URL)
          </label>
          <input
            id="zip-url"
            type="url"
            inputMode="url"
            value={zipUrl}
            onChange={(event) => {
              setZipUrl(event.target.value);
              setSaved(null);
            }}
            placeholder="https://cdn.aethercreative.my.id/export/UK-ORD-8812.zip"
            aria-invalid={!validZip}
            aria-describedby={!validZip ? 'zip-url-error' : undefined}
            className={fieldClass(validZip)}
          />
          {!validZip ? (
            <p id="zip-url-error" className="mt-1 text-[10.5px] font-medium text-danger">
              Format URL tidak valid. Harus diawali http:// atau https://.
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <label
              htmlFor="delivery-note"
              className="font-mono text-[10px] tracking-wide text-ink-soft uppercase"
            >
              Catatan delivery
            </label>
            <span
              className={`font-mono text-[10px] tabular-nums ${
                note.length > 2000 ? 'text-danger' : 'text-ink-soft'
              }`}
            >
              {note.length}/2000
            </span>
          </div>
          <textarea
            id="delivery-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(null);
            }}
            rows={3}
            maxLength={2000}
            placeholder="Contoh: deploy selesai, domain custom sudah terpasang."
            className="w-full resize-y border border-rule bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-ink-soft/80 transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule px-3 py-2.5">
        <button
          type="submit"
          className="flex min-h-11 items-center justify-center gap-2 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Simpan delivery
        </button>
        {saved ? (
          <p role="status" className="text-[11px] font-medium text-ok">
            {saved}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[11px] font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
