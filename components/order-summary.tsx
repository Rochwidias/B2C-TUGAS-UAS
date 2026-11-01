import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { frameLabel, orderStatusMeta, sizeLabel } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";

export type OrderSummaryData = {
  orderNumber: string;
  status: string;
  createdAt: Date | string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipCity: string;
  shipPostal: string;
  shipNote: string | null;
  items: {
    id: string;
    title: string;
    imageUrl: string;
    size: string;
    frame: string;
    unitPrice: number;
    quantity: number;
  }[];
};

export function OrderSummary({ order }: { order: OrderSummaryData }) {
  const status = orderStatusMeta(order.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card variant="elevated" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-heading-lg">Detail pesanan</h2>
          <div className="flex items-center gap-2">
            <Badge className={status.tone}>{status.label}</Badge>
            <span className="text-caption text-ink-soft">
              {formatDateTime(order.createdAt)}
            </span>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-24 w-18 shrink-0 rounded-xl border border-line object-cover"
              />
              <div className="flex flex-1 items-start justify-between gap-4">
                <div>
                  <p className="font-display font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-caption text-ink-muted">
                    {sizeLabel(item.size)} · {frameLabel(item.frame)}
                  </p>
                  <p className="mt-1 text-caption text-ink-soft">
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

        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-body">
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
            <dd className="font-display text-heading-md font-bold text-accent">
              {formatIDR(order.total)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card variant="outlined" padding="lg" className="h-fit">
        <h2 className="font-display text-heading-lg">Dikirim ke</h2>
        <address className="mt-3 space-y-1 text-body-sm not-italic leading-relaxed text-ink-muted">
          <p className="font-medium text-ink">{order.shipName}</p>
          <p>{order.shipPhone}</p>
          <p>{order.shipAddress}</p>
          <p>
            {order.shipCity} {order.shipPostal}
          </p>
          {order.shipNote ? (
            <p className="pt-2 text-caption">Catatan: {order.shipNote}</p>
          ) : null}
        </address>

        <div className="mt-5 border-t border-line pt-4 text-caption leading-relaxed text-ink-soft">
          <p>
            Nomor pesanan{" "}
            <span className="font-mono text-ink">{order.orderNumber}</span>
          </p>
          <p className="mt-2">
            Butuh bantuan?{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-accent">
              Hubungi tim kami
            </Link>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
