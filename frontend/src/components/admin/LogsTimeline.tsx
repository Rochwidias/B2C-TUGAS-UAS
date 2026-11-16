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
    <section aria-labelledby="riwayat-order" className="relative border border-rule bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <h2 id="riwayat-order" className="text-xs font-semibold tracking-tight text-ink">
          Riwayat order
        </h2>
        <span className="font-mono text-[10px] text-ink-soft">{ordered.length} entri</span>
      </div>

      {ordered.length === 0 ? (
        <p className="px-3 py-4 text-[11px] leading-relaxed text-ink-soft">
          Belum ada riwayat. Entri pertama muncul begitu status order berubah lewat form di samping.
        </p>
      ) : (
        <ol className="px-3 py-3">
          {ordered.map((log, index) => {
            const last = index === ordered.length - 1;
            return (
              <li key={log.id} className="relative flex gap-2.5 pb-3.5 last:pb-0">
                {!last ? (
                  <span aria-hidden="true" className="absolute top-3.5 left-[5px] h-full w-px bg-rule" />
                ) : null}
                <span aria-hidden="true" className="relative z-10 mt-1 size-[11px] shrink-0 border-[1.5px] border-ink bg-paper" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.status_from && isStatus(log.status_from) ? (
                      <>
                        <StatusBadge status={log.status_from} />
                        <span aria-hidden="true" className="font-mono text-[10px] text-ink-soft">
                          →
                        </span>
                      </>
                    ) : null}
                    {isStatus(log.status_to) ? (
                      <StatusBadge status={log.status_to} />
                    ) : (
                      <span className="font-mono text-[10px] text-ink-soft">{log.status_to}</span>
                    )}
                    <time
                      dateTime={log.timestamp}
                      className="ml-auto font-mono text-[10px] tabular-nums text-ink-soft"
                    >
                      {formatDate(log.timestamp)}
                    </time>
                  </div>
                  {log.developer_note ? (
                    <p className="mt-1.5 border-l-[1.5px] border-rule pl-2 text-[11px] leading-relaxed text-ink-soft">
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
