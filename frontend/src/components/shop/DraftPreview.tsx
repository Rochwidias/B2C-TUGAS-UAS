import type { Draft } from './types';

// Ditenagai AI (gemini) atau generator lokal — keduanya mengikuti skema draft
// yang sama, jadi badge ini adalah satu-satunya penanda asal konten.
export function EngineBadge({ engine }: { engine: 'gemini' | 'local' | null | undefined }) {
  if (engine === 'gemini') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
        Dihasilkan Gemini AI
      </span>
    );
  }
  if (engine === 'local') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
        <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
        Generator lokal (tanpa API key)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
      <span className="w-2 h-2 rounded-full bg-slate-500" aria-hidden="true" />
      Belum digenerate
    </span>
  );
}

function tint(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}1a` : 'transparent';
}

export function DraftPreview({ draft }: { draft: Draft }) {
  const { brand, theme, heroSection, features, faq } = draft;

  return (
    <div className="rounded-b-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      {/* Bilah "browser" preview */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" aria-hidden="true" />
          <span className="text-xs text-slate-400 ml-2 font-mono truncate max-w-[45vw] sm:max-w-none">
            {brand.name.toLowerCase().replace(/\s+/g, '')}.craftai.site
          </span>
        </div>
      </div>

      {/* Konten website hasil draft */}
      <div className="p-4 sm:p-6">
        <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
              aria-hidden="true"
            >
              {brand.name.trim().charAt(0).toUpperCase() || 'W'}
            </span>
            <span className="font-bold text-lg text-white truncate">{brand.name}</span>
          </div>
          <span className="hidden sm:block text-xs font-mono text-slate-500 shrink-0">{theme.fontPairing}</span>
        </div>

        <div className="py-8 sm:py-10 text-center max-w-lg mx-auto">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold border inline-block mb-4"
            style={{ backgroundColor: tint(theme.primaryColor), color: theme.primaryColor, borderColor: `${theme.primaryColor}55` }}
          >
            {heroSection.badge}
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{heroSection.headline}</h3>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">{heroSection.subheadline}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {heroSection.ctaText}
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-900 border border-slate-800 text-slate-300"
            >
              Tentang Kami
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-6">
          {features.map((f) => (
            <div key={f.title} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-lg" aria-hidden="true">
                {f.icon}
              </div>
              <div className="text-xs font-bold text-white mt-1">{f.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 p-4" style={{ backgroundColor: tint(theme.accentColor) }}>
          <p className="text-sm text-slate-300 leading-relaxed">{brand.about}</p>
          <p className="mt-2 text-xs font-semibold" style={{ color: theme.accentColor }}>
            {brand.tagline}
          </p>
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-5">
          <h4 className="text-sm font-bold text-white mb-3">Pertanyaan Umum</h4>
          <dl className="space-y-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
                <dt className="text-xs font-semibold text-slate-200">{item.q}</dt>
                <dd className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}