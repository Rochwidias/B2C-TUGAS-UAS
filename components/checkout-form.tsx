"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { submitCheckout } from "@/actions/checkout";
import { useCart } from "@/components/cart-provider";
import { Alert, Button, Card, Divider, Input, Label, Textarea } from "@/components/ui";
import { FREE_SHIPPING_MIN, frameLabel, sizeLabel } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { calcTotals } from "@/lib/pricing";

type Props = {
  defaultName: string;
  loggedIn: boolean;
};

export function CheckoutForm({ defaultName, loggedIn }: Props) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const idempotencyKey = useRef("");

  const totals = calcTotals(items);
  const remaining = Math.max(0, FREE_SHIPPING_MIN - totals.subtotal);

  function validate(formData: FormData): boolean {
    const errors: Record<string, string> = {};
    const name = String(formData.get("shipName") ?? "").trim();
    const phone = String(formData.get("shipPhone") ?? "").trim();
    const address = String(formData.get("shipAddress") ?? "").trim();
    const city = String(formData.get("shipCity") ?? "").trim();
    const postal = String(formData.get("shipPostal") ?? "").trim();

    if (name.length < 2) errors.shipName = "Nama penerima minimal 2 karakter.";
    if (phone.length < 8) errors.shipPhone = "Nomor telepon minimal 8 digit.";
    if (address.length < 10) errors.shipAddress = "Alamat minimal 10 karakter.";
    if (city.length < 2) errors.shipCity = "Kota wajib diisi.";
    if (!/^\d{5}$/.test(postal)) errors.shipPostal = "Kode pos harus 5 digit.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    if (!validate(formData)) return;

    idempotencyKey.current ||= crypto.randomUUID();
    setPending(true);
    setError(null);

    const result = await submitCheckout({
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      shipName: String(formData.get("shipName") ?? ""),
      shipPhone: String(formData.get("shipPhone") ?? ""),
      shipAddress: String(formData.get("shipAddress") ?? ""),
      shipCity: String(formData.get("shipCity") ?? ""),
      shipPostal: String(formData.get("shipPostal") ?? ""),
      shipNote: String(formData.get("shipNote") ?? ""),
      idempotencyKey: idempotencyKey.current,
    });

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    clear();
    router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`);
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-body text-ink-muted">Memuat keranjang…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-line bg-bg-alt/50 px-6 py-16 text-center animate-scale-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="font-display text-display-sm">Belum ada yang bisa di-checkout</p>
        <p className="mx-auto mt-2 max-w-sm text-body text-ink-muted">
          Keranjang Anda kosong. Pilih poster terlebih dahulu.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/products">Jelajahi katalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card variant="elevated" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-heading-lg">Alamat pengiriman</h2>
            {!loggedIn ? (
              <Link href="/login" className="text-caption font-medium text-accent hover:underline">
                Masuk untuk menyimpan alamat
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="shipName">
                Nama penerima <span className="text-error">*</span>
              </Label>
              <Input
                id="shipName"
                name="shipName"
                defaultValue={defaultName}
                required
                minLength={2}
                autoComplete="name"
                placeholder="Nama lengkap penerima"
                error={formErrors.shipName}
              />
            </div>

            <div>
              <Label htmlFor="shipPhone">
                Nomor telepon <span className="text-error">*</span>
              </Label>
              <Input
                id="shipPhone"
                name="shipPhone"
                required
                minLength={8}
                inputMode="tel"
                placeholder="0812xxxxxxx"
                autoComplete="tel"
                error={formErrors.shipPhone}
              />
            </div>

            <div>
              <Label htmlFor="shipCity">
                Kota <span className="text-error">*</span>
              </Label>
              <Input
                id="shipCity"
                name="shipCity"
                required
                minLength={2}
                autoComplete="address-level2"
                placeholder="Kota/Kabupaten"
                error={formErrors.shipCity}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="shipAddress">
                Alamat lengkap <span className="text-error">*</span>
              </Label>
              <Textarea
                id="shipAddress"
                name="shipAddress"
                required
                minLength={10}
                autoComplete="street-address"
                placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                rows={3}
                error={formErrors.shipAddress}
              />
            </div>

            <div>
              <Label htmlFor="shipPostal">
                Kode pos <span className="text-error">*</span>
              </Label>
              <Input
                id="shipPostal"
                name="shipPostal"
                required
                pattern="[0-9]{5}"
                inputMode="numeric"
                maxLength={5}
                autoComplete="postal-code"
                placeholder="12345"
                error={formErrors.shipPostal}
              />
            </div>

            <div>
              <Label htmlFor="shipNote">Catatan (opsional)</Label>
              <Input
                id="shipNote"
                name="shipNote"
                maxLength={300}
                placeholder="Patokan alamat, jam penerimaan, dll."
              />
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="lg" className="border-accent/30 bg-accent-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-heading-md text-accent">Pembayaran simulasi</h3>
              <p className="mt-1 text-body-sm leading-relaxed text-ink-muted">
                Tidak ada payment gateway. Setelah tombol ditekan, pesanan langsung
                berstatus <strong>Dibayar</strong> dan stok dikurangi.
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <Alert dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button type="submit" disabled={pending} size="xl" fullWidth>
          {pending ? "Memproses…" : `Bayar ${formatIDR(totals.total)}`}
        </Button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card variant="elevated" padding="lg" className="shadow-card-hover">
          <h2 className="font-display text-heading-lg">Pesanan Anda</h2>

          <ul className="mt-4 divide-y divide-line">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-3 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-16 w-12 shrink-0 rounded-lg border border-line object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1 text-body-sm">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-caption text-ink-muted">
                    {sizeLabel(item.size)} · {frameLabel(item.frame)}
                  </p>
                  <p className="mt-1 text-caption text-ink-soft">
                    {item.quantity} × {formatIDR(item.unitPrice)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Divider className="my-4" />

          <dl className="space-y-3 text-body">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="font-medium">{formatIDR(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Ongkir</dt>
              <dd className="font-medium">
                {totals.shippingCost === 0 ? (
                  <span className="text-emerald">Gratis</span>
                ) : (
                  formatIDR(totals.shippingCost)
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="font-display text-heading-md">Total</dt>
              <dd className="font-display text-heading-md font-bold text-accent">
                {formatIDR(totals.total)}
              </dd>
            </div>
          </dl>

          {remaining > 0 && (
            <p className="mt-4 rounded-xl bg-amber-soft px-4 py-3 text-caption leading-relaxed text-amber">
              Gratis ongkir untuk pesanan mulai {formatIDR(FREE_SHIPPING_MIN)}. Kurang{" "}
              {formatIDR(remaining)} lagi.
            </p>
          )}

          <ul className="mt-6 space-y-2 border-t border-line pt-5 text-caption text-ink-muted">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6m-2 0V9a6 6 0 00-12 0v4l-2 2v2a2 2 0 002 2h12a2 2 0 002-2v-2l-2-2z" />
              </svg>
              Transaksi aman (simulasi)
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Dikemas rapi &amp; aman
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M4 4l7 7 7-7" />
              </svg>
              Klaim kerusakan 7 hari
            </li>
          </ul>
        </Card>
      </aside>
    </form>
  );
}
