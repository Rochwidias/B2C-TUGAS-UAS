// Detail order back office. Halaman route (server) mengoper `orderId` dari
// params; komponen ini tidak memakai useParams karena hook itu tidak pernah
// resolve saat hard load pada rute PPR — halaman akan tersangkut di fallback.

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import JsonBlock from '@/components/admin/JsonBlock';
import PosterEditor from '@/components/admin/PosterEditor';
import StatusBadge from '@/components/admin/StatusBadge';
import StatusUpdateForm from '@/components/admin/StatusUpdateForm';
import DeliveryForm from '@/components/admin/DeliveryForm';
import LogsTimeline from '@/components/admin/LogsTimeline';
import SessionExpired from '@/components/admin/SessionExpired';
import { Skeleton } from '@/components/ui/Feedback';
import { API_BASE } from '@/lib/api';
import {
  COLUMN_META,
  columnOfStatus,
  formatDate,
  formatRupiah,
  positiveInt,
  quotaOf,
  type AdminDraft,
  type AdminOrder,
  type DraftBrief,
  type OrderLog,
  type QuotaInfo,
} from '@/components/admin/types';

// GET /api/orders/[id] -> {order, draft, drafts, logs, remaining}
// (docs/REDESIGN.md §5). `drafts`/`remaining` opsional supaya halaman tetap
// terbaca saat backend lama yang belum mengirimnya sedang berjalan.
interface OrderPayload {
  order: AdminOrder;
  draft: AdminDraft | null;
  drafts?: AdminDraft[];
  logs: OrderLog[];
  remaining?: number | null;
}

/** Label untuk baris brief; nilai kosong tetap terlihat sebagai '-'. */
const BRIEF_ROWS = [
  { key: 'brandName', label: 'Brand', mono: false },
  { key: 'tagline', label: 'Tagline', mono: false },
  { key: 'description', label: 'Deskripsi', mono: false },
  { key: 'themeColor', label: 'Warna tema', mono: true },
  { key: 'ctaText', label: 'CTA', mono: false },
  { key: 'toneOfVoice', label: 'Tone of voice', mono: false },
  { key: 'templateId', label: 'Template', mono: true },
] as const;

