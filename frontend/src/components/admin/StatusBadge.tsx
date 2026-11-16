import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from './types';

// Cap status gaya cetak: persegi, border 1.5px, huruf mono. Sengaja bukan pill.
export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border-[1.5px] bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
