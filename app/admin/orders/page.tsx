import Link from "next/link";

import { updateOrderStatusAction } from "@/actions/admin";
import { Badge, Button, Card, Select } from "@/components/ui";
import { ORDER_STATUSES, orderStatusMeta } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.some((option) => option.id === status)
    ? status
    : undefined;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true, email: true } } },
  });

  return (
    <div className="animate-fade-in">
      <div>
        <p className="eyebrow">Transaksi</p>
        <h1 className="mt-2 font-display text-display-sm">Pesanan</h1>
        <p className="mt-1 text-body text-ink-muted">
          {orders.length} pesanan{filter ? " pada status ini" : " total"}.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full px-4 py-2 font-display text-caption font-semibold transition-colors",
            filter
              ? "bg-bg-alt text-ink-muted hover:text-ink"
              : "bg-ink text-bg",
          )}
        >
          Semua
        </Link>
        {ORDER_STATUSES.map((option) => (
          <Link
            key={option.id}
            href={`/admin/orders?status=${option.id}`}
            className={cn(
              "rounded-full px-4 py-2 font-display text-caption font-semibold transition-colors",
              filter === option.id
                ? "bg-ink text-bg"
                : "bg-bg-alt text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card variant="outlined" padding="xl" className="mt-6 text-center">
          <p className="font-display text-heading-lg">Tidak ada pesanan</p>
          <p className="mt-2 text-body text-ink-muted">
            Belum ada pesanan pada filter ini.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const current = orderStatusMeta(order.status);

            return (
              <li key={order.id}>
                <Card variant="default" padding="none" className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-alt/60 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-body-sm font-semibold text-ink hover:text-accent"
                      >
                        {order.orderNumber}
                      </Link>
                      <Badge className={current.tone}>{current.label}</Badge>
                      <span className="text-caption text-ink-soft">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                    <p className="font-display font-semibold text-ink">
                      {formatIDR(order.total)}
                    </p>
                  </div>

                  <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-end">
                    <div>
                      <p className="font-display text-body-sm font-semibold text-ink">
                        {order.user ? order.user.name : "Tamu"}
                        {order.user ? (
                          <span className="ml-2 font-body text-caption font-normal text-ink-muted">
                            {order.user.email}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-caption leading-relaxed text-ink-muted">
                        Kirim ke {order.shipName}, {order.shipAddress}, {order.shipCity}{" "}
                        {order.shipPostal} · {order.shipPhone}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-caption text-ink-soft">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-4">
                            <span>
                              {item.title}, {item.size} / {item.frame} × {item.quantity}
                            </span>
                            <span>{formatIDR(item.unitPrice * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <form action={updateOrderStatusAction} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={order.id} />
                      <Select
                        name="status"
                        defaultValue={order.status}
                        className="py-2 text-caption"
                        aria-label={`Status pesanan ${order.orderNumber}`}
                        options={ORDER_STATUSES.map((option) => ({
                          value: option.id,
                          label: option.label,
                        }))}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        Simpan
                      </Button>
                    </form>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="justify-self-start rounded-full border border-line px-4 py-2 font-display text-caption font-semibold text-ink transition-colors hover:border-accent hover:text-accent lg:justify-self-end"
                    >
                      Detail →
                    </Link>
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
