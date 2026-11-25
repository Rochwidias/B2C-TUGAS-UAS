import StatusBadge from './StatusBadge';
import { formatDate, type OrderLog, type OrderStatus } from './types';

const KNOWN_STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

function isStatus(value: string): value is OrderStatus {
  return (KNOWN_STATUSES as string[]).includes(value);
}

// Revisi dan brief tambahan ditulis ke order_logs TANPA mengubah status
// (docs/REDESIGN.md §3), jadi wajib tampil beda dari pergeseran status biasa —
// bukan sekadar catatan yang tertukar dengan transisi.
type Kind = 'revisi' | 'brief' | 'catatan' | 'status';

const KIND_META: Record<Kind, { label: string; cap: string; marker: string }> = {
  revisi: { label: 'Revisi', cap: 'border-accent text-accent', marker: 'bg-accent' },
  brief: { label: 'Brief tambahan', cap: 'border-warn text-warn', marker: 'bg-warn' },
  catatan: { label: 'Catatan', cap: 'border-rule text-ink-soft', marker: 'bg-ink-soft' },
  status: { label: '', cap: '', marker: 'bg-paper' },
};

/** Satu entri: jenisnya + isi catatan tanpa prefix bawaan backend. */
function classify(log: OrderLog): { kind: Kind; note: string } {
  const note = (log.developer_note ?? '').trim();
  if (/^\[REVISI\]/i.test(note)) {
    return { kind: 'revisi', note: note.replace(/^\[REVISI\]\s*/i, '') };
  }
  if (/^\[BRIEF TAMBAHAN\]/i.test(note)) {
    return { kind: 'brief', note: note.replace(/^\[BRIEF TAMBAHAN\]\s*/i, '') };
  }
  const sameStatus = !log.status_from || log.status_from === log.status_to;
  return { kind: note && sameStatus ? 'catatan' : 'status', note };
}

// Linimasa perubahan status dari order_logs, terbaru di atas.
export default function LogsTimeline({ logs }: { logs: OrderLog[] }) {
  const ordered = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const extras = ordered.filter((log) => classify(log).kind !== 'status').length;

  return (
    <section aria-labelledby="riwayat-order" className="relative border border-rule bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <h2 id="riwayat-order" className="text-xs font-semibold tracking-tight text-ink">
          Riwayat order
        </h2>
        <span className="font-mono text-[10px] text-ink-soft">
          {ordered.length} entri{extras > 0 ? ` · ${extras} non-status` : ''}
        </span>
      </div>

      {ordered.length === 0 ? (
        <p className="px-3 py-4 text-[11px] leading-relaxed text-ink-soft">
          Belum ada riwayat. Entri pertama muncul begitu status order berubah lewat form di samping.
        </p>
      ) : (
        <ol className="px-3 py-3">
          {ordered.map((log, index) => {
            const last = index === ordered.length - 1;
            const { kind, note } = classify(log);
            const meta = KIND_META[kind];
            return (
              <li key={log.id} className="relative flex gap-2.5 pb-3.5 last:pb-0">
                {!last ? (
                  <span aria-hidden="true" className="absolute top-3.5 left-[5px] h-full w-px bg-rule" />
                ) : null}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 size-[11px] shrink-0 border-[1.5px] border-ink ${meta.marker}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {kind === 'status' ? (
                      <>
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
                      </>
                    ) : (
                      <span
                        className={`inline-flex shrink-0 items-center border-[1.5px] bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${meta.cap}`}
                      >
                        {meta.label}
                      </span>
                    )}
                    <time
                      dateTime={log.timestamp}
                      className="ml-auto font-mono text-[10px] tabular-nums text-ink-soft"
                    >
                      {formatDate(log.timestamp)}
                    </time>
                  </div>
                  {note ? (
                    <p
                      className={`mt-1.5 border-l-[1.5px] pl-2 text-[11px] leading-relaxed ${
                        kind === 'revisi'
                          ? 'border-accent text-ink'
                          : kind === 'brief'
                            ? 'border-warn text-ink'
                            : 'border-rule text-ink-soft'
                      }`}
                    >
                      {note}
                    </p>
                  ) : null}
                  {kind === 'status' && log.status_from === log.status_to && !note ? (
                    <p className="mt-1.5 font-mono text-[10px] text-ink-soft">
                      Status tidak berubah ({log.status_to})
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