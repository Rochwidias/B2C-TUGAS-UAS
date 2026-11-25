'use client';

// Editor konten poster untuk back-office. AI sudah ditarik dari alur: konten
// (badge, headline, subheadline, tombol ajakan, tiga poin, warna, kontras)
// disusun manual oleh admin dan disimpan lewat savePoster dari store lokal —
// store menambah draft `engine: 'manual'`, menulis log, dan menyebar event
// `craftai:recent-changed` sehingga halaman induk menyegarkan sendiri datanya.

import { useState, type FormEvent, type ReactNode } from 'react';
import PosterPreview from './PosterPreview';
import { useToast } from '@/components/ui/Toast';
import { savePoster } from '@/lib/orders-store';
// Konten yang disimpan memakai skema lengkap milik store/shop (poster + points
// wajib), sedangkan tipe Draft admin membolehkan keduanya kosong (bentuk lama).
import type { Draft as StoreDraft } from '@/components/shop/types';
import type { Draft, DraftBrief, DraftPoint } from './types';

// Batas teks yang sama dengan yang dipakai backend (docs/WHATSAPP-FLOW.md):
// 240 deskripsi poin / 140 subheadline / 60 judul / 40 tombol ajakan.
const LIMIT = {
  badge: 60,
  headline: 60,
  subheadline: 140,
  ctaText: 40,
  pointTitle: 60,
  pointDescription: 240,
} as const;

const POINT_ICONS = ['★', '→', '✦', '●', '▲'] as const;

/** Empat kolom kepala poster sesuai skema draft (docs/REDESIGN.md §4). */
type PosterText = NonNullable<Draft['poster']>;
type PosterTextKey = keyof PosterText;
const EMPTY_POSTER: PosterText = { badge: '', headline: '', subheadline: '', ctaText: '' };

interface PosterEditorProps {
  /** id order di penyimpanan lokal. */
  orderId: string;
  /** Konten poster terakhir (draft terakhir); null bila belum pernah diedit. */
  content: StoreDraft | null;
  /** Brief asli customer dipakai sebagai dasar brand bila konten belum ada. */
  brief: DraftBrief | null;
  /** Nama kontak customer — fallback nama brand bila brief tidak mengisinya. */
  contactName: string;
}

/**
 * Isi editor dari konten tersimpan bila ada, kalau tidak dari brief customer
 * (brand.name = brief.brandName ?? contact_name). Bentuk hasilnya selalu
 * lengkap (poster + tepat 3 poin) supaya konten yang disimpan selalu memenuhi
 * skema draft apa pun kondisi awalnya.
 */
function initialContent(content: StoreDraft | null, brief: DraftBrief | null, contactName: string): StoreDraft {
  const head = content?.poster ?? content?.heroSection ?? null;
  const points = (content?.points ?? content?.features ?? []).slice(0, 3);
  return {
    brand: {
      name: content?.brand?.name?.trim() || brief?.brandName?.trim() || contactName.trim(),
      tagline: content?.brand?.tagline?.trim() || brief?.tagline?.trim() || '',
      about: content?.brand?.about?.trim() || brief?.description?.trim() || '',
    },
    theme: {
      primaryColor: content?.theme?.primaryColor?.trim() || '#8b5cf6',
      accentColor: content?.theme?.accentColor?.trim() || '#6d28d9',
      fontPairing: content?.theme?.fontPairing?.trim() || 'Inter + Fraunces',
    },
    poster: {
      badge: head?.badge?.trim() || '',
      headline: head?.headline?.trim() || '',
      subheadline: head?.subheadline?.trim() || '',
      ctaText: head?.ctaText?.trim() || brief?.ctaText?.trim() || '',
    },
    points: [0, 1, 2].map((index) => {
      const point: DraftPoint | undefined = points[index];
      return {
        icon: point?.icon?.trim() || POINT_ICONS[index],
        title: point?.title?.trim() || '',
        description: point?.description?.trim() || '',
      };
    }),
  };
}

