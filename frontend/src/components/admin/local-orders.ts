// Jembatan antara store lokal (src/lib/orders-store.ts) dan tipe tampilan
// back-office (./types.ts). Baris order di store memakai nilai pembayaran
// berbahasa Indonesia ('lunas'/'belum_dibayar') dan membawa logs/drafts
// langsung di dalamnya, sedangkan komponen admin mengonsumsi AdminOrder dan
// AdminStats — seluruh pemetaan dikerjakan di sini supaya papan, detail, dan
// statistik sepakat satu bentuk (docs/FRONTEND-ONLY.md).

import { remainingOf, type StoredOrder } from '@/lib/orders-store';
import {
  ALL_STATUSES,
  columnOfStatus,
  safeNumber,
  type AdminOrder,
  type AdminStats,
  type KanbanColumns,
} from './types';

/** Lunas punya dua nama: store menulis 'lunas', bentuk lama 'paid'. */
export function isPaidPayment(paymentStatus: string): boolean {
  return paymentStatus === 'lunas' || paymentStatus === 'paid';
}

/** Label status pembayaran: 'lunas'/'paid' → Lunas, selainnya Belum dibayar. */
export function paymentLabelOf(paymentStatus: string): string {
  return isPaidPayment(paymentStatus) ? 'Lunas' : 'Belum dibayar';
}

/** Satu order dari store → AdminOrder yang dikonsumsi komponen admin. */
export function toAdminOrder(order: StoredOrder): AdminOrder {
  const drafts = Array.isArray(order.drafts) ? order.drafts : [];
  const quota = typeof order.quota === 'number' && order.quota > 0 ? order.quota : null;
  return {
    id: order.id,
    order_number: order.order_number,
    template_id: order.template_id,
    status: order.status,
    payment_status: isPaidPayment(order.payment_status) ? 'paid' : 'unpaid',
    total_price: safeNumber(order.total_price),
    contact_name: order.contact_name ?? '',
    contact_whatsapp: order.contact_whatsapp ?? '',
    contact_email: order.contact_email ?? '',
    package_name: order.package_name ?? '',
    package_key: order.package_key ?? null,
    quota,
    remaining: remainingOf(order),
    draft_count: drafts.length,
    live_website_url: order.live_website_url ?? null,
    download_zip_url: order.download_zip_url ?? null,
    dev_note: order.dev_note ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

/** Kelompokkan order ke kolom papan; draft + paid jatuh ke Backlog. */
export function buildColumns(orders: StoredOrder[]): KanbanColumns {
  const columns: KanbanColumns = { backlog: [], in_progress: [], review: [], completed: [] };
  for (const order of orders) {
    columns[columnOfStatus(order.status)].push(toAdminOrder(order));
  }
  return columns;
}

function newestFirst(orders: StoredOrder[]): StoredOrder[] {
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Statistik dihitung lokal dari seluruh order (dulu GET /api/admin/stats):
 * jumlah per status, pendapatan order lunas, jumlah completed, total log,
 * lima order terbaru, dan rata-rata jam log pertama → log completed.
 */
export function buildStats(orders: StoredOrder[]): AdminStats {
  const counts = {
    draft: 0,
    paid: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
    total: orders.length,
  };
  let revenue = 0;
  let delivered = 0;
  let totalLogs = 0;
  let completionHoursSum = 0;
  let completionSamples = 0;

  for (const order of orders) {
    // Status dari localStorage bisa saja bukan nilai yang dikenal — jangan
    // biarkan ia menciptakan kunci baru atau menjelma NaN.
    if (ALL_STATUSES.includes(order.status)) counts[order.status] += 1;
    if (isPaidPayment(order.payment_status)) revenue += safeNumber(order.total_price);
    if (order.status === 'completed') delivered += 1;

    const logs = Array.isArray(order.logs) ? order.logs : [];
    totalLogs += logs.length;

    const first = logs[0];
    const finished = logs.find((log) => log.status_to === 'completed');
    if (first && finished) {
      const start = new Date(first.timestamp).getTime();
      const end = new Date(finished.timestamp).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        completionHoursSum += (end - start) / 3_600_000;
        completionSamples += 1;
      }
    }
  }

  return {
    counts,
    revenue,
    delivered,
    totalLogs,
    recentOrders: newestFirst(orders)
      .slice(0, 5)
      .map(toAdminOrder),
    averageCompletionHours: completionSamples > 0 ? completionHoursSum / completionSamples : null,
  };
}
