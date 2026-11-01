import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { orderStatusMeta } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

function StatIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    posters: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l7-6v6h10V8l-3-3-6 6V8L4 8z" />
      </svg>
    ),
    orders: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h1l2-4h8l2 4h1a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9V5a4 4 0 018 0v4" />
      </svg>
    ),
    revenue: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v6m0 10v6" />
      </svg>
    ),
    custom: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 3v2.25a2.25 2.25 0 01-.659 1.561L7 9.75m0 0c-.85.3-1.5 1.05-1.5 2v3.25a2.25 2.25 0 002.25 2.25h5.517a2.25 2.25 0 002.25-2.25V9.75" />
      </svg>
    ),
    stock: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75A9 9 0 11-3 12 9 9 0 0112 9z" />
      </svg>
    ),
  };
  return <span aria-hidden="true">{icons[name]}</span>;
}

const statCards = [
  { key: "activePosters", label: "Poster aktif", icon: "posters", tone: "bg-cyan-soft text-cyan" },
  { key: "totalOrders", label: "Total pesanan", icon: "orders", tone: "bg-amber-soft text-amber" },
  { key: "revenue", label: "Pendapatan", icon: "revenue", tone: "bg-emerald-soft text-emerald" },
  { key: "pendingCustom", label: "Brief menunggu", icon: "custom", tone: "bg-magenta-soft text-magenta" },
  { key: "lowStock", label: "Stok tipis", icon: "stock", tone: "bg-error-soft text-error" },
] as const;

export default async function AdminDashboardPage() {
  const [posterCount, activeCount, orderCount, revenue, pendingCustom, lowStock, recent] =
    await Promise.all([
      prisma.poster.count(),
      prisma.poster.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.customOrder.count({ where: { status: "REQUESTED" } }),
      prisma.variant.count({ where: { stock: { lte: 2 } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      }),
    ]);

  const values: Record<string, string> = {
    activePosters: `${activeCount} / ${posterCount}`,
    totalOrders: String(orderCount),
    revenue: formatIDR(revenue._sum.total ?? 0),
    pendingCustom: String(pendingCustom),
    lowStock: String(lowStock),
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Panel admin</p>
          <h1 className="mt-2 font-display text-display-sm">Ringkasan toko</h1>
          <p className="mt-1 text-body text-ink-muted">
            Aktivitas PosterAI hari ini.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-gradient-to-r from-accent to-cyan px-5 py-2.5 font-display text-body-sm font-semibold text-bg transition-all hover:-translate-y-0.5"
        >
          + Poster baru
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card, index) => (
          <Card
            key={card.key}
            variant="default"
            padding="md"
            className="animate-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption text-ink-muted">{card.label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-ink">
                  {values[card.key]}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  card.tone,
                )}
                aria-hidden="true"
              >
                <StatIcon name={card.icon} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="font-display text-heading-lg">Pesanan terbaru</h2>
            <Link
              href="/admin/orders"
              className="font-display text-caption font-semibold text-accent hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-body-sm text-ink-muted">
              Belum ada pesanan masuk.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => {
                const status = orderStatusMeta(order.status);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bg-alt/60"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-body-sm font-semibold text-ink">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-muted">
                          {order.shipName} · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={status.tone}>{status.label}</Badge>
                        <span className="font-display text-body-sm font-semibold text-ink">
                          {formatIDR(order.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card variant="outlined" padding="lg">
          <h2 className="font-display text-heading-lg">Aksi cepat</h2>
          <div className="mt-4 space-y-2">
            {[
              {
                href: "/admin/products/new",
                title: "Tambah poster",
                description: "Buat 9 varian otomatis dari harga dasar.",
              },
              {
                href: "/admin/products",
                title: "Kelola produk",
                description: "Edit, aktifkan, atau nonaktifkan poster.",
              },
              {
                href: "/admin/custom-orders",
                title: "Tangani custom order",
                description: `${pendingCustom} brief menunggu penawaran.`,
              },
              {
                href: "/admin/orders",
                title: "Kelola pesanan",
                description: "Ubah status dan proses pembatalan.",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
              >
                <div>
                  <p className="font-display text-body-sm font-semibold text-ink group-hover:text-accent">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-muted">{action.description}</p>
                </div>
                <span className="text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
