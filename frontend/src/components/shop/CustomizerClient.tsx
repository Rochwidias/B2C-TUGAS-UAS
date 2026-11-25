'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { DraftPreview, EngineBadge } from './DraftPreview';
import {
  THEME_OPTIONS,
  type Brief,
  type Draft,
  type DraftResponse,
  type Order,
  type OrderCreatedResponse,
  type PackageOption,
  type Template,
  type ThemeColorKey,
  categoryLabel,
  formatRupiah,
  packageEta,
  packageGuarantee,
  packageSummary,
  readJson,
} from './types';
import { API_BASE } from '@/lib/api';
import { FALLBACK_TEMPLATES, fetchCatalogResult } from '@/lib/catalog';
import { fetchPackages } from '@/lib/packages';

// Batas karakter brief. Dipakai bersama oleh validasi, penghitung, dan
// placeholder supaya angka maksimum hanya ditulis di satu tempat.
const DESC_MIN = 20;
const DESC_MAX = 800;
const BRAND_MIN = 2;

function briefKey(templateId: string): string {
  return `aether-brief-${templateId}`;
}

function legacyBriefKey(templateId: string): string {
  return `craftai-brief-${templateId}`;
}

// Draft brief disimpan di localStorage supaya formulir yang sudah diisi tidak
// hilang saat pindah halaman atau menutup tab. Key lama dibaca sebagai fallback
// supaya isian pelanggan sebelum redesign tidak lenyap.
function loadBriefDraft(templateId: string): Partial<Brief> | null {
  for (const key of [briefKey(templateId), legacyBriefKey(templateId)]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Partial<Brief>;
    } catch {
      // Storage diblokir atau JSON rusak: lanjut ke key berikutnya.
    }
  }
  return null;
}

const TONE_OPTIONS = ['Profesional', 'Santai & ramah', 'Energik & muda', 'Elegan & premium'];

// Prefill per segmen: contoh brief yang masuk akal untuk usaha itu, bukan data
// pelanggan sungguhan. Kolom tetap bisa dikosongkan.
const PRESET: Record<string, { brandName: string; tagline: string; description: string; ctaText: string }> = {
  kuliner: {
    brandName: 'Kopi Senja Utama',
    tagline: 'Rasa Otentik Kopi Nusantara di Jantung Kota',
    description:
      'Kami menyajikan biji kopi single origin roast medium-dark dengan suasana nyaman untuk nugas dan santai. Buka tiap hari 08.00 - 23.00, melayani pesan antar.',
    ctaText: 'Pesan Sekarang',
  },
  kreator: {
    brandName: 'Dimas Studio & Design',
    tagline: 'Karya Visual yang Bekerja untuk Brand Anda',
    description:
      'Studio desain independen yang fokus pada identitas visual, konten media sosial, dan materi kampanye untuk brand lokal dan startup.',
    ctaText: 'Ajak Kolaborasi',
  },
  toko: {
    brandName: 'UrbanStreet Wear',
    tagline: 'Fashion Streetwear Lokal Berkualitas',
    description:
      'Produksi limited edition, bahan combed 30s, pengiriman ke seluruh Indonesia lewat kurir reguler dan instan.',
    ctaText: 'Beli via WhatsApp',
  },
  // Kategori lama pada database yang belum dimigrasi.
  fnb: {
    brandName: 'Kopi Senja Utama',
    tagline: 'Rasa Otentik Kopi Nusantara di Jantung Kota',
    description:
      'Kami menyajikan biji kopi single origin roast medium-dark dengan suasana nyaman untuk nugas dan santai. Buka tiap hari 08.00 - 23.00, melayani pesan antar.',
    ctaText: 'Pesan Sekarang',
  },
  portfolio: {
    brandName: 'Dimas Studio & Design',
    tagline: 'Karya Visual yang Bekerja untuk Brand Anda',
    description:
      'Studio desain independen yang fokus pada identitas visual, konten media sosial, dan materi kampanye untuk brand lokal dan startup.',
    ctaText: 'Ajak Kolaborasi',
  },
  shop: {
    brandName: 'UrbanStreet Wear',
    tagline: 'Fashion Streetwear Lokal Berkualitas',
    description:
      'Produksi limited edition, bahan combed 30s, pengiriman ke seluruh Indonesia lewat kurir reguler dan instan.',
    ctaText: 'Beli via WhatsApp',
  },
};

const inputClass =
  'w-full min-h-11 border border-rule bg-paper px-3 py-2 text-sm text-ink transition-colors placeholder:text-ink-soft/70 focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const labelClass = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft';

// Kelas input dengan status validasi: garis danger + pesan saat field sudah
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

