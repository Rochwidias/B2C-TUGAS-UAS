import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Checkout: PosterAI" };

const steps = [
  { number: "1", label: "Alamat", active: true },
  { number: "2", label: "Pembayaran", active: false },
  { number: "3", label: "Selesai", active: false },
];

export default async function CheckoutPage() {
  const user = await getSession();

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mb-8 animate-slide-up">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 font-display text-display-md">Selesaikan pesanan</h1>
        <p className="mt-2 max-w-xl text-body text-ink-muted">
          Harga dan stok dihitung ulang di server saat pesanan dibuat.
        </p>
      </div>

      <ol className="mb-8 flex flex-wrap items-center gap-3 text-caption text-ink-muted">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3">
            <span
              className={
                step.active
                  ? "flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-body-sm font-bold text-bg"
                  : "flex h-8 w-8 items-center justify-center rounded-full bg-bg-alt font-display text-body-sm font-bold text-ink-muted"
              }
            >
              {step.number}
            </span>
            <span className={step.active ? "font-medium text-ink" : ""}>{step.label}</span>
            {index < steps.length - 1 ? (
              <span className="hidden h-px w-8 bg-line sm:block" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>

      <CheckoutForm defaultName={user?.name ?? ""} loggedIn={Boolean(user)} />
    </div>
  );
}
