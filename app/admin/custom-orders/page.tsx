import { updateCustomOrderAction } from "@/actions/admin";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { CUSTOM_STATUSES, customStatusMeta, sizeLabel } from "@/lib/constants";
import { formatDate, formatIDR } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

export default async function AdminCustomOrdersPage() {
  const requests = await prisma.customOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Layanan custom</p>
          <h1 className="mt-2 font-display text-display-sm">Custom order</h1>
          <p className="mt-1 text-body text-ink-muted">
            {requests.length} brief masuk. Kirim penawaran lalu ubah statusnya.
          </p>
        </div>
        <Badge className="bg-amber-soft text-amber">
          {requests.filter((request) => request.status === "REQUESTED").length} menunggu
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card variant="outlined" padding="xl" className="mt-6 text-center">
          <p className="font-display text-heading-lg">Belum ada brief custom</p>
          <p className="mt-2 text-body text-ink-muted">
            Brief dari pelanggan akan muncul di sini.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {requests.map((request) => {
            const status = customStatusMeta(request.status);
            return (
              <li key={request.id}>
                <Card variant="default" padding="lg">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-heading-lg">{request.title}</h2>
                        <Badge className={cn(status.tone, "normal-case tracking-normal")}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-caption text-ink-muted">
                        {request.user.name} ({request.user.email}) · {formatDate(request.createdAt)}
                      </p>
                      <p className="mt-1 text-caption text-ink-soft">
                        {request.style} · {sizeLabel(request.size)}
                        {request.budget ? ` · budget ${formatIDR(request.budget)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption text-ink-soft">Penawaran saat ini</p>
                      <p className="font-display text-heading-md text-accent">
                        {request.quotedPrice !== null
                          ? formatIDR(request.quotedPrice)
                          : "Belum ada"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-3xl rounded-xl bg-bg-alt/60 px-4 py-3 text-body-sm leading-relaxed text-ink-muted">
                    {request.brief}
                  </p>

                  {request.referenceUrl ? (
                    <a
                      href={request.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-caption font-medium text-accent underline underline-offset-4"
                    >
                      Lihat referensi
                    </a>
                  ) : null}

                  <form
                    action={updateCustomOrderAction}
                    className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[10rem_9rem_1fr_auto] sm:items-end"
                  >
                    <input type="hidden" name="id" value={request.id} />

                    <div>
                      <label
                        htmlFor={`status-${request.id}`}
                        className="mb-1 block font-display text-micro uppercase tracking-wider text-ink-soft"
                      >
                        Status
                      </label>
                      <Select
                        id={`status-${request.id}`}
                        name="status"
                        defaultValue={request.status}
                        className="py-2 text-caption"
                        options={CUSTOM_STATUSES.map((option) => ({
                          value: option.id,
                          label: option.label,
                        }))}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`price-${request.id}`}
                        className="mb-1 block font-display text-micro uppercase tracking-wider text-ink-soft"
                      >
                        Penawaran (Rp)
                      </label>
                      <Input
                        id={`price-${request.id}`}
                        name="quotedPrice"
                        type="number"
                        min={0}
                        step={1000}
                        defaultValue={request.quotedPrice ?? ""}
                        className="py-2 text-caption"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`note-${request.id}`}
                        className="mb-1 block font-display text-micro uppercase tracking-wider text-ink-soft"
                      >
                        Catatan untuk pembeli
                      </label>
                      <Textarea
                        id={`note-${request.id}`}
                        name="adminNote"
                        defaultValue={request.adminNote ?? ""}
                        className="min-h-10 py-2 text-caption"
                        rows={1}
                      />
                    </div>

                    <Button type="submit" variant="secondary" size="sm">
                      Simpan
                    </Button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
