import Link from "next/link";

import { CustomOrderForm } from "@/components/custom-order-form";
import { Badge, Button, Card } from "@/components/ui";
import { customStatusMeta, sizeLabel } from "@/lib/constants";
import { formatDate, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/cn";

const steps = [
  {
    title: "Kirim brief",
    body: "Ceritakan tema, warna, dan ukuran yang Anda inginkan. Sertakan referensi bila ada.",
    color: "var(--gradient-cyberpunk)",
  },
  {
    title: "Draf AI",
    body: "Tim membuat beberapa kandidat dengan model gambar, lalu memilih arah yang paling kuat.",
    color: "var(--gradient-retro)",
  },
  {
    title: "Finishing manual",
    body: "Desainer merapikan komposisi, tipografi, dan detail cetak sebelum Anda review.",
    color: "var(--gradient-alam)",
  },
  {
    title: "Cetak & kirim",
    body: "Setelah desain disetujui dan pembayaran dikonfirmasi, poster dicetak dan dikirim.",
    color: "var(--gradient-abstrak)",
  },
];

export default async function CustomOrderPage() {
  const user = await getSession();

  const requests = user
    ? await prisma.customOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl animate-slide-up">
        <p className="eyebrow">Custom order</p>
        <h1 className="mt-3 text-balance font-display text-display-md sm:text-display-lg">
          Poster yang dibuat untuk Anda
        </h1>
        <p className="mt-4 max-w-2xl text-body-lg leading-relaxed text-ink-muted">
          Tidak menemukan poster yang cocok? Kirim brief, kami buat draf dengan AI lalu
          dirapikan manual oleh desainer. Anda hanya membayar setelah menyetujui penawaran.
        </p>
      </div>

      <section className="mt-12" aria-labelledby="process-heading">
        <h2 id="process-heading" className="sr-only">Proses custom order</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-2xl border border-line bg-surface p-6 shadow-card animate-enter"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full font-display font-extrabold text-bg shadow-pill"
                style={{ backgroundImage: step.color }}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="font-display text-heading-md">{step.title}</h3>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section aria-labelledby="form-heading" className="animate-slide-up">
          <Card variant="elevated" padding="lg">
            <h2 id="form-heading" className="font-display text-heading-lg">
              Formulir brief custom
            </h2>
            <p className="mt-1 text-body text-ink-muted">
              Isi detail yang diinginkan, tim kami akan balas dalam 1×24 jam kerja.
            </p>

            <div className="mt-6">
              {user ? (
                <CustomOrderForm />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-line bg-bg-alt/50 px-6 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-heading-lg">Masuk untuk mengirim brief</h3>
                  <p className="mx-auto mt-2 max-w-sm text-body text-ink-muted">
                    Kami perlu akun agar penawaran harga dan revisi bisa dilacak dengan baik.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild>
                      <Link href="/login">Masuk</Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href="/register">Daftar</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section aria-labelledby="history-heading" className="animate-slide-up stagger-1">
          <Card variant="outlined" padding="lg">
            <div className="flex items-center justify-between gap-3">
              <h2 id="history-heading" className="font-display text-heading-lg">
                Permintaan Anda
              </h2>
              {user ? (
                <Badge className="bg-bg-alt text-ink-muted">{requests.length} brief</Badge>
              ) : null}
            </div>

            {!user ? (
              <p className="mt-6 rounded-xl bg-bg-alt/60 px-4 py-6 text-center text-body-sm text-ink-muted">
                Masuk untuk melihat riwayat dan status penawaran custom order Anda.
              </p>
            ) : requests.length === 0 ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-line px-5 py-10 text-center">
                <p className="font-display text-heading-md">Belum ada permintaan</p>
                <p className="mx-auto mt-2 max-w-xs text-body-sm text-ink-muted">
                  Brief pertama Anda akan muncul di sini beserta status dan penawarannya.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {requests.map((request) => {
                  const status = customStatusMeta(request.status);
                  return (
                    <li
                      key={request.id}
                      className="rounded-2xl border border-line bg-surface p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-heading-md">{request.title}</h3>
                          <p className="mt-1 text-caption text-ink-muted">
                            {request.style} · {sizeLabel(request.size)} · {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <Badge className={cn(status.tone, "normal-case tracking-normal")}>
                          {status.label}
                        </Badge>
                      </div>

                      <p className="mt-3 line-clamp-3 text-body-sm leading-relaxed text-ink-muted">
                        {request.brief}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <div>
                          <p className="text-caption text-ink-soft">Penawaran</p>
                          <p className="font-display text-heading-md text-accent">
                            {request.quotedPrice !== null
                              ? formatIDR(request.quotedPrice)
                              : "Menunggu review"}
                          </p>
                        </div>
                        {request.status === "QUOTED" ? (
                          <Link
                            href="/contact"
                            className="rounded-full bg-ink px-4 py-2 font-display text-caption font-semibold text-bg transition-colors hover:bg-accent"
                          >
                            Konfirmasi ke tim
                          </Link>
                        ) : null}
                      </div>

                      {request.adminNote ? (
                        <p className="mt-3 rounded-xl bg-bg-alt px-4 py-3 text-body-sm leading-relaxed text-ink-muted">
                          <span className="font-medium text-ink">Catatan tim: </span>
                          {request.adminNote}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-6 text-caption leading-relaxed text-ink-soft">
              Penawaran custom belum otomatis menjadi pesanan. Setelah Anda setuju, tim
              akan mengonfirmasi pembayaran dan produksi lewat halaman kontak.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
