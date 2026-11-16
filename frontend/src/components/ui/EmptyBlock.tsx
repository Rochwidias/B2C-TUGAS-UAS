import Link from 'next/link';
import { EmptyState } from './EmptyState';

/**
 * Empty state bersama: satu kalimat sebab + satu tindakan yang jelas.
 * Dipakai oleh katalog, daftar order, dan papan admin.
 */
export function EmptyBlock({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  pending = false,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  pending?: boolean;
}) {
  return (
    <EmptyState title={title} description={description}>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)]"
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={pending}
          className="mt-4 inline-flex min-h-11 items-center justify-center border border-ink bg-accent px-4 text-[13px] font-semibold text-accent-ink transition-transform hover:-translate-y-px hover:shadow-[2px_2px_0_0_var(--ink)] disabled:opacity-60"
        >
          {actionLabel}
        </button>
      ) : null}
    </EmptyState>
  );
}