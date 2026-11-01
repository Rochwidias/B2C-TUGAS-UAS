import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderSummary } from "@/components/order-summary";
import { Badge } from "@/components/ui";
import { orderStatusMeta } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/cn";

const FLOW = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser();
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order || order.userId !== user.id) notFound();

  const status = orderStatusMeta(order.status);
  const currentStep = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="container-page py-12 sm:py-16">
      <Link
        href="/account/orders"
        className="font-display text-body-sm font-medium text-ink-muted transition-colors hover:text-accent"
      >
        ← Semua pesanan
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 animate-slide-up">
        <div>
          <p className="eyebrow">Pesanan</p>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-ink sm:text-3xl">
            {order.orderNumber}
          </h1>
        </div>
        <Badge className={cn(status.tone, "px-4 py-1.5")}>{status.label}</Badge>
      </div>

      {cancelled ? (
        <div className="mt-6 rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-body-sm text-error">
          Pesanan ini dibatalkan. Stok setiap varian sudah dikembalikan.
        </div>
      ) : (
        <ol className="mt-8 grid gap-3 sm:grid-cols-4">
          {FLOW.map((step, index) => {
            const meta = orderStatusMeta(step);
            const done = index <= currentStep;
            return (
              <li key={step} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-bold",
                    done ? "bg-accent text-bg" : "bg-bg-alt text-ink-soft",
                  )}
                  aria-hidden="true"
                >
                  {done ? "✓" : index + 1}
                </span>
                <div className="min-w-0">
                  <p className={cn("truncate font-display text-caption font-semibold", done ? "text-ink" : "text-ink-soft")}>
                    {meta.label}
                  </p>
                  <p className="text-micro text-ink-soft">{done ? "Selesai" : "Menunggu"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-8">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
