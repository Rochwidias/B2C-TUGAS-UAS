// Keadaan kosong bersama: menyebut sebab kosong + satu tindakan yang mengisinya,
// bukan sekadar "Belum ada data". Anak (action) opsional.

import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  icon = '+',
  children,
}: {
  title: string;
  description: string;
  icon?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 border border-dashed border-rule px-4 py-6">
      <span aria-hidden="true" className="font-mono text-base leading-none text-ink-soft">
        {icon}
      </span>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <p className="max-w-prose text-[12px] leading-relaxed text-ink-soft">{description}</p>
      {children}
    </div>
  );
}

export default EmptyState;