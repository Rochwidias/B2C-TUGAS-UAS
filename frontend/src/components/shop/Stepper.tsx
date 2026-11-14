import { STATUS_STEPS, type OrderStatus, type OrderLog } from './types';

function fmt(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function Stepper({ status, logs }: { status: OrderStatus; logs?: OrderLog[] }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const noteByStep = new Map<string, string>();
  (logs ?? []).forEach((log) => {
    if (log.developer_note) noteByStep.set(log.status_to, log.developer_note);
  });

  return (
    <div>
      <ol className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
        {STATUS_STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
          return (
            <li key={step.key} className="flex flex-col items-center" aria-current={state === 'active' ? 'step' : undefined}>
              <span
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center mb-2 font-bold text-sm border',
                  state === 'done' && 'bg-emerald-500 text-slate-950 border-emerald-400',
                  state === 'active' && 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/40',
                  state === 'pending' && 'bg-slate-800 text-slate-500 border-slate-700',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={[
                  'font-semibold',
                  state === 'done' && 'text-emerald-400',
                  state === 'active' && 'text-indigo-300',
                  state === 'pending' && 'text-slate-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {noteByStep.has(step.key) ? noteByStep.get(step.key) : step.hint}
              </span>
            </li>
          );
        })}
      </ol>

      {logs && logs.length > 0 && (
        <div className="mt-6 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Riwayat Status</h4>
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="text-xs text-slate-400 flex flex-wrap gap-x-2 items-baseline">
                <span className="font-mono text-slate-500">{fmt(log.timestamp)}</span>
                <span className="text-slate-300">
                  {log.status_from ? `${log.status_from} → ` : ''}
                  {log.status_to}
                </span>
                {log.developer_note && <span className="text-indigo-300">“{log.developer_note}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}