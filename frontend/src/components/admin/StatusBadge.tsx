import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from './types';

// Cap status gaya cetak: persegi, border 1.5px, huruf mono. Sengaja bukan pill.
// Status tak dikenal dari API tetap harus menghasilkan cap yang terbaca, bukan
// kelas/teks kosong (docs/REDESIGN.md §12).
export default function StatusBadge({ status }: { status: OrderStatus | string }) {
  const tone = STATUS_TONE[status as OrderStatus] ?? 'border-rule text-ink-soft';
  const label = STATUS_LABEL[status as OrderStatus] ?? status;
  return (
    <span
      className={`inline-flex shrink-0 items-center border-[1.5px] bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}