type PackagesState =
  | { phase: 'loading' }
  | { phase: 'ready'; packages: PackageOption[] }
  | { phase: 'error'; message: string };

export function CustomizerClient({ templateId }: { templateId: string }) {
  const router = useRouter();
  // Judul/header langsung terisi dari data bawaan: halaman tidak pernah
  // menampilkan "Memuat template" walau backend lambat. Data terbaru dari
  // server menyusul lewat fetchCatalogResult() di bawah.
  const [template, setTemplate] = useState<Template | null>(
    () => FALLBACK_TEMPLATES.find((t) => t.id === templateId) ?? null,
  );
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [catalogNote, setCatalogNote] = useState<string | null>(null);

  const [brief, setBrief] = useState<Brief>({
    templateId,
    brandName: '',
    tagline: '',
    description: '',
    themeColor: 'violet',
    ctaText: '',
    toneOfVoice: 'Profesional',
  });

  const [gen, setGen] = useState<GenState>({ phase: 'idle' });
  const [order, setOrder] = useState<OrderState>({ phase: 'idle' });
  const [pkgState, setPkgState] = useState<PackagesState>({ phase: 'loading' });
  const [pkgKey, setPkgKey] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: '', whatsapp: '', email: '' });
  // true setelah pengguna menyentuh sebuah field; pesan validasi baru muncul
  // setelah itu supaya formulir tidak terlihat "merah" sebelum diisi.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const toast = useToast();
  // Rekomendasi paket dari data template, dibaca lewat ref supaya pemilihan
  // awal tidak memicu fetch paket kedua saat data template menyusul.
  const recommendedRef = useRef<string | null>(null);

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

  const persistBrief = () => {
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
      persistBrief();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief, templateId]);

  // Simpan juga ketika tab disembunyikan/ditutup: debounce bisa belum jalan.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persistBrief();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', persistBrief);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', persistBrief);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => {
    let alive = true;
    // fetchCatalogResult membedakan "server gagal" dan "id tak dikenal",
    // sehingga kegagalan katalog tidak dianggap template tidak ada.
    fetchCatalogResult().then((result) => {
      if (!alive) return;
      const found = result.templates.find((t) => t.id === templateId);
      if (!found) {
        setTemplateError('Template tidak ditemukan. Pilih ulang dari katalog.');
        return;
      }
      setTemplate(found);
      recommendedRef.current = found.recommendedPackage ?? null;
      setCatalogNote(
        result.ok
          ? null
          : `${result.error ?? 'Katalog tidak terhubung ke server.'} Contoh bawaan dipakai sementara.`,
      );
      // Pulihkan draft tersimpan hanya untuk kolom yang masih kosong, lalu
      // isi preset segmen bila kolom tetap kosong. Satu updater, satu render.
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
        const preset = PRESET[found.category] ?? PRESET.kuliner;
        return { ...restored, ...preset };
      });
    });
    return () => {
      alive = false;
    };
  }, [templateId]);

  // Kartu paket dari GET /api/packages: satu-satunya sumber harga, kuota,
  // estimasi, dan garansi di halaman ini (docs/REDESIGN.md §2).
  const loadPackages = async () => {
    setPkgState({ phase: 'loading' });
    const result = await fetchPackages();
    if (!result.ok) {
      setPkgState({ phase: 'error', message: result.error ?? 'Daftar paket tidak bisa dimuat.' });
      return;
    }
    setPkgState({ phase: 'ready', packages: result.packages });
    // Pilihan awal mengikuti rekomendasi paket untuk segmen ini bila ada.
    setPkgKey((current) => {
      if (current && result.packages.some((pkg) => pkg.key === current)) return current;
      const suggested = template?.recommendedPackage;
      const preferred = suggested ? result.packages.find((pkg) => pkg.key === suggested) : undefined;
      return (preferred ?? result.packages[0]).key;
    });
  };

  // Pemuatan awal kartu paket memakai rantai promise (tanpa setState sinkron
  // di dalam effect); loadPackages() tetap dipakai tombol coba lagi.
  useEffect(() => {
    let alive = true;
    fetchPackages().then((result) => {
      if (!alive) return;
      if (!result.ok) {
        setPkgState({ phase: 'error', message: result.error ?? 'Daftar paket tidak bisa dimuat.' });
        return;
      }
      setPkgState({ phase: 'ready', packages: result.packages });
      setPkgKey((current) => {
        if (current && result.packages.some((pkg) => pkg.key === current)) return current;
        const suggested = recommendedRef.current;
        const preferred = suggested ? result.packages.find((pkg) => pkg.key === suggested) : undefined;
        return (preferred ?? result.packages[0]).key;
      });
    });
    return () => {
      alive = false;
    };
  }, []);

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

  // Dipakai baik sebagai submit handler maupun tombol "coba lagi" di panel
  // preview (oleh sebab itu parameter event bersifat opsional).
  async function generate(e?: { preventDefault: () => void }) {
    e?.preventDefault();
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
        'Draft poster berhasil dibuat',
        result.data.engine === 'gemini' ? 'Disusun oleh Gemini.' : 'Disusun oleh generator lokal.',
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
    const selected = pkgState.phase === 'ready' ? pkgState.packages.find((pkg) => pkg.key === pkgKey) : null;
    if (!selected) {
      setOrder({ phase: 'error', message: 'Pilih paket yang tersedia sebelum mengirim pesanan.' });
      toast.error('Paket belum dipilih', 'Muat ulang daftar paket lalu pilih salah satu.');
      return;
    }
    setOrder({ phase: 'loading' });
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: gen.draftId,
          templateId,
          packageKey: selected.key,
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
      toast.success('Pesanan terkirim', `Nomor ${result.data.orderNumber} masuk antrean editor.`);
      router.push(`/orders/${result.data.order.id}`);
    } catch {
      setOrder({ phase: 'error', message: 'Jaringan terputus saat mengirim pesanan. Coba lagi.' });
      toast.error('Tidak bisa terhubung', 'Periksa koneksi Anda lalu coba lagi.');
    }
  }

  const packages = pkgState.phase === 'ready' ? pkgState.packages : [];
  const selectedPkg = packages.find((pkg) => pkg.key === pkgKey) ?? null;

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
              Penyebab paling umum: id contoh poster pada URL tidak ada lagi di katalog, atau
              permintaan ke server gagal diproses.
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
              {template ? template.name : 'Memuat contoh poster'}
              {template ? <span className="text-ink-soft">, lalu AI menyusun draft posternya.</span> : null}
            </h1>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              {template
                ? `${categoryLabel(template.category)} / id ${template.id} / harga satuan ${formatRupiah(template.base_price)}`
                : 'Mengambil detail contoh poster dari server'}
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 border border-rule bg-surface p-4 lg:min-w-[260px]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Paket terpilih
            </dt>
            <dd className="font-mono text-[10px] text-ink">
              {selectedPkg ? selectedPkg.name : pkgState.phase === 'error' ? 'belum tersedia' : 'memuat…'}
            </dd>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">Total bayar</dt>
            <dd className="font-mono text-[15px] text-ink">
              {selectedPkg ? formatRupiah(selectedPkg.price) : '—'}
            </dd>
          </dl>
        </div>

        {catalogNote && (
          <p
            role="status"
            className="mt-4 border border-warn bg-surface px-4 py-3 font-mono text-[11px] leading-relaxed text-warn"
          >
            {catalogNote}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="flex flex-col gap-8">
            {/* Formulir brief */}
            <form onSubmit={generate} className="border border-rule bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
                <h2 className="text-[15px] font-semibold">Brief merek</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Langkah 01
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
                    placeholder="Ceritakan produk, jam operasional, atau keunggulan usaha Anda."
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
                      Warna aksen poster
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
                    <span>Generate Draft Poster AI</span>
                  )}
                </button>
                {!briefValid && (
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-soft">
                    Lengkapi kolom yang wajib diisi untuk mengaktifkan tombol.
                  </p>
                )}
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                  Draft disusun di server dari brief ini. Bila API key Gemini tidak tersedia,
                  generator lokal deterministik dipakai, dan badge engine menyatakan itu apa
                  adanya.
                </p>
              </div>
            </form>

            {/* Checkout */}
            <form onSubmit={checkout} className="border border-rule bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
                <h2 className="text-[15px] font-semibold">Checkout &amp; kirim pesanan</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Langkah 03
                </span>
              </div>

              <div className="flex flex-col gap-5 p-5">
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  {gen.phase === 'done'
                    ? 'Draft siap dikirim. Pilih paket, lalu isi kontak yang bisa dihubungi editor.'
                    : 'Tombol kirim aktif setelah draft poster berhasil dibuat.'}
                </p>

                {/* Kartu paket dari GET /api/packages: ETA + garansi tampil
                    di sini, sebelum tombol bayar. */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Pilih paket
                  </legend>

                  {pkgState.phase === 'loading' && (
                    <div aria-busy="true" className="border border-rule bg-paper p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Memuat daftar paket
                      </p>
                      <div className="mt-3 h-4 w-1/2 animate-pulse bg-rule" aria-hidden="true" />
                    </div>
                  )}

                  {pkgState.phase === 'error' && (
                    <div role="alert" className="border border-danger bg-paper p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">
                        Daftar paket tidak tersedia
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                        {pkgState.message} Harga, estimasi, dan garansi tidak bisa dipastikan sampai
                        server menjawab.
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadPackages()}
                        className="mt-3 inline-flex min-h-11 items-center border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}

                  {pkgState.phase === 'ready' &&
                    packages.map((p) => {
                      const active = pkgKey === p.key;
                      const eta = packageEta(p);
                      const guarantee = packageGuarantee(p);
                      return (
                        <label
                          key={p.key}
                          className={[
                            'flex cursor-pointer items-start gap-3 border p-3.5 transition-colors',
                            active ? 'border-ink bg-paper' : 'border-rule bg-surface hover:border-ink',
                          ].join(' ')}
                        >
                          <input
                            type="radio"
                            name="package"
                            value={p.key}
                            checked={active}
                            onChange={() => setPkgKey(p.key)}
                            className="mt-1 size-4 accent-[var(--accent)]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <span className="text-[13px] font-semibold">{p.name}</span>
                              <span className="font-mono text-[13px]">{formatRupiah(p.price)}</span>
                            </span>
                            <span className="mt-1 block text-[12px] leading-relaxed text-ink-soft">
                              {packageSummary(p)}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-ink-soft">
                              <span>Estimasi: {eta || '—'}</span>
                              <span>Garansi: {guarantee || '—'}</span>
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

                {/* Ringkasan transparansi sebelum bayar. */}
                <div className="border border-rule bg-paper p-4">
                  <p className="text-[12px] font-semibold">Sebelum Anda bayar</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[12px] leading-relaxed text-ink-soft">
                    <li>
                      {selectedPkg
                        ? `${selectedPkg.name}: ${formatRupiah(selectedPkg.price)} untuk ${selectedPkg.quota} poster.`
                        : 'Pilih paket untuk melihat total yang dibayar.'}
                    </li>
                    <li>
                      {selectedPkg && packageEta(selectedPkg)
                        ? `Estimasi pengerjaan ${packageEta(selectedPkg)}.`
                        : 'Estimasi pengerjaan ditampilkan setelah daftar paket dimuat.'}
                    </li>
                    <li>
                      {selectedPkg && packageGuarantee(selectedPkg)
                        ? `Garansi: ${packageGuarantee(selectedPkg)}.`
                        : 'Garansi revisi mengikuti paket yang dipilih.'}
                    </li>
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
                  disabled={gen.phase !== 'done' || order.phase === 'loading' || !selectedPkg}
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
                    <span>Kirim Pesanan untuk Dikerjakan</span>
                  )}
                </button>
                {pkgState.phase !== 'ready' && (
                  <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                    Tombol kirim aktif setelah daftar paket berhasil dimuat.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Lembar preview poster */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-surface px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Live preview / poster 4:5
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
                    Panel ini akan menampilkan poster hasil olahan AI dari brief Anda.
                  </p>
                  <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                    Isi brief di kolom kiri, lalu tekan{' '}
                    <strong className="text-ink">Generate Draft Poster AI</strong>. Respons server
                    dirender apa adanya, termasuk bila isinya berupa generator lokal.
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-4 font-mono text-[10px] text-ink-soft">
                  <dt>poster.badge</dt>
                  <dd>isi brief</dd>
                  <dt>poster.headline</dt>
                  <dd>judul besar</dd>
                  <dt>poster.ctaText</dt>
                  <dd>tombol ajakan</dd>
                  <dt>points</dt>
                  <dd>tepat 3 item</dd>
                </dl>
              </div>
            )}

            {gen.phase === 'loading' && (
              <div
                className="min-h-[420px] animate-pulse border border-t-0 border-rule bg-paper p-6"
                aria-busy="true"
              >
                <span className="sr-only">Server sedang menyusun draft poster dari brief Anda</span>
                <div className="mx-auto aspect-[4/5] w-full max-w-[420px] border border-rule bg-surface p-5">
                  <div className="h-3 w-32 bg-rule" aria-hidden="true" />
                  <div className="mt-6 h-6 w-3/4 bg-rule" aria-hidden="true" />
                  <div className="mt-3 h-3 w-full bg-rule" aria-hidden="true" />
                  <div className="mt-2 h-3 w-2/3 bg-rule" aria-hidden="true" />
                  <div className="mt-6 h-8 w-40 bg-rule" aria-hidden="true" />
                  <div className="mt-8 grid grid-cols-3 gap-3" aria-hidden="true">
                    <div className="h-16 bg-rule" />
                    <div className="h-16 bg-rule" />
                    <div className="h-16 bg-rule" />
                  </div>
                </div>
                <p className="mt-6 font-mono text-[10px] text-ink-soft">
                  Menyusun badge, headline, subheadline, tombol ajakan, dan tiga poin.
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
                  onClick={() => void generate()}
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
                  <span>Checkout di kolom kiri mengirim draft ini ke editor.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}