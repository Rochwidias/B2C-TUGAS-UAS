// Service agregat statistik admin: angka-angka dashboard dipusatkan di sini
// supaya route hanya mengurus gate sesi dan bentuk response.

import { listLogs, listOrders } from '../lib/db';
import type { Order, OrderStatus } from '../types';

const STATUSES: OrderStatus[] = ['draft', 'paid', 'in_progress', 'review', 'completed'];

export interface AdminStats {
  counts: Record<string, number>;
  revenue: number;
  delivered: number;
  averageCompletionHours: number | null;
  totalLogs: number;
  recentOrders: Order[];
}

/** Rata-rata jam dari order masuk sampai selesai (status completed). */
export function averageCompletionHours(orders: Order[]): number | null {
  const done = orders.filter((order) => order.status === 'completed');
  if (done.length === 0) return null;
  const total = done.reduce((sum, order) => {
    const start = new Date(order.created_at).getTime();
    const end = new Date(order.updated_at).getTime();
    const hours = (end - start) / 3_600_000;
    return sum + (Number.isFinite(hours) && hours >= 0 ? hours : 0);
  }, 0);
  return Math.round((total / done.length) * 10) / 10;
}

export function buildAdminStats(): AdminStats {
  const orders = listOrders();

  const byStatus = STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = orders.filter((order) => order.status === status).length;
    return acc;
  }, {});

  const revenue = orders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + order.total_price, 0);

  const delivered = orders.filter((order) => order.live_website_url).length;
  const totalLogs = orders.reduce((sum, order) => sum + listLogs(order.id).length, 0);

  return {
    counts: { ...byStatus, total: orders.length },
    revenue,
    delivered,
    averageCompletionHours: averageCompletionHours(orders),
    totalLogs,
    recentOrders: orders.slice(0, 5),
  };
}
