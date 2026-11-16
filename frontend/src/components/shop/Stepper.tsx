import { STATUS_STEPS, type OrderLog, type OrderStatus, statusLabel } from './types';

function fmt(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Stepper = garis produksi: satu jalur horizontal dengan angka ledger, penanda
// tahap berbentuk kotak (bukan pil), dan cap status mono di bawahnya.
export function Stepper({ status, logs }: { status: OrderStatus; logs?: OrderLog[] }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const noteByStep = new Map<string, string>();
  (logs ?? []).forEach((log) => {
    if (log.developer_note) noteByStep.set(log.status_to, log.developer_note);
  });

  return (
    <div>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0">
        {STATUS_STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
          return (
            <li
              key={step.key}
              aria-current={state === 'active' ? 'step' : undefined}
              className={[
                'flex flex-col gap-2 lg:border-l lg:border-rule lg:px-4',
                i === 0 ? 'lg:border-l-0 lg:pl-0' : '',
                i === currentIndex ? 'lg:border-l-ink' : '',
              ].join(' ')}
            >
              <div className="flex items-baseline gap-2">
                <span className={['font-mono text-[11px]', state === 'pending' ? 'text-ink-soft' : 'text-ink'].join(' ')}>
                  0{i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    'size-2.5 border',
                    state === 'done' && 'border-ink bg-ink',
                    state === 'active' && 'border-accent bg-accent',
                    state === 'pending' && 'border-rule bg-transparent',
                  ].join(' ')}
                />
                <span className="sr-only">
                  {state === 'done' ? 'sudah lewat' : state === 'active' ? 'sedang berjalan' : 'belum mulai'}
                </span>
              </div>

              <p
                className={[
                  'text-[13px] leading-snug',
                  state === 'active' ? 'font-semibold text-ink' : 'text-ink',
                  state === 'pending' ? 'text-ink-soft' : '',
                ].join(' ')}
              >
                {step.label}
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                {noteByStep.has(step.key) ? noteByStep.get(step.key) : step.hint}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
        <span className="border border-ink px-2 py-1 font-mono text-[11px] uppercase tracking-wide">
          Status: {statusLabel(status)}
        </span>
        {currentIndex >= 0 && (
          <span className="font-mono text-[11px] text-ink-soft">
            Tahap {currentIndex + 1} dari {STATUS_STEPS.length}
          </span>
        )}
      </div>

      {logs && logs.length > 0 && (
        <div className="mt-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            Riwayat log developer
          </h4>
          <ul className="mt-3 flex flex-col divide-y divide-rule border-t border-rule">
            {logs.map((log) => (
              <li key={log.id} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                <span className="font-mono text-[11px] text-ink-soft">{fmt(log.timestamp)}</span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-ink">
                    {log.status_from ? `${statusLabel(log.status_from)} ` : 'Catatan awal '}
                    <span aria-hidden="true">&rarr;</span> {statusLabel(log.status_to)}
                  </p>
                  {log.developer_note && (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{log.developer_note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
