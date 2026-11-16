import { DraftIcon } from './DraftIcon';
import type { Draft } from './types';

// Badge engine: satu-satunya penanda asal konten draft. Persegi, border 1.5px,
// huruf mono (DESIGN.md motif "cap status"), bukan pil.
export function EngineBadge({ engine }: { engine: 'gemini' | 'local' | null | undefined }) {
  const map = {
    gemini: { text: 'Engine: Gemini', cls: 'border-ok text-ok' },
    local: { text: 'Engine: lokal', cls: 'border-warn text-warn' },
  } as const;

  const entry = engine && map[engine];

  return (
    <span
      className={[
        'inline-flex items-center gap-2 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]',
        entry ? entry.cls : 'border-rule text-ink-soft',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={['size-1.5', entry ? 'bg-current' : 'border border-current'].join(' ')}
      />
      {entry ? entry.text : 'Belum digenerate'}
    </span>
  );
}

function tint(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : 'transparent';
}

// Pratinjau draft dirender apa adanya dari server, dibingkai seperti lembar
// proof cetak. Warna brand (primary/accent) datang dari data, jadi preview ini
// memang berbeda dari kanvas CraftAI: itu isi milik customer.
export function DraftPreview({ draft }: { draft: Draft }) {
  const { brand, theme, heroSection, features, faq } = draft;
  const slug = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'brand';

  return (
    <div className="border border-rule bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          Lembar proof / {slug}.craftai.site
        </span>
        <span className="font-mono text-[10px] text-ink-soft">Font: {theme.fontPairing}</span>
      </div>

      {/* Latar lembar memakai token surface/ink; hanya warna brand (data) yang
          ditulis inline, sehingga tema gelap tetap berfungsi. */}
      <div className="bg-surface px-4 py-6 text-ink sm:px-8 sm:py-10">
        <div className="flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: tint(theme.primaryColor, '33') }}>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid size-8 shrink-0 place-items-center text-[13px] font-bold"
              style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
              aria-hidden="true"
            >
              {brand.name.trim().charAt(0).toUpperCase() || 'W'}
            </span>
            <span className="truncate text-[15px] font-semibold text-ink">{brand.name}</span>
          </div>
          <span className="hidden shrink-0 font-mono text-[10px] text-ink-soft sm:block">draft</span>
        </div>

        <div className="mx-auto max-w-lg py-8 text-center sm:py-10">
          <span
            className="inline-block border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
            style={{
              backgroundColor: tint(theme.primaryColor, '14'),
              borderColor: tint(theme.primaryColor, '40'),
              color: theme.primaryColor,
            }}
          >
            {heroSection.badge}
          </span>
          <h3 className="mt-4 text-[26px] font-semibold leading-[1.1] tracking-tight sm:text-[32px]">
            {heroSection.headline}
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft sm:text-sm">
            {heroSection.subheadline}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span
              className="inline-flex min-h-11 items-center px-5 text-[13px] font-semibold"
              style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
            >
              {heroSection.ctaText}
            </span>
            <span
              className="inline-flex min-h-11 items-center border border-rule px-5 text-[13px] text-ink"
              style={{ borderColor: tint(theme.primaryColor, '40') }}
            >
              Tentang kami
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-3" style={{ borderColor: tint(theme.primaryColor, '26') }}>
          {features.map((f) => (
            <div
              key={f.title}
              className="border p-3"
              style={{ borderColor: tint(theme.primaryColor, '26') }}
            >
              <DraftIcon name={f.icon} className="size-4 text-ink" />
              <p className="mt-2 text-[12px] font-semibold leading-snug">{f.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-l-2 pl-4" style={{ borderColor: theme.accentColor }}>
          <p className="text-[13px] leading-relaxed text-ink">{brand.about}</p>
          <p className="mt-2 text-[12px] font-semibold" style={{ color: theme.accentColor }}>
            {brand.tagline}
          </p>
        </div>

        <div className="mt-6 border-t pt-5" style={{ borderColor: tint(theme.primaryColor, '26') }}>
          <h4 className="text-[13px] font-semibold">Pertanyaan umum</h4>
          <dl className="mt-3 flex flex-col gap-3">
            {faq.map((item) => (
              <div key={item.q} className="border p-3.5" style={{ borderColor: tint(theme.primaryColor, '26') }}>
                <dt className="text-[12px] font-semibold">{item.q}</dt>
                <dd className="mt-1 text-[12px] leading-relaxed text-ink-soft">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="border-t border-rule px-4 py-2 font-mono text-[10px] text-ink-soft">
        Warna, headline, fitur, dan tanya jawab di atas berasal dari respons server, bukan mockup.
      </p>
    </div>
  );
}