/** Rasio kontras WCAG teks putih di atas warna latar tertentu (1 s/d 21). */
function whiteContrast(background: string): number {
  const value = background.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return 1;
  const channel = (index: number) => {
    const raw = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return 1.05 / (luminance + 0.05);
}

/** Label status kontras pada latar berwarna: AA (>4.5) atau kurang. */
function contrastLabel(background: string): { ratio: string; tone: string } {
  const ratio = whiteContrast(background);
  return {
    ratio: `${ratio.toFixed(1)}:1`,
    tone: ratio >= 4.5 ? 'text-ok' : ratio >= 3 ? 'text-warn' : 'text-danger',
  };
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block font-mono text-[10px] tracking-wide text-ink-soft uppercase">
      {children}
    </label>
  );
}

/** Input teks satu baris + penghitung karakter batas. */
function TextInput({
  id,
  label,
  value,
  maxLength,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="font-mono text-[9.5px] tabular-nums text-ink-soft">
          {value.length}/{maxLength}
        </span>
      </div>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="w-full border border-rule bg-paper px-2.5 py-2 text-[12.5px] text-ink transition focus:border-ink placeholder:text-ink-soft/70"
      />
    </div>
  );
}

export default function PosterEditor({ orderId, content, brief, contactName }: PosterEditorProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<StoreDraft>(() => initialContent(content, brief, contactName));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  // Tanda tangan payload terakhir yang berhasil disimpan: dipakai untuk menonaktifkan
  // tombol simpan saat tidak ada perubahan, tanpa effect render berantai.
  const [persisted, setPersisted] = useState<string>(() =>
    JSON.stringify(initialContent(content, brief, contactName)),
  );

  // Sinkronkan dengan data segar dari store setiap kali halaman me-refresh
  // setelah simpan status/delivery — lokal tetap menampilkan nilai paling baru.
  const [prevContent, setPrevContent] = useState(content);
  const [prevBrief, setPrevBrief] = useState(brief);
  const [prevContact, setPrevContact] = useState(contactName);
  if (content !== prevContent || brief !== prevBrief || contactName !== prevContact) {
    setPrevContent(content);
    setPrevBrief(brief);
    setPrevContact(contactName);
    const next = initialContent(content, brief, contactName);
    setDraft(next);
    setPersisted(JSON.stringify(next));
  }

  const signature = JSON.stringify(draft);
  const unchanged = signature === persisted;
  const head = draft.poster;
  const points = draft.points ?? [];

  function updatePoster(key: PosterTextKey, next: string) {
    setDraft((prev) => {
      // Salinan eksplisit: spread dengan key bersifat union membuat seluruh
      // field poster menjadi opsional di mata TypeScript.
      const head: PosterText = { ...(prev.poster ?? EMPTY_POSTER) };
      if (key === 'badge') head.badge = next;
      else if (key === 'headline') head.headline = next;
      else if (key === 'subheadline') head.subheadline = next;
      else head.ctaText = next;
      return { ...prev, poster: head };
    });
    setSaved(null);
  }

  function updatePoint(index: number, key: 'icon' | 'title' | 'description', next: string) {
    setDraft((prev) => {
      const list = (prev.points ?? []).map((point, i): DraftPoint => {
        const copy: DraftPoint = { icon: point.icon, title: point.title, description: point.description };
        if (i === index) {
          if (key === 'icon') copy.icon = next;
          else if (key === 'title') copy.title = next;
          else copy.description = next;
        }
        return copy;
      });
      return { ...prev, points: list };
    });
    setSaved(null);
  }

  function updateTheme(key: 'primaryColor' | 'accentColor' | 'fontPairing', next: string) {
    setDraft((prev) => {
      const theme = { ...prev.theme };
      if (key === 'primaryColor') theme.primaryColor = next;
      else if (key === 'accentColor') theme.accentColor = next;
      else theme.fontPairing = next;
      return { ...prev, theme };
    });
    setSaved(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unchanged) {
      setError('Tidak ada perubahan untuk disimpan.');
      return;
    }
    setError(null);
    setSaved(null);

    const updated = savePoster(orderId, draft);
    if (!updated) {
      const message = 'Order tidak ditemukan di penyimpanan lokal.';
      setError(message);
      toast.error('Gagal menyimpan konten poster', message);
      return;
    }

    setPersisted(signature);
    setSaved('Konten poster tersimpan sebagai penyuntingan manual.');
    toast.success('Konten poster tersimpan', 'Ditulis ke order lokal sebagai draft manual.');
    // Halaman induk memantau RECENT_EVENT dari store, jadi data & log segar
    // tanpa navigasi; pesan sukses tetap terbaca karena form tidak di-mount ulang.
  }

  const primaryContrast = contrastLabel(draft.theme.primaryColor);
  const accentContrast = contrastLabel(draft.theme.accentColor);

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col border border-rule bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2">
        <h2 id="editor-poster" className="flex items-baseline gap-2 text-xs font-semibold tracking-tight text-ink">
          Editor Konten Poster
          <span aria-hidden="true" className="font-mono text-[10px] font-normal text-ink-soft">
            02
          </span>
        </h2>
      </div>

      <p className="border-b border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Semua kolom disusun manual — tidak ada generator otomatis. Simpan menambahkan konten ke
        order dengan <code className="font-mono text-ink">engine: manual</code> di penyimpanan lokal
        dan tercatat di riwayat log order.
      </p>

      {/* Kepala poster: badge, headline, subheadline, tombol ajakan. */}
      <div className="grid gap-3 border-b border-rule px-3 py-3 sm:grid-cols-2">
        <TextInput
          id="poster-badge"
          label="Badge"
          value={head?.badge ?? ''}
          maxLength={LIMIT.badge}
          onChange={(next) => updatePoster('badge', next)}
        />
        <TextInput
          id="poster-cta"
          label="Tombol ajakan (CTA)"
          value={head?.ctaText ?? ''}
          maxLength={LIMIT.ctaText}
          onChange={(next) => updatePoster('ctaText', next)}
        />
        <TextInput
          id="poster-headline"
          label="Headline"
          value={head?.headline ?? ''}
          maxLength={LIMIT.headline}
          onChange={(next) => updatePoster('headline', next)}
        />
        <TextInput
          id="poster-subheadline"
          label="Subheadline"
          value={head?.subheadline ?? ''}
          maxLength={LIMIT.subheadline}
          onChange={(next) => updatePoster('subheadline', next)}
        />
      </div>

      {/* Tiga poin poster: ikon, judul, deskripsi. */}
      <div className="border-b border-rule">
        <div className="flex items-baseline justify-between gap-2 border-b border-rule px-3 py-2">
          <h3 className="font-mono text-[10px] tracking-wide text-ink-soft uppercase">
            Tiga poin
          </h3>
          <span className="font-mono text-[9.5px] text-ink-soft">maks 3</span>
        </div>
        {[0, 1, 2].map((index) => {
          const point = points[index] ?? { icon: '', title: '', description: '' };
          return (
            <div key={index} className="grid gap-2 border-b border-rule px-3 py-3 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)]">
              <div>
                <FieldLabel htmlFor={`point-icon-${index}`}>Ikon</FieldLabel>
                <input
                  id={`point-icon-${index}`}
                  type="text"
                  value={point.icon}
                  maxLength={4}
                  onChange={(event) => updatePoint(index, 'icon', event.target.value)}
                  className="w-full border border-rule bg-paper px-2.5 py-2 text-center text-[13px] text-ink transition focus:border-ink"
                />
              </div>
              <div className="min-w-0">
                <FieldLabel htmlFor={`point-title-${index}`}>Judul poin {index + 1}</FieldLabel>
                <input
                  id={`point-title-${index}`}
                  type="text"
                  value={point.title}
                  maxLength={LIMIT.pointTitle}
                  onChange={(event) => updatePoint(index, 'title', event.target.value)}
                  placeholder={`Judul poin ${index + 1}`}
                  className="w-full border border-rule bg-paper px-2.5 py-2 text-[12.5px] text-ink transition focus:border-ink placeholder:text-ink-soft/70"
                />
                <div className="mt-2">
                  <textarea
                    id={`point-desc-${index}`}
                    value={point.description}
                    maxLength={LIMIT.pointDescription}
                    rows={2}
                    onChange={(event) => updatePoint(index, 'description', event.target.value)}
                    placeholder="Deskripsi singkat poin ini"
                    className="w-full resize-y border border-rule bg-paper px-2.5 py-2 text-[12.5px] leading-relaxed text-ink transition focus:border-ink placeholder:text-ink-soft/70"
                  />
                  <p className="mt-0.5 text-right font-mono text-[9.5px] tabular-nums text-ink-soft">
                    {point.description.length}/{LIMIT.pointDescription}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warna & kontras. */}
      <div className="border-b border-rule px-3 py-3">
        <h3 className="mb-2 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
          Warna &amp; kontras
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { key: 'primaryColor', label: 'Warna utama', state: primaryContrast },
              { key: 'accentColor', label: 'Warna aksen', state: accentContrast },
            ] as const
          ).map((item) => (
            <div key={item.key}>
              <FieldLabel htmlFor={`theme-${item.key}`}>{item.label}</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  id={`theme-${item.key}`}
                  type="color"
                  value={draft.theme[item.key]}
                  onChange={(event) => updateTheme(item.key, event.target.value)}
                  aria-label={item.label}
                  className="h-9 w-10 shrink-0 cursor-pointer border border-rule bg-paper"
                />
                <input
                  type="text"
                  value={draft.theme[item.key]}
                  maxLength={7}
                  onChange={(event) => updateTheme(item.key, event.target.value)}
                  aria-label={`${item.label} (hex)`}
                  className="min-w-0 flex-1 border border-rule bg-paper px-2.5 py-2 font-mono text-[12px] text-ink transition focus:border-ink"
                />
              </div>
              <p className={`mt-1 font-mono text-[9.5px] tabular-nums ${item.state.tone}`}>
                kontras teks putih {item.state.ratio}
                {item.state.tone === 'text-ok' ? ' · lolos AA' : item.state.tone === 'text-warn' ? ' · batas AA' : ' · di bawah AA'}
              </p>
            </div>
          ))}
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="theme-font">Pasangan font</FieldLabel>
            <input
              id="theme-font"
              type="text"
              value={draft.theme.fontPairing}
              maxLength={60}
              onChange={(event) => updateTheme('fontPairing', event.target.value)}
              placeholder="Inter + Fraunces"
              className="w-full border border-rule bg-paper px-2.5 py-2 text-[12.5px] text-ink transition focus:border-ink placeholder:text-ink-soft/70"
            />
          </div>
        </div>
        {draft.brand.name ? (
          <p className="mt-2 font-mono text-[9.5px] text-ink-soft">
            brand: {draft.brand.name} — diambil dari brief customer (tidak diedit di sini)
          </p>
        ) : null}
      </div>

      {/* Pratinjau memakai komponen preview poster yang sama dengan halaman detail. */}
      <div className="flex justify-center border-b border-rule p-3">
        <div className="w-full max-w-[340px]">
          <PosterPreview content={draft} />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <button
          type="submit"
          disabled={unchanged}
          className="flex min-h-11 items-center justify-center gap-2 border border-ink bg-ink px-3.5 text-[11.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Simpan konten poster
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
        {unchanged && !error ? (
          <p className="font-mono text-[10px] tracking-wide text-ink-soft uppercase">
            tidak ada perubahan
          </p>
        ) : null}
      </div>
    </form>
  );
}