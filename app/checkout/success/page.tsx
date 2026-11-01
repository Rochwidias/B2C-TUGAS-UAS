import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyOrderNumber } from "@/components/copy-order-number";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  if (!order) notFound();

  const session = await getSession();
  if (order.userId && order.userId !== session?.id) notFound();
  const ownsOrder = Boolean(session && order.userId === session.id);

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="eyebrow mt-5">Pesanan diterima</p>
        <h1 className="mt-2 font-display text-display-md">Terima kasih!</h1>
        <p className="mx-auto mt-3 max-w-lg text-body-lg leading-relaxed text-ink-muted">
          Pembayaran simulasi berhasil. Pesanan sudah masuk antrean produksi dan akan
          dikerjakan 3–5 hari kerja.
        </p>
        <div className="mt-5 flex justify-center">
          <CopyOrderNumber value={order.orderNumber} />
        </div>
      </div>

      <div className="mt-10">
        <OrderSummary order={order} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" asChild>
          <Link href="/products">Lanjut belanja</Link>
        </Button>
        {ownsOrder ? (
          <Button asChild>
            <Link href={`/account/orders/${order.orderNumber}`}>Lihat status pesanan</Link>
          </Button>
        ) : (
          <p className="w-full text-center text-caption text-ink-soft">
            Simpan nomor pesanan ini untuk mengecek status. Masuk dengan akun Anda agar
            riwayat tersimpan otomatis.
          </p>
        )}
      </div>
    </div>
  );
}
