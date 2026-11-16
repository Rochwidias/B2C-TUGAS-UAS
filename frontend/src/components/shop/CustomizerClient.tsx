'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { DraftPreview, EngineBadge } from './DraftPreview';
import {
  PACKAGES,
  type Brief,
  type Draft,
  type DraftResponse,
  type Order,
  type OrderCreatedResponse,
  type Template,
  type ThemeColorKey,
  categoryLabel,
  formatRupiah,
  readJson,
} from './types';
import { API_BASE } from '@/lib/api';

// Batas karakter brief. Dipakai bersama oleh validasi, penghitung, dan
// placeholder supaya angka maksimum hanya ditulis di satu tempat.
const DESC_MIN = 20;
const DESC_MAX = 800;
const BRAND_MIN = 2;

function briefKey(templateId: string): string {
  return `craftai-brief-${templateId}`;
}

// Draft brief disimpan di localStorage supaya formulir yang sudah diisi tidak
// hilang saat pindah halaman atau menutup tab.
function loadBriefDraft(templateId: string): Partial<Brief> | null {
  try {
    const raw = localStorage.getItem(briefKey(templateId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Brief>) : null;
  } catch {
    return null;
  }
}

const THEME_OPTIONS: { value: ThemeColorKey; label: string }[] = [
  { value: 'amber', label: 'Warm Amber & Coffee' },
  { value: 'indigo', label: 'Tech Indigo & Blue' },
  { value: 'emerald', label: 'Fresh Emerald & Green' },
  { value: 'rose', label: 'Elegant Rose & Pink' },
];

const TONE_OPTIONS = ['Profesional', 'Santai & ramah', 'Energik & muda', 'Elegan & premium'];

// Prefill per kategori: contoh brief yang masuk akal untuk bisnis itu, bukan
// data pelanggan sungguhan. Kolom tetap bisa dikosongkan.
const PRESET: Record<string, { brandName: string; tagline: string; description: string; ctaText: string }> = {
  fnb: {
    brandName: 'Kopi Senja Utama',
    tagline: 'Rasa Otentik Kopi Nusantara di Jantung Kota',
    description: 'Kami menyajikan biji kopi single origin roast medium-dark dengan suasana nyaman untuk nugas dan santai. Buka tiap hari 08.00 - 23.00.',
    ctaText: 'Pesan Meja Sekarang',
  },
  portfolio: {
    brandName: 'Dimas Studio & Design',
    tagline: 'Crafting Digital Experiences that Convert',
    description: 'Studio desain independen yang fokus pada landing page, identitas visual, dan produk digital untuk startup lokal.',
    ctaText: 'Lihat Karya Saya',
  },
  shop: {
    brandName: 'UrbanStreet Wear',
    tagline: 'Fashion Streetwear Lokal Berkualitas Dunia',
    description: 'Produksi limited edition, bahan combed 30s, pengiriman ke seluruh Indonesia via kurir reguler dan instan.',
    ctaText: 'Beli via WhatsApp',
  },
};

const inputClass =
  'w-full min-h-11 border border-rule bg-paper px-3 py-2 text-sm text-ink transition-colors placeholder:text-ink-soft/70 focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const labelClass = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft';

// Kelas input dengan status validasi: garis danger + ikon saat field sudah
// disentuh tapi masih berisi kesalahan.
function fieldClass(invalid: boolean): string {
  return invalid ? `${inputClass} border-danger` : inputClass;
}

type GenState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; draftId: string; content: Draft; engine: 'gemini' | 'local' };

type OrderState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string };

