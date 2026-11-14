import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { type Template, categoryLabel, formatRupiah } from './types';

// preview_gradient disimpan sebagai utility Tailwind penuh (contoh:
// "from-amber-900/40 to-orange-950/40") sehingga class-nya tetap terbaca
// scanner Tailwind.
const GRADIENT_PREFIX = 'bg-gradient-to-tr ';

export function TemplateCard({ template }: { template: Template }) {
  const gradient = template.preview_gradient.startsWith('bg-')
    ? template.preview_gradient
    : `${GRADIENT_PREFIX}${template.preview_gradient}`;

  return (
    <article className="group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition flex flex-col h-full">
      <div
        className={`h-44 ${gradient} p-4 relative flex items-center justify-center border-b border-slate-800`}
      >
        <span className="text-5xl" aria-hidden="true">
          {template.emoji}
        </span>
        <span className="absolute top-3 left-3 bg-slate-950/80 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-700">
          {categoryLabel(template.category)}
        </span>
        <span className="absolute bottom-3 right-3 text-xs bg-slate-950/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">
          {formatRupiah(template.base_price)}
        </span>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition">
            {template.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">{template.description}</p>
        </div>
        <Link
          href={`/customizer/${template.id}`}
          className="mt-6 w-full py-2.5 rounded-xl font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 hover:border-indigo-600 transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Kustomisasi dengan AI</span>
        </Link>
      </div>
    </article>
  );
}