import StatusBadge from './StatusBadge';
import { formatDate, type OrderLog, type OrderStatus } from './types';

const KNOWN_STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

function isStatus(value: string): value is OrderStatus {
  return (KNOWN_STATUSES as string[]).includes(value);
}

// Linimasa perubahan status dari order_logs, terbaru di atas.
export default function LogsTimeline({ logs }: { logs: OrderLog[] }) {
  const ordered = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-200">Riwayat order</h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-700">
          {ordered.length} entri
        </span>
      </div>

      {ordered.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Belum ada riwayat. Entri pertama muncul begitu status order berubah.
        </p>
      ) : (
        <ol className="mt-4 space-y-0">
          {ordered.map((log, index) => {
            const last = index === ordered.length - 1;
            return (
              <li key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!last ? (
                  <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-slate-800" />
                ) : null}
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 border-slate-900 bg-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {log.status_from && isStatus(log.status_from) ? (
                      <>
                        <StatusBadge status={log.status_from} />
                        <span aria-hidden="true" className="text-slate-600">
                          →
                        </span>
                      </>
                    ) : null}
                    {isStatus(log.status_to) ? <StatusBadge status={log.status_to} /> : <span>{log.status_to}</span>}
                    <time
                      dateTime={log.timestamp}
                      className="ml-auto text-[11px] tabular-nums text-slate-500"
                    >
                      {formatDate(log.timestamp)}
                    </time>
                  </div>
                  {log.developer_note ? (
                    <p className="mt-1.5 rounded-lg bg-slate-950/70 px-3 py-2 text-xs leading-relaxed text-slate-400">
                      {log.developer_note}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}