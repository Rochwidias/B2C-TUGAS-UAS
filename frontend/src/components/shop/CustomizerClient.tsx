'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  THEME_OPTIONS,
  type Brief,
  type OrderBriefPayload,
  type OrderContact,
  categoryLabel,
  formatRupiah,
  packageEta,
  packageGuarantee,
  packageSummary,
  whatsappStageHint,
} from './types';
import { contactChatUrl, useContact } from './whatsapp';
import { getTemplateById } from '@/lib/catalog';
import { PACKAGES } from '@/lib/packages';
import { createOrder, setLastOrder } from '@/lib/orders-store';

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

// Status pesanan: idle → error, atau selesai dengan nomor pesanan plus tautan
// wa.me (docs/FRONTEND-ONLY.md — order dicatat di penyimpanan lokal).
type OrderState =
  | { phase: 'idle' }
  | { phase: 'error'; message: string }
  | {
      phase: 'done';
      orderNumber: string;
      orderId: string;
      status: string;
      /** Tautan WhatsApp dengan pesan berisi nomor order. */
      whatsappUrl: string;
    };

export function CustomizerClient({ templateId }: { templateId: string }) {
  // Template dari katalog statis: tidak pernah "memuat", langsung tersedia.
  const template = getTemplateById(templateId);

  const [brief, setBrief] = useState<Brief>({
    templateId,
    brandName: '',
    tagline: '',
    description: '',
    themeColor: 'violet',
    ctaText: '',
    toneOfVoice: 'Profesional',
  });

  const [order, setOrder] = useState<OrderState>({ phase: 'idle' });
  const [contact, setContact] = useState({ name: '', whatsapp: '', email: '' });
  // Kontak WhatsApp resmi — konstanta statis dari env publik.
  const contactInfo = useContact();
  // true setelah pengguna menyentuh sebuah field; pesan validasi baru muncul
  // setelah itu supaya formulir tidak terlihat "merah" sebelum diisi.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const toast = useToast();
  // Paket dari daftar statis; pilihan awal mengikuti rekomendasi segmen bila ada.
  const recommended = template?.recommendedPackage;
  const [pkgKey, setPkgKey] = useState<string>(
    recommended && PACKAGES.some((pkg) => pkg.key === recommended)
      ? recommended
      : (PACKAGES[0]?.key ?? ''),
  );

  // Simpan draft setiap kali brief berubah (debounce ringan) agar tidak hilang.
  // Simpanan terakhir WAJIB di-flush saat unmount, bukan dibatalkan, supaya
  // draft yang diketik tepat sebelum pindah halaman tidak hilang.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const briefRef = useRef(brief);
  // true setelah draft tersimpan selesai dipulihkan oleh effect restore.
  // Semua penulisan draft WAJIB menunggu flag ini: tanpa itu, unmount
  // StrictMode (double-mount di dev) menimpa draft tersimpan dengan isian
  // kosong awal sebelum pemulihan sempat membacanya.
  const hydratedRef = useRef(false);

  // Ref hanya untuk dibaca di handler unmount/visibilitychange, jadi
  // penugasannya dilakukan di effect (bukan saat render).
  useEffect(() => {
    briefRef.current = brief;
  }, [brief]);

  const persistBrief = () => {
    // Belum pulih → belum ada isian pengguna; menulis sekarang berarti
    // menimpa draft tersimpan dengan kosong (bug test_05).
    if (!hydratedRef.current) return;
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
      if (!hydratedRef.current) return;
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
      document.removeEventListener('pagehide', persistBrief);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // Pulihkan draft tersimpan hanya untuk kolom yang masih kosong, lalu isi
  // preset segmen bila semua kolom tetap kosong. Satu updater, satu render.
  // Pemulihan dibungkus microtask supaya tidak ada setState sinkron di effect
  // (react-hooks/set-state-in-effect), sama seperti pola pemuatan data async.
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
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
        const preset = PRESET[template?.category ?? 'kuliner'] ?? PRESET.kuliner;
        return { ...restored, ...preset };
      });
      // Pemulihan selesai — sejak sini penulisan draft aman.
      hydratedRef.current = true;
    });
    return () => {
      alive = false;
    };
  }, [templateId, template?.category]);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const descLength = brief.description.trim().length;

  // Validasi per field mengikuti batas yang ditampilkan ke pengguna. Dipakai
  // untuk menonaktifkan tombol kirim pesanan dan menampilkan pesan Bahasa Indonesia.
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

  // Satu aksi kirim: pesanan dicatat di store lokal, lalu konfirmasi dan serah
  // terima berpindah ke chat WhatsApp (docs/FRONTEND-ONLY.md).
  function submitOrder(e: React.FormEvent) {
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
    const name = contact.name.trim();
    const whatsapp = contact.whatsapp.trim();
    const email = contact.email.trim();
    if (!name || !whatsapp) {
      setOrder({
        phase: 'error',
        message: 'Lengkapi nama dan nomor WhatsApp sebelum mengirim pesanan.',
      });
      toast.error('Data kontak belum lengkap', 'Nama dan WhatsApp wajib diisi.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOrder({ phase: 'error', message: 'Format email belum benar.' });
      toast.error('Format email belum benar', 'Contoh: nama@email.com');
      return;
    }
    const selected = PACKAGES.find((pkg) => pkg.key === pkgKey) ?? null;
    if (!selected) {
      setOrder({ phase: 'error', message: 'Pilih paket yang tersedia sebelum mengirim pesanan.' });
      toast.error('Paket belum dipilih', 'Pilih salah satu paket lalu kirim ulang.');
      return;
    }
    const orderContact: OrderContact = { name, whatsapp, ...(email ? { email } : {}) };
    // Susun OrderBriefPayload: medan kontrak merekLokasi/segmenTarget/suasanaMerek/
    // aksiUtama/nadaRekaman diisi dari isian form yang tersedia, di samping medan
    // brief lama supaya ringkasan di back-office tetap terbaca lengkap.
    const payload: OrderBriefPayload = {
      templateId,
      brandName: brief.brandName.trim(),
      tagline: brief.tagline.trim(),
      description: brief.description.trim(),
      themeColor: brief.themeColor,
      ctaText: brief.ctaText.trim(),
      toneOfVoice: brief.toneOfVoice.trim(),
      merekLokasi: brief.brandName.trim(),
      segmenTarget: brief.description.trim(),
      suasanaMerek: brief.toneOfVoice.trim(),
      aksiUtama: brief.ctaText.trim(),
      nadaRekaman: brief.toneOfVoice.trim(),
    };
    // Order dicatat ke penyimpanan lokal (nomor UK-ORD-XXXX unik, status draft).
    const created = createOrder({
      templateId,
      packageName: selected.name,
      packageKey: selected.key,
      quota: selected.quota,
      price: selected.price,
      contact: orderContact,
      brief: payload,
    });
    // Pintasan "Lanjutkan pesanan terakhir" di halaman lacak.
    setLastOrder({ number: created.order_number, id: created.id, status: created.status });
    const whatsappUrl = contactChatUrl(
      contactInfo,
      created.order_number,
      whatsappStageHint(created.status),
    );
    setOrder({
      phase: 'done',
      orderNumber: created.order_number,
      orderId: created.id,
      status: created.status,
      whatsappUrl: whatsappUrl ?? '',
    });
    toast.success(
      'Pesanan tercatat',
      `Nomor ${created.order_number} masuk antrean editor. Konfirmasi berjalan di WhatsApp.`,
    );
  }

  // Tautan "Buka WhatsApp": hasil susunan contactChatUrl berisi nomor order.
  const openWhatsappUrl = useMemo(() => {
    const done = order.phase === 'done' ? order : null;
    if (!done) return null;
    const direct = done.whatsappUrl.trim();
    return direct || contactChatUrl(contactInfo, done.orderNumber, whatsappStageHint(done.status));
  }, [order, contactInfo]);

  const selectedPkg = PACKAGES.find((pkg) => pkg.key === pkgKey) ?? null;

  if (!template) {
    return (
      <main id="konten" className="flex-1 bg-paper">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div role="alert" className="border border-danger bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">Gagal membuka</p>
            <p className="mt-2 text-lg font-semibold leading-snug">
              Customizer tidak bisa dibuka: template tidak ditemukan. Pilih ulang dari katalog.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Penyebab paling umum: id contoh poster pada URL tidak ada di katalog.
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
              {template.name}
              <span className="text-ink-soft">, lalu pesanannya dikirim lewat WhatsApp.</span>
            </h1>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              {`${categoryLabel(template.category)} / id ${template.id} / harga satuan ${formatRupiah(template.base_price)}`}
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 border border-rule bg-surface p-4 lg:min-w-[260px]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Paket terpilih
            </dt>
            <dd className="font-mono text-[10px] text-ink">{selectedPkg?.name ?? '—'}</dd>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">Total bayar</dt>
            <dd className="font-mono text-[15px] text-ink">
              {selectedPkg ? formatRupiah(selectedPkg.price) : '—'}
            </dd>
          </dl>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="flex flex-col gap-8">
            {/* Formulir brief */}
            {/* Formulir brief tidak mengirim apa pun sendiri: isian baru
                berangkat bersama pesanan pada Langkah 02. */}
            <form onSubmit={(e) => e.preventDefault()} className="border border-rule bg-surface">
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
                      onChange={(e) => update('themeColor', e.target.value as Brief['themeColor'])}
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
                {!briefValid && (
                  <p className="mb-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                    Lengkapi kolom yang wajib diisi. Tombol kirim di Langkah 02 baru aktif setelah
                    brief lengkap.
                  </p>
                )}
                <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                  Brief ini dikirim bersama pesanan dan dibaca oleh editor manusia yang menyusun
                  poster Anda. Tidak ada generator otomatis yang memprosesnya.
                </p>
              </div>
            </form>

            {/* Pesanan via WhatsApp */}
            <form onSubmit={submitOrder} className="border border-rule bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-3">
                <h2 className="text-[15px] font-semibold">Paket, kontak &amp; kirim pesanan</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  Langkah 02
                </span>
              </div>

              <div className="flex flex-col gap-5 p-5">
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  Pesanan dicatat di web, lalu konfirmasi, pembayaran, dan serah terima poster
                  berjalan di WhatsApp. Nomor pesanan tampil di layar setelah tombol ditekan.
                </p>

                {/* Kartu paket statis: ETA + garansi tampil di sini, sebelum tombol bayar. */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Pilih paket
                  </legend>

                  {PACKAGES.map((p) => {
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
                    Email (opsional)
                  </label>
                  <input
                    id="contact-email"
                    name="contactEmail"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className={inputClass}
                    placeholder="nama@email.com"
                  />
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-ink-soft">
                    Cukup diisi bila Anda ingin salinan konfirmasi juga dikirim ke email.
                  </p>
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
                        : 'Estimasi pengerjaan mengikuti paket yang dipilih.'}
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
                  disabled={!selectedPkg || !briefValid}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--accent)] disabled:translate-y-0 disabled:border-rule disabled:bg-rule disabled:text-ink-soft disabled:shadow-none"
                >
                  <span>Kirim Pesanan via WhatsApp</span>
                </button>
                {!briefValid && (
                  <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                    Lengkapi brief pada Langkah 01 untuk mengaktifkan tombol kirim.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Konfirmasi pesanan: nomor order + chat WhatsApp */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-surface px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Konfirmasi pesanan / via WhatsApp
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                {order.phase === 'done' ? 'Pesanan tercatat' : 'Langkah 03'}
              </span>
            </div>

            {order.phase === 'idle' && (
              <div className="flex min-h-[420px] flex-col justify-between gap-6 border border-t-0 border-rule bg-paper p-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    Belum ada nomor pesanan
                  </p>
                  <p className="mt-3 max-w-sm text-[17px] font-semibold leading-snug">
                    Pesanan dicatat di web, konfirmasi dan serah terimanya lewat WhatsApp.
                  </p>
                  <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                    Setelah tombol kirim ditekan, panel ini menampilkan nomor pesanan beserta dua
                    tautan: membuka chat WhatsApp yang sudah terisi, dan mengecek status pesanan
                    Anda.
                  </p>
                </div>
                <ol className="flex flex-col gap-2 border-t border-rule pt-4 text-[12px] leading-relaxed text-ink-soft">
                  <li>
                    <span className="font-mono text-[10px] text-ink">01</span> — Editor mencatat
                    pesanan Anda dengan nomor urut.
                  </li>
                  <li>
                    <span className="font-mono text-[10px] text-ink">02</span> — Harga, estimasi,
                    dan revisi dikonfirmasi di chat WhatsApp.
                  </li>
                  <li>
                    <span className="font-mono text-[10px] text-ink">03</span> — Poster dikirim
                    tuntas; status tetap bisa dicek kapan saja.
                  </li>
                </ol>
              </div>
            )}

            {order.phase === 'error' && (
              <div role="alert" className="border border-t-0 border-danger bg-paper p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-danger">
                  Pesanan gagal dikirim
                </p>
                <p className="mt-3 max-w-sm text-[17px] font-semibold leading-snug">
                  Pesanan ini belum bisa dicatat.
                </p>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                  {order.message}
                </p>
              </div>
            )}

            {order.phase === 'done' && (
              <div data-testid="order-created" className="border border-t-0 border-rule bg-paper">
                <div className="border-b border-rule p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ok">
                    Pesanan tercatat
                  </p>
                  <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">
                    Nomor pesanan Anda
                  </p>
                  <p className="mt-1 font-mono text-[34px] font-semibold leading-none tracking-tight">
                    {order.orderNumber}
                  </p>
                  <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-rule pt-4 font-mono text-[10px] text-ink-soft">
                    <dt>paket</dt>
                    <dd className="truncate text-ink">{selectedPkg?.name ?? '—'}</dd>
                    <dt>total</dt>
                    <dd className="text-ink">
                      {selectedPkg ? formatRupiah(selectedPkg.price) : '—'}
                    </dd>
                    <dt>status</dt>
                    <dd className="text-ink">{order.status}</dd>
                    <dt>estimasi</dt>
                    <dd className="text-ink">{selectedPkg ? packageEta(selectedPkg) || '—' : '—'}</dd>
                  </dl>
                </div>

                <div className="border-b border-rule p-6">
                  <p className="text-[13px] leading-relaxed text-ink-soft">
                    Chat WhatsApp sudah berisi nomor pesanan, paket, estimasi, serta ringkasan brief
                    Anda: {whatsappStageHint(order.status)}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={openWhatsappUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-ink bg-accent px-4 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)]"
                    >
                      <span>Buka WhatsApp</span>
                    </a>
                    <Link
                      href={`/orders?number=${encodeURIComponent(order.orderNumber)}`}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-ink bg-surface px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
                    >
                      <span>Cek Status Pesanan</span>
                    </Link>
                  </div>
                  {!openWhatsappUrl && (
                    <p className="mt-3 font-mono text-[10px] leading-relaxed text-danger">
                      Tautan WhatsApp belum tersedia. Buka chat resmi kami dan sebutkan nomor
                      pesanan di atas.
                    </p>
                  )}
                  {contactInfo?.whatsappNumber && (
                    <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                      Nomor resmi: {contactInfo.whatsappNumber}
                    </p>
                  )}
                </div>

                <div className="p-6">
                  <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                    Simpan nomor {order.orderNumber}. Halaman Lacak Pesanan menerima nomor tersebut
                    kapan saja lewat kolom pencarian.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOrder({ phase: 'idle' })}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-ink bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-ink hover:text-paper"
                  >
                    Kirim pesanan baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
