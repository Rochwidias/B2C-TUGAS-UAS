import Link from "next/link";
import { notFound } from "next/navigation";

import { updateOrderStatusAction } from "@/actions/admin";
import { Badge, Button, Card, Divider, Select } from "@/components/ui";
import { ORDER_STATUSES, frameLabel, orderStatusMeta, sizeLabel } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });

  if (!order) notFound();

  const status = orderStatusMeta(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="max-w-4xl animate-fade-in">
      <Link
        href="/admin/orders"
        className="font-display text-body-sm font-medium text-ink-muted transition-colors hover:text-accent"
      >
        ← Semua pesanan
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Detail pesanan</p>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-ink">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-body-sm text-ink-muted">
            {formatDateTime(order.createdAt)} ·{" "}
            {order.user ? `${order.user.name} (${order.user.email})` : "Tamu"}
          </p>
        </div>
        <Badge className={status.tone}>{status.label}</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card variant="elevated" padding="lg">
          <h2 className="font-display text-heading-lg">Item pesanan</h2>
          <ul className="mt-5 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-24 w-18 shrink-0 rounded-xl border border-line object-cover"
                />
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {sizeLabel(item.size)} · {frameLabel(item.frame)}
                    </p>
                    <p className="mt-1 text-body-sm text-ink-soft">
                      {item.quantity} × {formatIDR(item.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display font-semibold text-ink">
                    {formatIDR(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Divider className="my-5" />

          <dl className="space-y-3 text-body">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="font-medium">{formatIDR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Ongkir</dt>
              <dd className="font-medium">
                {order.shippingCost === 0 ? "Gratis" : formatIDR(order.shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="font-display text-heading-md">Total</dt>
              <dd className="font-display text-heading-md text-accent">
                {formatIDR(order.total)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card variant="outlined" padding="lg">
            <h2 className="font-display text-heading-lg">Alamat pengiriman</h2>
            <address className="mt-3 space-y-1 text-body-sm not-italic leading-relaxed text-ink-muted">
              <p className="font-medium text-ink">{order.shipName}</p>
              <p>{order.shipPhone}</p>
              <p>{order.shipAddress}</p>
              <p>
                {order.shipCity} {order.shipPostal}
              </p>
              {order.shipNote ? <p className="pt-2 text-caption">Catatan: {order.shipNote}</p> : null}
            </address>
          </Card>

          <Card variant="outlined" padding="lg">
            <h2 className="font-display text-heading-lg">Ubah status</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              Pembatalan mengembalikan stok tepat satu kali. Pesanan yang sudah
              dibatalkan tidak bisa diaktifkan kembali.
            </p>
            <form action={updateOrderStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <Select
                name="status"
                defaultValue={order.status}
                aria-label="Status pesanan"
                options={ORDER_STATUSES.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                disabled={isCancelled}
              />
              <Button type="submit" fullWidth disabled={isCancelled}>
                Simpan status
              </Button>
            </form>
            {isCancelled ? (
              <p className="mt-3 text-caption text-error">
                Pesanan ini sudah dibatalkan dan tidak dapat diubah lagi.
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