export function CustomizerClient({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const [brief, setBrief] = useState<Brief>({
    templateId,
    brandName: '',
    tagline: '',
    description: '',
    themeColor: 'amber',
    ctaText: '',
    toneOfVoice: 'Profesional',
  });

  const [gen, setGen] = useState<GenState>({ phase: 'idle' });
  const [order, setOrder] = useState<OrderState>({ phase: 'idle' });
  const [pkg, setPkg] = useState('pro');
  const [contact, setContact] = useState({ name: '', whatsapp: '', email: '' });
  // true setelah pengguna menyentuh sebuah field; pesan validasi baru muncul
  // setelah itu supaya formulir tidak terlihat "merah" sebelum diisi.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const toast = useToast();


  // Simpan draft setiap kali brief berubah (debounce ringan) agar tidak hilang.
  // Simpanan terakhir WAJIB di-flush saat unmount, bukan dibatalkan, supaya
  // draft yang diketik tepat sebelum pindah halaman tidak hilang.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const briefRef = useRef(brief);

  // Ref hanya untuk dibaca di handler unmount/visibilitychange, jadi
  // penugasannya dilakukan di effect (bukan saat render).
  useEffect(() => {
    briefRef.current = brief;
  }, [brief]);

  const flushDraft = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      localStorage.setItem(briefKey(templateId), JSON.stringify(briefRef.current));
    } catch {
      // Penyimpanan diblokir (mode privat): abaikan, formulir tetap berfungsi.
    }
  };

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      try {
        localStorage.setItem(briefKey(templateId), JSON.stringify(brief));
      } catch {
        // Penyimpanan diblokir (mode privat): abaikan, formulir tetap berfungsi.
      }
    }, 300);
    return () => {
      // Unmount: tulis nilai terakhir yang sudah menempel di ref.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      try {
        localStorage.setItem(briefKey(templateId), JSON.stringify(briefRef.current));
      } catch {
        // Penyimpanan diblokir: abaikan.
      }
    };
  }, [brief, templateId]);

  // Simpan juga ketika tab disembunyikan/ditutup: debounce bisa belum jalan.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushDraft);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushDraft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/templates`)
      .then((res) => readJson<{ templates: Template[] }>(res))
      .then((result) => {
        if (!alive) return;
        if (!result.ok) {
          setTemplateError(result.error);
          return;
        }
        const found = (result.data.templates ?? []).find((t) => t.id === templateId);
        if (!found) {
          setTemplateError('Template tidak ditemukan. Pilih ulang dari katalog.');
          return;
        }
        setTemplate(found);
        // Pulihkan draft tersimpan hanya untuk kolom yang masih kosong, lalu
        // isi preset template bila kolom tetap kosong. Satu updater, satu render.
        const saved = loadBriefDraft(templateId);
        setBrief((prev) => {
          const filled = (v: string | undefined) => typeof v === 'string' && v.trim() !== '';
          const restored = saved
            ? {
                ...prev,
                brandName: filled(prev.brandName) ? prev.brandName : saved.brandName ?? prev.brandName,
                tagline: filled(prev.tagline) ? prev.tagline : saved.tagline ?? prev.tagline,
                description: filled(prev.description) ? prev.description : saved.description ?? prev.description,
                ctaText: filled(prev.ctaText) ? prev.ctaText : saved.ctaText ?? prev.ctaText,
                themeColor: saved.themeColor ?? prev.themeColor,
                toneOfVoice: saved.toneOfVoice ?? prev.toneOfVoice,
              }
            : prev;
          const untouched = [restored.brandName, restored.tagline, restored.description, restored.ctaText].every(
            (value) => value.trim() === '',
          );
          if (!untouched || prev.templateId === templateId) return restored;
          const preset = PRESET[found.category] ?? PRESET.fnb;
          return { ...restored, ...preset };
        });
      })
      .catch(() => alive && setTemplateError('Tidak bisa terhubung ke server.'));
    return () => {
      alive = false;
    };
  }, [templateId]);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const descLength = brief.description.trim().length;

  // Validasi per field mengikuti batas yang ditampilkan ke pengguna. Dipakai
  // untuk menonaktifkan tombol Generate dan menampilkan pesan Bahasa Indonesia.
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const brand = brief.brandName.trim();
    if (!brand) e.brandName = 'Nama brand wajib diisi.';
    else if (brand.length < BRAND_MIN)
      e.brandName = `Nama brand minimal ${BRAND_MIN} karakter (sekarang ${brand.length}).`;
    if (!brief.tagline.trim()) e.tagline = 'Tagline wajib diisi.';
    const desc = brief.description.trim();
    if (!desc) e.description = 'Deskripsi wajib diisi.';
    else if (desc.length < DESC_MIN)
      e.description = `Deskripsi minimal ${DESC_MIN} karakter (sekarang ${desc.length}).`;
    else if (desc.length > DESC_MAX)
      e.description = `Deskripsi maksimal ${DESC_MAX} karakter (sekarang ${desc.length}).`;
    if (!brief.ctaText.trim()) e.ctaText = 'Teks tombol (CTA) wajib diisi.';
    if (!brief.toneOfVoice.trim()) e.toneOfVoice = 'Pilih nada penulisan.';
    return e;
  }, [brief]);

  const briefValid = Object.keys(errors).length === 0;

  // dipakai baik sebagai submit handler maupun tombol "coba lagi"
  async function generate(e: { preventDefault: () => void }) {
    e.preventDefault();
    // Tandai semua field tersentuh agar pesan validasi tampil saat submit diblokir.
    setTouched({
      brandName: true,
      tagline: true,
      description: true,
      ctaText: true,
      toneOfVoice: true,
    });
    if (!briefValid) {
      toast.error('Brief belum lengkap', 'Periksa kembali kolom yang ditandai merah.');
      return;
    }
    setGen({ phase: 'loading' });
    try {
      const res = await fetch(`${API_BASE}/api/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      const result = await readJson<DraftResponse>(res);
      if (!result.ok) {
        setGen({ phase: 'error', message: result.error });
        toast.error('Draft gagal dibuat', result.error);
        return;
      }
      setGen({
        phase: 'done',
        draftId: result.data.draftId,
        content: result.data.content,
        engine: result.data.engine,
      });
      toast.success(
        'Draft berhasil dibuat',
        result.data.engine === 'gemini'
          ? 'Disusun oleh Gemini.'
          : 'Disusun oleh generator lokal.',
      );
    } catch {
      setGen({ phase: 'error', message: 'Jaringan terputus saat menghubungi server. Coba lagi.' });
      toast.error('Tidak bisa terhubung', 'Periksa koneksi Anda lalu coba lagi.');
    }
  }

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (gen.phase !== 'done') return;
    if (!contact.name.trim() || !contact.whatsapp.trim() || !contact.email.trim()) {
      setOrder({ phase: 'error', message: 'Lengkapi nama, WhatsApp, dan email sebelum mengirim pesanan.' });
      toast.error('Data kontak belum lengkap', 'Nama, WhatsApp, dan email wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      setOrder({ phase: 'error', message: 'Format email belum benar.' });
      toast.error('Format email belum benar', 'Contoh: nama@email.com');
      return;
    }
    setOrder({ phase: 'loading' });
    try {
      const selected = PACKAGES.find((p) => p.id === pkg) ?? PACKAGES[0];
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: gen.draftId,
          templateId,
          packageName: selected.name,
          contactName: contact.name.trim(),
          contactWhatsapp: contact.whatsapp.trim(),
          contactEmail: contact.email.trim(),
        }),
      });
      const result = await readJson<OrderCreatedResponse & { order: Order }>(res);
      if (!result.ok) {
        setOrder({ phase: 'error', message: result.error });
        toast.error('Pesanan gagal dikirim', result.error);
        return;
      }
      // Simpan nomor order terakhir agar /orders bisa menawarkan "Lanjutkan
      // pesanan terakhir" (lihat components/shop/LastOrderHint).
      try {
        localStorage.setItem(
          'craftai-last-order',
          JSON.stringify({
            number: result.data.orderNumber,
            id: result.data.order.id,
            at: Date.now(),
          }),
        );
      } catch {
        // Penyimpanan diblokir: lanjutkan redirect tanpa saran.
      }
      toast.success('Pesanan terkirim', `Nomor ${result.data.orderNumber} menuju developer.`);
      router.push(`/orders/${result.data.order.id}`);
    } catch {
      setOrder({ phase: 'error', message: 'Jaringan terputus saat mengirim pesanan. Coba lagi.' });
      toast.error('Tidak bisa terhubung', 'Periksa koneksi Anda lalu coba lagi.');
    }
  }

  const selectedPkg = PACKAGES.find((p) => p.id === pkg) ?? PACKAGES[0];

  if (templateError) {
    return (
      <main id="konten" className="flex-1 bg-paper">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div role="alert" className="border border-danger bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">Gagal membuka</p>
            <p className="mt-2 text-lg font-semibold leading-snug">
              Customizer tidak bisa dibuka: {templateError}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Penyebab paling umum: id template pada URL tidak ada lagi di katalog, atau permintaan
              ke server gagal diproses.
            </p>
            <Link
              href="/#katalog"
              className="mt-6 inline-flex min-h-11 items-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink"
            >
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="konten" className="flex-1 bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Kepala lembar kerja */}
        <div className="flex flex-col gap-6 border-b border-ink pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/#katalog"
              className="inline-flex min-h-11 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft hover:text-ink"
            >
              <span aria-hidden="true">&larr;</span> Kembali ke katalog
            </Link>
            <h1 className="mt-2 text-[30px] font-semibold leading-[1.02] tracking-tight sm:text-[42px]">
              {template ? template.name : 'Memuat template'}
              {template ? <span className="text-ink-soft">, lalu AI menyusun draftnya.</span> : null}
            </h1>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              {template
                ? `${categoryLabel(template.category)} / id ${template.id} / template ${formatRupiah(template.base_price)}`
                : 'Mengambil detail template dari server'}
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 border border-rule bg-surface p-4 lg:min-w-[260px]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Paket terpilih
            </dt>
            <dd className="font-mono text-[10px] text-ink">{selectedPkg.name}</dd>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Biaya eksekusi
            </dt>
            <dd className="font-mono text-[15px] text-ink">{formatRupiah(selectedPkg.price)}</dd>
          </dl>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="flex flex-col gap-8">
            {/* Formulir brief */}
            <form onSubmit={generate} className="border border-rule bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
                <h2 className="text-[15px] font-semibold">Brief modifikasi</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Langkah 02
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div>
                  <label htmlFor="brief-brand" className={labelClass}>
                    Nama brand / bisnis
                  </label>
                  <input
                    id="brief-brand"
                    name="brandName"
                    type="text"
                    required
                    aria-invalid={touched.brandName && Boolean(errors.brandName)}
                    aria-describedby={touched.brandName && errors.brandName ? 'err-brand' : undefined}
                    value={brief.brandName}
                    onChange={(e) => update('brandName', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, brandName: true }))}
                    className={fieldClass(touched.brandName && Boolean(errors.brandName))}
                    placeholder="Contoh: Kopi Senja Utama"
                  />
                  {touched.brandName && errors.brandName && (
                    <p id="err-brand" role="alert" className="mt-1.5 font-mono text-[11px] text-danger">
                      {errors.brandName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="brief-tagline" className={labelClass}>
                    Slogan / tagline singkat
                  </label>
                  <input
                    id="brief-tagline"
                    name="tagline"
                    type="text"
                    required
                    aria-invalid={touched.tagline && Boolean(errors.tagline)}
                    aria-describedby={touched.tagline && errors.tagline ? 'err-tagline' : undefined}
                    value={brief.tagline}
                    onChange={(e) => update('tagline', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, tagline: true }))}
                    className={fieldClass(touched.tagline && Boolean(errors.tagline))}
                    placeholder="Contoh: Rasa Otentik Kopi Nusantara"
                  />
                  {touched.tagline && errors.tagline && (
                    <p id="err-tagline" role="alert" className="mt-1.5 font-mono text-[11px] text-danger">
                      {errors.tagline}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="brief-desc" className={labelClass}>
                      Deskripsi &amp; nilai tambah
                    </label>
                    <span
                      id="desc-counter"
                      className={[
                        'mb-1.5 shrink-0 font-mono text-[11px]',
                        brief.description.trim().length > DESC_MAX
                          ? 'text-danger'
                          : descLength < DESC_MIN
                            ? 'text-ink-soft'
                            : 'text-ok',
                      ].join(' ')}
                      aria-live="polite"
                    >
                      {descLength}/{DESC_MAX}
                    </span>
                  </div>
                  <textarea
                    id="brief-desc"
                    name="description"
                    rows={4}
                    required
                    aria-invalid={touched.description && Boolean(errors.description)}
                    aria-describedby={touched.description && errors.description ? 'err-desc' : 'hint-desc'}
                    value={brief.description}
                    onChange={(e) => update('description', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, description: true }))}
                    className={`${fieldClass(touched.description && Boolean(errors.description))} min-h-[104px] resize-y`}
                    placeholder="Ceritakan produk, jam operasional, atau keunggulan bisnis Anda."
                  />
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    {touched.description && errors.description ? (
                      <p id="err-desc" role="alert" className="font-mono text-[11px] text-danger">
                        {errors.description}
                      </p>
                    ) : (
                      <p id="hint-desc" className="font-mono text-[11px] text-ink-soft">
                        Minimal {DESC_MIN} karakter.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="brief-color" className={labelClass}>
                      Warna aksen
                    </label>
                    <select
                      id="brief-color"
                      name="themeColor"
                      value={brief.themeColor}
                      onChange={(e) => update('themeColor', e.target.value as ThemeColorKey)}
                      className={inputClass}
                    >
                      {THEME_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="brief-cta" className={labelClass}>
                      Teks tombol utama
                    </label>
                    <input
                      id="brief-cta"
                      name="ctaText"
                      type="text"
                      required
                      aria-invalid={touched.ctaText && Boolean(errors.ctaText)}
                      aria-describedby={touched.ctaText && errors.ctaText ? 'err-cta' : undefined}
                      value={brief.ctaText}
                      onChange={(e) => update('ctaText', e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, ctaText: true }))}
                      className={fieldClass(touched.ctaText && Boolean(errors.ctaText))}
                      placeholder="Contoh: Pesan Sekarang"
                    />
                    {touched.ctaText && errors.ctaText && (
                      <p id="err-cta" role="alert" className="mt-1.5 font-mono text-[11px] text-danger">
                        {errors.ctaText}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="brief-tone" className={labelClass}>
                    Nada penulisan
                  </label>
                  <select
                    id="brief-tone"
                    name="toneOfVoice"
                    value={brief.toneOfVoice}
                    onChange={(e) => update('toneOfVoice', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, toneOfVoice: true }))}
                    aria-invalid={touched.toneOfVoice && Boolean(errors.toneOfVoice)}
                    className={inputClass}
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {touched.toneOfVoice && errors.toneOfVoice && (
                    <p role="alert" className="mt-1.5 font-mono text-[11px] text-danger">
                      {errors.toneOfVoice}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-rule p-5">
                <button
                  type="submit"
                  disabled={gen.phase === 'loading' || !briefValid}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)] disabled:translate-y-0 disabled:bg-rule disabled:text-ink-soft disabled:shadow-none"
                >
                  {gen.phase === 'loading' ? (
                    <>
                      <span
                        className="size-3.5 animate-spin border-2 border-current border-t-transparent motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      <span>AI sedang menyusun…</span>
                    </>
                  ) : (
                    <span>Generate Modifikasi AI</span>
                  )}
                </button>
                {!briefValid && (
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
                    Lengkapi kolom yang wajib diisi untuk mengaktifkan tombol.
                  </p>
                )}
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                  Konten disusun di server dari brief ini. Bila API key Gemini tidak tersedia,
                  generator lokal deterministik dipakai, dan badge engine menyatakan itu apa adanya.
                </p>
              </div>
            </form>

            {/* Checkout */}
            <form onSubmit={checkout} className="border border-rule bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
                <h2 className="text-[15px] font-semibold">Checkout &amp; kirim ke developer</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Langkah 03
                </span>
              </div>

              <div className="flex flex-col gap-5 p-5">
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  {gen.phase === 'done'
                    ? 'Draft siap dikirim. Pilih paket, lalu isi kontak yang bisa dihubungi developer.'
                    : 'Tombol kirim aktif setelah draft berhasil dibuat.'}
                </p>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Paket eksekusi
                  </legend>
                  {PACKAGES.map((p) => {
                    const active = pkg === p.id;
                    return (
                      <label
                        key={p.id}
                        className={[
                          'flex cursor-pointer items-start gap-3 border p-3.5 transition-colors',
                          active ? 'border-ink bg-paper' : 'border-rule bg-surface hover:border-ink',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="package"
                          value={p.id}
                          checked={active}
                          onChange={() => setPkg(p.id)}
                          className="mt-1 size-4 accent-[var(--accent)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <span className="text-[13px] font-semibold">Paket {p.name}</span>
                            <span className="font-mono text-[13px]">{formatRupiah(p.price)}</span>
                          </span>
                          <span className="mt-1 block text-[12px] leading-relaxed text-ink-soft">
                            {p.summary}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>
                      Nama lengkap
                    </label>
                    <input
                      id="contact-name"
                      name="contactName"
                      type="text"
                      required
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      className={inputClass}
                      placeholder="Nama pemesan"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-wa" className={labelClass}>
                      Nomor WhatsApp
                    </label>
                    <input
                      id="contact-wa"
                      name="contactWhatsapp"
                      type="tel"
                      required
                      inputMode="numeric"
                      value={contact.whatsapp}
                      onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                      className={inputClass}
                      placeholder="0812xxxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="contactEmail"
                    type="email"
                    required
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className={inputClass}
                    placeholder="nama@email.com"
                  />
                </div>

                <div className="border border-rule bg-paper p-4">
                  <p className="text-[12px] font-semibold">Yang terjadi setelah tombol kirim</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[12px] leading-relaxed text-ink-soft">
                    <li>Order dibuat dengan nomor UK-ORD-XXXX dan status Pembayaran.</li>
                    <li>Developer menulis kode, men-deploy, lalu mengisi URL live dan unduhan.</li>
                    <li>Pembayaran pada demo ini adalah simulasi, bukan transaksi nyata.</li>
                  </ul>
                </div>

                {order.phase === 'error' && (
                  <p
                    role="alert"
                    className="border border-danger bg-paper px-3 py-2 text-[12px] leading-relaxed text-danger"
                  >
                    {order.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={gen.phase !== 'done' || order.phase === 'loading'}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--accent)] disabled:translate-y-0 disabled:border-rule disabled:bg-rule disabled:text-ink-soft disabled:shadow-none"
                >
                  {order.phase === 'loading' ? (
                    <>
                      <span
                        className="size-3.5 animate-spin border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                      <span>Mengirim pesanan</span>
                    </>
                  ) : (
                    <span>Kirim ke Tim Developer untuk Dikerjakan</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Lembar preview */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-surface px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Lembar proof / hasil draft
              </span>
              <EngineBadge engine={gen.phase === 'done' ? gen.engine : null} />
            </div>

            {gen.phase === 'idle' && (
              <div className="flex min-h-[420px] flex-col justify-between gap-6 border border-t-0 border-rule bg-paper p-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Belum ada draft
                  </p>
                  <p className="mt-3 max-w-sm text-[17px] font-semibold leading-snug">
                    Lembar ini akan berisi halaman hasil olahan AI dari brief Anda.
                  </p>
                  <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                    Isi brief di kolom kiri, lalu tekan <strong className="text-ink">Generate Modifikasi AI</strong>.
                    Respons server dirender apa adanya, termasuk bila isinya berupa generator lokal.
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-4 font-mono text-[10px] text-ink-soft">
                  <dt>brand.name</dt>
                  <dd>isi brief</dd>
                  <dt>theme.primaryColor</dt>
                  <dd>pilihan warna</dd>
                  <dt>features</dt>
                  <dd>3 item</dd>
                  <dt>faq</dt>
                  <dd>2 item</dd>
                </dl>
              </div>
            )}

            {gen.phase === 'loading' && (
              <div
                className="min-h-[420px] animate-pulse border border-t-0 border-rule bg-paper p-6"
                aria-busy="true"
              >
                <span className="sr-only">Server sedang menyusun draft dari brief Anda</span>
                <div className="h-3 w-40 bg-rule" aria-hidden="true" />
                <div className="mt-4 h-6 w-3/4 bg-rule" aria-hidden="true" />
                <div className="mt-3 h-3 w-full bg-rule" aria-hidden="true" />
                <div className="mt-2 h-3 w-2/3 bg-rule" aria-hidden="true" />
                <div className="mt-6 grid grid-cols-3 gap-3" aria-hidden="true">
                  <div className="h-20 border border-rule bg-surface" />
                  <div className="h-20 border border-rule bg-surface" />
                  <div className="h-20 border border-rule bg-surface" />
                </div>
                <p className="mt-6 font-mono text-[10px] text-ink-soft">
                  Menyusun hero, tiga fitur, dan dua tanya jawab.
                </p>
              </div>
            )}

            {gen.phase === 'error' && (
              <div
                role="alert"
                className="flex min-h-[420px] flex-col justify-between gap-6 border border-t-0 border-danger bg-paper p-6"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-danger">
                    Draft gagal dibuat
                  </p>
                  <p className="mt-3 max-w-sm text-[17px] font-semibold leading-snug">
                    Server menolak brief ini.
                  </p>
                  <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                    {gen.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generate}
                  className="inline-flex min-h-11 w-fit items-center border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {gen.phase === 'done' && (
              <div data-testid="draft-preview" className="border border-t-0 border-rule">
                <DraftPreview draft={gen.content} />
                <div className="flex flex-wrap items-center justify-between gap-2 border-x border-b border-rule bg-surface px-4 py-2.5 font-mono text-[10px] text-ink-soft">
                  <span>draftId {gen.draftId}</span>
                  <span>Checkout di kolom kiri mengirim draft ini ke developer.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