function BriefLedger({ brief }: { brief: DraftBrief | null }) {
  if (!brief) {
    return (
      <p className="px-3 py-4 text-[11.5px] leading-relaxed text-ink-soft">
        Brief tidak tersimpan untuk order ini. Minta customer mengisi ulang brief di halaman
        kustomisasi.
      </p>
    );
  }
  return (
    <dl className="divide-y divide-rule text-[12px]">
      {BRIEF_ROWS.map((row) => {
        const value = brief[row.key] ?? '';
        return (
          <div key={row.key} className="flex gap-3 px-3 py-2">
            <dt className="w-[92px] shrink-0 font-mono text-[9.5px] leading-[1.7] tracking-wide text-ink-soft uppercase">
              {row.label}
            </dt>
            <dd
              className={`min-w-0 flex-1 leading-relaxed break-words ${row.mono ? 'font-mono text-[11.5px]' : ''} ${
                value ? 'text-ink' : 'text-ink-soft'
              }`}
            >
              {value || '-'}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-3 w-40" />
      <div className="border border-rule bg-surface px-4 py-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-7 w-48" />
        <Skeleton className="mt-3 h-3 w-full max-w-md" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <p className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
        Mengambil order, brief, dan riwayat…
      </p>
    </div>
  );
}


export default function AdminOrderDetail({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  // Draft yang sedang ditampilkan di pratinjau & JSON. Bila id tidak ditemukan
  // lagi (mis. setelah muat ulang), otomatis jatuh ke draft utama — tanpa effect.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // loading hanya untuk muat pertama. Memuat ulang setelah simpan membiarkan
  // halaman tetap terlihat, karena menggantinya dengan skeleton akan melepas
  // mount form dan menghapus pesan hasil simpan.
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Semua set-state diundur: effect memanggil fungsi ini langsung, jadi
    // state yang diset sinkron di awal akan memicu render berantai.
    queueMicrotask(() => setError(null));

    let nextData: OrderPayload | null = null;
    let nextError: string | null = null;
    let nextExpired = false;

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, { cache: 'no-store', credentials: 'include' });
      if (response.status === 401) {
        nextExpired = true;
      } else {
        const payload = (await response.json().catch(() => null)) as
          | (OrderPayload & { error?: string })
          | null;
        if (!response.ok) {
          nextError = payload?.error ?? `Order tidak ditemukan (HTTP ${response.status})`;
        } else if (!payload?.order) {
          nextError = 'Respons API tidak berisi field order.';
        } else {
          nextData = {
            order: payload.order,
            draft: payload.draft ?? null,
            drafts: Array.isArray(payload.drafts) ? payload.drafts : undefined,
            logs: payload.logs ?? [],
            remaining: payload.remaining ?? null,
          };
        }
      }
    } catch {
      nextError = 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
    }

    // Setelah await saja: menyetel state secara sinkron di dalam effect
    // memicu render berantai (lint react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (nextData) setData(nextData);
      setError(nextError);
      setExpired(nextExpired);
      setLoading(false);
    });
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Form status/delivery memberi tahu halaman ini lewat event agar data segar
  // tanpa memicu navigasi ulang.
  useEffect(() => {
    function onUpdated() {
      void load();
    }
    window.addEventListener('admin:order-updated', onUpdated);
    return () => window.removeEventListener('admin:order-updated', onUpdated);
  }, [load]);

  if (loading) {
    return (
      <AdminShell>
        <DetailSkeleton />
      </AdminShell>
    );
  }

  if (expired) {
    return (
      <AdminShell>
        <nav aria-label="Remah roti" className="mb-3">
          <Link
            href="/admin"
            className="flex min-h-11 items-center font-mono text-[10px] tracking-wide text-ink-soft uppercase underline decoration-rule underline-offset-4 transition hover:text-ink hover:decoration-accent"
          >
            ← Papan
          </Link>
        </nav>
        <div className="max-w-[60ch]">
          <SessionExpired
            from={`/admin/orders/${orderId}`}
            detail="Detail order tidak bisa dimuat karena cookie admin sudah tidak berlaku. Data order tetap aman."
          />
        </div>
      </AdminShell>
    );
  }

  if (error || !data) {
    return (
      <AdminShell>
        <div role="alert" className="max-w-[60ch] border-[1.5px] border-danger bg-surface">
          <div className="border-b border-rule px-4 py-2.5">
            <p className="font-mono text-[10px] tracking-[0.14em] text-danger uppercase">
              Berkas tidak terbaca
            </p>
            <h1 className="mt-1 text-lg leading-tight font-semibold text-ink">Order gagal dimuat</h1>
          </div>
          <p className="px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
            {error ?? 'Data order tidak tersedia.'} Periksa sesi admin Anda, lalu muat ulang. Data
            order tidak berubah.
          </p>
          <div className="flex flex-wrap gap-2 border-t border-rule px-4 py-3">
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Coba lagi
            </button>
            <Link
              href="/admin"
              className="flex min-h-11 items-center border border-rule px-3.5 text-[11.5px] font-medium text-ink transition hover:border-ink"
            >
              ← Kembali ke papan
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const { order, draft, logs } = data;
  // Semua draft milik order (termasuk brief tambahan). `drafts` dari API menang;
  // bila belum dikirim, jatuh ke draft tunggal agar halaman tetap lengkap.
  const drafts = data.drafts && data.drafts.length > 0 ? data.drafts : draft ? [draft] : [];
  const primary = draft ?? drafts[0] ?? null;
  const selected = drafts.find((item) => item.id === selectedId) ?? primary;
  const brief = primary?.input_prompt_data ?? null;
  const content = selected?.ai_generated_content ?? null;

  // Tautan Chat ke Customer: wa.me ke contact_whatsapp order dengan pesan
  // pembuka berisi nomor order. Tanpa nomor, tombol tidak dirender.
  const digits = (order.contact_whatsapp ?? '').replace(/[^0-9]/g, '');
  const customerGreeting = `Halo ${order.contact_name || 'kak'}, saya dari Aether Creative ingin menanyakan pesanan ${order.order_number}.`;

  const quotaBase = quotaOf(order, drafts.length);
  const quotaInfo: QuotaInfo = { ...quotaBase, remaining: positiveInt(data.remaining) ?? quotaBase.remaining };
  const column = columnOfStatus(order.status);

  return (
    <AdminShell>
      <nav
        aria-label="Remah roti"
        className="mb-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-wide text-ink-soft uppercase"
      >
        <Link
          href="/admin"
          className="flex min-h-11 items-center underline decoration-rule underline-offset-4 transition hover:text-ink hover:decoration-accent"
        >
          Papan
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/admin"
          className="flex min-h-11 items-center underline decoration-rule underline-offset-4 transition hover:text-ink hover:decoration-accent"
        >
          {COLUMN_META[column].label}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{order.order_number}</span>
      </nav>

      <header className="border-[1.5px] border-ink bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
              Berkas order / {order.template_id}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-2xl leading-none font-semibold tracking-tight text-ink">
                {order.order_number}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px] text-ink-soft">
              <span className="font-semibold text-ink">{order.package_name}</span>
              <span aria-hidden="true" className="text-ink-soft/60">
                |
              </span>
              <span className="font-mono tabular-nums">{formatRupiah(order.total_price)}</span>
              <span aria-hidden="true" className="text-ink-soft/60">
                |
              </span>
              <span
                className={
                  order.payment_status === 'paid'
                    ? 'font-semibold text-ok'
                    : 'font-semibold text-warn'
                }
              >
                {order.payment_status === 'paid' ? 'Lunas' : 'Belum dibayar'}
              </span>
            </p>
          </div>

          <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-2 text-[11px] sm:grid-cols-3 lg:max-w-[58%] lg:grid-cols-5">
            <div className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                Customer
              </dt>
              <dd className="mt-0.5 truncate font-semibold text-ink" title={order.contact_name}>
                {order.contact_name}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                WhatsApp
              </dt>
              <dd className="mt-0.5 min-w-0 truncate font-mono tabular-nums">
                <a
                  href={`https://wa.me/${order.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 max-w-full items-center truncate underline decoration-rule underline-offset-2 transition hover:decoration-accent"
                >
                  {order.contact_whatsapp}
                </a>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">Email</dt>
              <dd className="mt-0.5 min-w-0 truncate" title={order.contact_email}>
                <a
                  href={`mailto:${order.contact_email}`}
                  className="inline-flex min-h-11 max-w-full items-center truncate underline decoration-rule underline-offset-2 transition hover:decoration-accent"
                >
                  {order.contact_email}
                </a>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                Sisa kuota
              </dt>
              <dd
                className={`mt-0.5 font-semibold ${
                  quotaInfo.remaining === null
                    ? 'text-ink-soft'
                    : quotaInfo.remaining > 0
                      ? 'text-ok'
                      : 'text-danger'
                }`}
                title={
                  quotaInfo.remaining === null
                    ? 'Backend belum mengirim data kuota order ini.'
                    : `Kuota paket ${quotaInfo.quota ?? '?'}, sudah dipakai ${drafts.length}`
                }
              >
                {quotaInfo.remaining !== null
                  ? `${quotaInfo.remaining}${quotaInfo.quota !== null ? ` / ${quotaInfo.quota}` : ''}`
                  : '—'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-wide text-ink-soft uppercase">
                Diperbarui
              </dt>
              <dd className="mt-0.5 text-ink-soft">{formatDate(order.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule bg-paper px-4 py-2">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
            Dibuat {formatDate(order.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            {digits ? (
              <a
                href={`https://wa.me/${digits}?text=${encodeURIComponent(customerGreeting)}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-1.5 border border-ink bg-accent px-3 text-[11.5px] font-semibold text-accent-ink transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Chat ke Customer
                <span aria-hidden="true">&nearr;</span>
              </a>
            ) : null}
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
              Live
            </span>
            {order.live_website_url ? (
              <a
                href={order.live_website_url}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 max-w-full truncate font-mono text-[11px] text-ink underline decoration-accent decoration-[1.5px] underline-offset-[3px]"
              >
                {order.live_website_url}
              </a>
            ) : (
              <span className="text-ink-soft">belum ada</span>
            )}
            {order.download_zip_url ? (
              <a
                href={order.download_zip_url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center border border-rule px-2.5 text-[11px] font-medium text-ink transition hover:border-ink"
              >
                ZIP ↓
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Brief customer: ledger dua kolom, label mono. */}
        <section aria-labelledby="brief-customer" className="min-w-0 border border-rule bg-surface">
          <div className="flex items-baseline justify-between gap-2 border-b border-rule px-3 py-2">
            <h2 id="brief-customer" className="text-xs font-semibold tracking-tight text-ink">
              Brief asli customer
            </h2>
            <span aria-hidden="true" className="font-mono text-[10px] text-ink-soft">
              01
            </span>
          </div>

          <BriefLedger brief={brief} />

          {drafts.length > 1 ? (
            <p className="border-t border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
              Order ini punya {drafts.length} draft — {drafts.length - 1} di antaranya berasal dari
              brief tambahan. Pilih draft di daftar untuk melihat brief lainnya.
            </p>
          ) : null}
        </section>

        {/* Editor Konten Poster: satu-satunya tempat isi poster diubah. AI sudah
            ditarik dari alur — kolom disusun manual dan disimpan lewat
            PUT /api/admin/orders/[id]/poster. */}
        <section aria-labelledby="editor-poster" className="min-w-0">
          <PosterEditor
            orderId={orderId}
            content={content}
            brief={brief}
            exportHref={selected ? `${API_BASE}/api/export/${selected.id}` : null}
          />
        </section>
      </div>

      {/* Semua draft milik order, termasuk brief tambahan dari kuota paket. */}
      <section aria-labelledby="semua-draft" className="mt-3 border border-rule bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-3 py-2">
          <h2 id="semua-draft" className="flex items-baseline gap-2 text-xs font-semibold tracking-tight text-ink">
            Semua draft &amp; brief
            <span aria-hidden="true" className="font-mono text-[10px] font-normal text-ink-soft">
              03
            </span>
          </h2>
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
            {drafts.length} draft · sisa kuota{' '}
            {quotaInfo.remaining !== null ? quotaInfo.remaining : '—'}
            {quotaInfo.quota !== null ? `/${quotaInfo.quota}` : ''}
          </p>
        </div>

        {drafts.length === 0 ? (
          <p className="px-3 py-4 text-[11.5px] leading-relaxed text-ink-soft">
            Belum ada draft terhubung ke order ini. Brief tambahan dari customer akan langsung
            muncul di daftar ini.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {drafts.map((item, index) => {
              const itemBrief = item.input_prompt_data;
              const isActive = selected?.id === item.id;
              return (
                <li key={item.id} className={isActive ? 'bg-paper' : undefined}>
                  <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          aria-pressed={isActive}
                          className="min-h-11 border border-rule bg-surface px-2.5 font-mono text-[11px] font-semibold text-ink transition hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          Draft {String(index + 1).padStart(2, '0')}
                        </button>
                        <span
                          className={`border-[1.5px] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] uppercase ${
                            index === 0 ? 'border-rule text-ink-soft' : 'border-warn text-warn'
                          }`}
                        >
                          {index === 0 ? 'Brief awal' : 'Brief tambahan'}
                        </span>
                        <time
                          dateTime={item.generated_at}
                          className="font-mono text-[10px] tabular-nums text-ink-soft"
                        >
                          {formatDate(item.generated_at)}
                        </time>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                        <span className="font-semibold text-ink">
                          {itemBrief?.brandName || 'Tanpa nama brand'}
                        </span>
                        {itemBrief?.tagline ? ` — ${itemBrief.tagline}` : ''}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-ink-soft">
                        <span>tema {itemBrief?.themeColor ?? '—'}</span>
                        <span>cta {itemBrief?.ctaText || '—'}</span>
                        <span className="truncate">{item.id.slice(0, 8)}</span>
                      </p>
                    </div>

                    <a
                      href={`${API_BASE}/api/export/${item.id}`}
                      download
                      aria-label={`Export Clean Source Code untuk draft ${index + 1}`}
                      className="flex min-h-11 shrink-0 items-center justify-center border border-rule px-3 text-[11.5px] font-medium text-ink transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:self-start"
                    >
                      Export ↓
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Payload mentah selalu tersedia: admin butuh melihat persis apa yang
          dikembalikan API, termasuk saat konten poster belum pernah diedit. */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <JsonBlock
          value={content ?? { order, draft: null }}
          label={content ? 'Payload JSON konten poster' : 'Payload API order (konten belum ada)'}
        />
        {selected?.input_prompt_data ? (
          <JsonBlock value={selected.input_prompt_data} label="Brief input (input_prompt_data)" />
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <StatusUpdateForm order={order} />
        <DeliveryForm order={order} />
      </div>

      <div className="mt-3">
        <LogsTimeline logs={logs} />
      </div>
    </AdminShell>
  );
}