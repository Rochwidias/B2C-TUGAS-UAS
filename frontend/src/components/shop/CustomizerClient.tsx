'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

const THEME_OPTIONS: { value: ThemeColorKey; label: string }[] = [
  { value: 'amber', label: 'Warm Amber & Coffee' },
  { value: 'indigo', label: 'Tech Indigo & Blue' },
  { value: 'emerald', label: 'Fresh Emerald & Green' },
  { value: 'rose', label: 'Elegant Rose & Pink' },
];

const TONE_OPTIONS = ['Profesional', 'Santai & ramah', 'Energik & muda', 'Elegan & premium'];

// Prefill per kategori — brief contoh yang masuk akal untuk bisnis itu.
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
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5';

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
    themeColor: 'indigo',
    ctaText: '',
    toneOfVoice: 'Profesional',
  });

  const [gen, setGen] = useState<GenState>({ phase: 'idle' });
  const [order, setOrder] = useState<OrderState>({ phase: 'idle' });
  const [pkg, setPkg] = useState('pro');
  const [contact, setContact] = useState({ name: '', whatsapp: '', email: '' });

  useEffect(() => {
    let alive = true;
    fetch('/api/templates')
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
        // Isi contoh brief hanya sekali per template dan hanya bila belum ada
        // ketikan user, supaya navigasi ulang / generate ulang tidak pernah
        // menimpa atau menggabung isi form customer.
        setBrief((prev) => {
          const untouched = Object.values({
            brandName: prev.brandName,
            tagline: prev.tagline,
            description: prev.description,
            ctaText: prev.ctaText,
          }).every((value) => value.trim() === '');
          if (!untouched || prev.templateId === templateId) return prev;
          const preset = PRESET[found.category] ?? PRESET.fnb;
          return { ...prev, ...preset };
        });
      })
      .catch(() => alive && setTemplateError('Tidak bisa terhubung ke server.'));
    return () => {
      alive = false;
    };
  }, [templateId]);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  // dipakai baik sebagai submit handler maupun tombol "coba lagi"
  async function generate(e: { preventDefault: () => void }) {
    e.preventDefault();
    setGen({ phase: 'loading' });
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      const result = await readJson<DraftResponse>(res);
      if (!result.ok) {
        setGen({ phase: 'error', message: result.error });
        return;
      }
      setGen({
        phase: 'done',
        draftId: result.data.draftId,
        content: result.data.content,
        engine: result.data.engine,
      });
    } catch {
      setGen({ phase: 'error', message: 'Jaringan terputus saat menghubungi server. Coba lagi.' });
    }
  }

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (gen.phase !== 'done') return;
    if (!contact.name.trim() || !contact.whatsapp.trim() || !contact.email.trim()) {
      setOrder({ phase: 'error', message: 'Lengkapi nama, WhatsApp, dan email sebelum mengirim pesanan.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      setOrder({ phase: 'error', message: 'Format email belum benar.' });
      return;
    }
    setOrder({ phase: 'loading' });
    try {
      const selected = PACKAGES.find((p) => p.id === pkg) ?? PACKAGES[0];
      const res = await fetch('/api/orders', {
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
        return;
      }
      router.push(`/orders/${result.data.order.id}`);
    } catch {
      setOrder({ phase: 'error', message: 'Jaringan terputus saat mengirim pesanan. Coba lagi.' });
    }
  }

  const selectedPkg = PACKAGES.find((p) => p.id === pkg) ?? PACKAGES[0];

  if (templateError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 bg-slate-950 flex-1">
        <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-semibold mb-3">Customizer tidak bisa dibuka: {templateError}</p>
          <Link href="/#katalog" className="inline-block px-4 py-2 rounded-lg bg-slate-900 border border-rose-400/40 font-semibold text-rose-100 hover:bg-slate-800 transition">
            Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Judul & breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
          <div>
            <Link href="/#katalog" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 mb-2">
              <span aria-hidden="true">‹</span> Kembali ke katalog
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              AI Customizer: <span className="text-indigo-400">{template?.name ?? 'Memuat template…'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {template ? `Kategori ${categoryLabel(template.category)} · Template dasar ${formatRupiah(template.base_price)}` : 'Sedang memuat detail template'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Paket terpilih</span>
            <p className="text-xl font-bold text-emerald-400 font-mono">{formatRupiah(selectedPkg.price)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form brief */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={generate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <span className="text-indigo-400" aria-hidden="true">⚙</span>
                <h2 className="font-bold text-white">Instruksi Modifikasi Bisnis Anda</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="brief-brand" className={labelClass}>
                    Nama Brand / Bisnis
                  </label>
                  <input
                    id="brief-brand"
                    name="brandName"
                    type="text"
                    required
                    value={brief.brandName}
                    onChange={(e) => update('brandName', e.target.value)}
                    className={inputClass}
                    placeholder="Contoh: Kopi Senja Utama"
                  />
                </div>

                <div>
                  <label htmlFor="brief-tagline" className={labelClass}>
                    Slogan / Tagline Singkat
                  </label>
                  <input
                    id="brief-tagline"
                    name="tagline"
                    type="text"
                    required
                    value={brief.tagline}
                    onChange={(e) => update('tagline', e.target.value)}
                    className={inputClass}
                    placeholder="Contoh: Rasa Otentik Kopi Nusantara"
                  />
                </div>

                <div>
                  <label htmlFor="brief-desc" className={labelClass}>
                    Deskripsi &amp; Nilai Tambah
                  </label>
                  <textarea
                    id="brief-desc"
                    name="description"
                    rows={4}
                    required
                    value={brief.description}
                    onChange={(e) => update('description', e.target.value)}
                    className={inputClass}
                    placeholder="Ceritakan produk, jam operasional, atau keunggulan bisnis Anda."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brief-color" className={labelClass}>
                      Warna Aksen
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
                      Tombol Aksi Utama
                    </label>
                    <input
                      id="brief-cta"
                      name="ctaText"
                      type="text"
                      required
                      value={brief.ctaText}
                      onChange={(e) => update('ctaText', e.target.value)}
                      className={inputClass}
                      placeholder="Contoh: Pesan Sekarang"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="brief-tone" className={labelClass}>
                    Nada Penulisan
                  </label>
                  <select
                    id="brief-tone"
                    name="toneOfVoice"
                    value={brief.toneOfVoice}
                    onChange={(e) => update('toneOfVoice', e.target.value)}
                    className={inputClass}
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={gen.phase === 'loading'}
                className="mt-5 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                {gen.phase === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span>AI sedang menyusun konten…</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✦</span>
                    <span>Generate Modifikasi AI</span>
                  </>
                )}
              </button>

              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                Konten dibuat server kami dari brief ini. Bila API key Gemini tidak tersedia, sistem memakai generator
                lokal deterministik — badge di kanan akan menyatakan asalnya apa adanya.
              </p>
            </form>

            {/* Checkout */}
            <form onSubmit={checkout} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="font-bold text-white mb-1">Checkout &amp; Kirim ke Developer</h2>
              <p className="text-xs text-slate-500 mb-4">
                {gen.phase === 'done'
                  ? 'Draft siap dikirim. Pilih paket lalu isi kontak Anda.'
                  : 'Generate draft terlebih dahulu untuk mengaktifkan tombol kirim.'}
              </p>

              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Paket Eksekusi</legend>
                {PACKAGES.map((p) => {
                  const active = pkg === p.id;
                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        active ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={p.id}
                        checked={active}
                        onChange={() => setPkg(p.id)}
                        className="mt-1 accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-white">Paket {p.name}</span>
                          <span className="font-mono text-sm font-bold text-emerald-400">{formatRupiah(p.price)}</span>
                        </span>
                        <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">{p.summary}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>
                    Nama Lengkap
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
              </div>

              <div className="mt-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 p-4 text-xs text-slate-300">
                <span className="font-bold text-indigo-300 block mb-1">🛡 Garansi eksekusi human developer:</span>
                Draft yang Anda lihat akan dicek, dirapikan source code-nya, dioptimalkan, lalu di-deploy oleh tim kami.
                Pembayaran pada demo ini bersifat mock.
              </div>

              {order.phase === 'error' && (
                <p role="alert" className="mt-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {order.message}
                </p>
              )}

              <button
                type="submit"
                disabled={gen.phase !== 'done' || order.phase === 'loading'}
                className="mt-4 w-full py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                {order.phase === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span>Mengirim pesanan…</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✓</span>
                    <span>Kirim ke Tim Developer untuk Dikerjakan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-2xl border-t border-x border-slate-800 gap-3 flex-wrap">
              <span className="text-xs text-slate-400 font-mono">Live AI Preview Canvas</span>
              <EngineBadge engine={gen.phase === 'done' ? gen.engine : null} />
            </div>

            {gen.phase === 'idle' && (
              <div className="bg-slate-950 border border-slate-800 rounded-b-2xl min-h-[520px] flex flex-col items-center justify-center text-center p-8">
                <span className="text-4xl mb-4" aria-hidden="true">
                  {template?.emoji ?? '✦'}
                </span>
                <p className="text-slate-300 font-semibold">Preview akan muncul di sini</p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                  Isi brief di sebelah kiri, lalu tekan <strong className="text-slate-400">Generate Modifikasi AI</strong>.
                  Hasil draft dirender apa adanya dari server.
                </p>
              </div>
            )}

            {gen.phase === 'loading' && (
              <div className="bg-slate-950 border border-slate-800 rounded-b-2xl min-h-[520px] p-6 space-y-4 animate-pulse" aria-busy="true">
                <div className="h-8 w-1/2 bg-slate-800 rounded" />
                <div className="h-6 w-3/4 bg-slate-800 rounded mx-auto" />
                <div className="h-4 w-2/3 bg-slate-800 rounded mx-auto" />
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800">
                  <div className="h-20 bg-slate-800 rounded-xl" />
                  <div className="h-20 bg-slate-800 rounded-xl" />
                  <div className="h-20 bg-slate-800 rounded-xl" />
                </div>
                <p className="text-xs text-indigo-300 text-center">Server sedang menyusun draft dari brief Anda…</p>
              </div>
            )}

            {gen.phase === 'error' && (
              <div role="alert" className="bg-slate-950 border border-rose-500/40 rounded-b-2xl min-h-[520px] flex flex-col items-center justify-center text-center p-8">
                <span className="text-3xl mb-3" aria-hidden="true">⚠</span>
                <p className="text-rose-200 font-semibold">Generate gagal</p>
                <p className="text-sm text-rose-300/80 mt-2 max-w-md leading-relaxed">{gen.message}</p>
                <button
                  type="button"
                  onClick={generate}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 border border-rose-400/40 text-sm font-semibold text-rose-100 hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {gen.phase === 'done' && (
              <div data-testid="draft-preview">
                <DraftPreview draft={gen.content} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Draft ID: <span className="font-mono text-slate-400">{gen.draftId}</span>
                  </span>
                  <span>Bagian checkout di kiri mengirim draft ini ke developer.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}