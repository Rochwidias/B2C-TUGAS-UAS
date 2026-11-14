export default function JsonBlock({ value, label }: { value: unknown; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
        <h3 className="text-sm font-medium text-slate-200">{label}</h3>
        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
          JSON
        </span>
      </div>
      <pre className="max-h-[420px] overflow-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}