import Link from "next/link";

import { Badge, Button, Card } from "@/components/ui";
import { orderStatusMeta } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AccountOrdersPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-slide-up">
        <div>
          <p className="eyebrow">Akun</p>
          <h1 className="mt-2 font-display text-display-md">Pesanan saya</h1>
          <p className="mt-2 text-body text-ink-muted">
            Masuk sebagai {user.name} · {user.email}
          </p>
        </div>
        <Badge className="bg-bg-alt text-ink-muted">{orders.length} pesanan</Badge>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-3xl border-2 border-dashed border-line bg-bg-alt/50 px-6 py-16 text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-display text-display-sm">Belum ada pesanan</p>
          <p className="mx-auto mt-2 max-w-sm text-body text-ink-muted">
            Setiap poster yang Anda beli akan muncul di halaman ini beserta statusnya.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/products">Mulai belanja</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order, index) => {
            const status = orderStatusMeta(order.status);
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <li
                key={order.id}
                className="animate-enter"
                style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
              >
                <Card
                  variant="default"
                  padding="none"
                  className="overflow-hidden transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-alt/60 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-body-sm font-semibold text-ink">
                        {order.orderNumber}
                      </span>
                      <Badge className={status.tone}>{status.label}</Badge>
                    </div>
                    <span className="text-caption text-ink-soft">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={item.id}
                            src={item.imageUrl}
                            alt=""
                            className="h-14 w-10 rounded-lg border-2 border-surface bg-bg-alt object-cover shadow-sm"
                          />
                        ))}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-ink">
                          {order.items[0]?.title ?? "Pesanan"}
                          {order.items.length > 1 ? ` +${order.items.length - 1} lainnya` : ""}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-muted">
                          {itemCount} item · {order.items.length} varian
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-caption text-ink-soft">Total</p>
                        <p className="font-display text-heading-md font-bold text-accent">
                          {formatIDR(order.total)}
                        </p>
                      </div>
                      <Link
                        href={`/account/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 font-display text-caption font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        Detail
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
