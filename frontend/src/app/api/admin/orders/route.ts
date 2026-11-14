import { listOrders } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/http';
import { isAdminAuthenticated } from '@/lib/session';

export async function GET(): Promise<Response> {
  // Back-office wajib login; gate di route ini juga menutup API bila cookie
  // admin_session belum di-set lewat POST /api/admin/login.
  if (!(await isAdminAuthenticated())) {
    return jsonError('Akses ditolak. Silakan login sebagai admin terlebih dahulu.', 401);
  }

  const orders = listOrders();
  const backlog = orders.filter((order) => order.status === 'draft' || order.status === 'paid');
  const inProgress = orders.filter((order) => order.status === 'in_progress');
  const review = orders.filter((order) => order.status === 'review');
  const completed = orders.filter((order) => order.status === 'completed');

  return jsonOk({
    columns: {
      backlog,
      in_progress: inProgress,
      review,
      completed,
    },
    counts: {
      backlog: backlog.length,
      in_progress: inProgress.length,
      review: review.length,
      completed: completed.length,
      total: orders.length,
    },
  });
}