import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-baseline gap-2"
            aria-label="PosterAI Admin"
          >
            <span className="font-display text-heading-lg font-extrabold tracking-tight text-ink">
              PosterAI
            </span>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </Link>
          <span className="rounded-full bg-bg-alt px-2.5 py-1 font-display text-micro font-semibold uppercase tracking-wider text-ink-muted">
            Admin
          </span>
        </div>
        <p className="text-caption text-ink-soft">
          Masuk sebagai {user.name} · {user.email}
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[13rem_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
