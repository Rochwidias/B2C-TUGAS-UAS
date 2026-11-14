export default function EmptyState({
  title,
  description,
  icon = '◌',
}: {
  title: string;
  description: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-8 text-center">
      <span aria-hidden="true" className="text-2xl text-slate-600">
        {icon}
      </span>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="max-w-[36ch] text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}