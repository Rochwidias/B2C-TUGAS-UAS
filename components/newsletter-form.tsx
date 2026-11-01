"use client";

import { useState, type FormEvent } from "react";

import { cn } from "@/lib/cn";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setError(null);
    setSubmitted(true);
    form.reset();
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-success/25 bg-success-soft px-4 py-3 text-body-sm text-success",
          compact ? "text-caption" : "justify-center",
        )}
        role="status"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Terima kasih! Email Anda tercatat untuk demo ini.
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
        <div className="relative">
          <input
            type="email"
            name="email"
            required
            placeholder="Email Anda"
            aria-label="Email untuk berlangganan"
            className="w-full rounded-xl border border-line bg-surface py-3 pl-4 pr-12 text-body text-ink placeholder-ink-soft outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-accent text-bg transition-colors hover:bg-cyan"
            aria-label="Kirim"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {error ? (
          <p className="text-caption text-error" role="alert">{error}</p>
        ) : (
          <p className="text-micro text-ink-muted">Tidak ada spam. Hanya hal-hal keren.</p>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row"
      noValidate
    >
      <div className="flex-1">
        <input
          type="email"
          name="email"
          required
          placeholder="Email Anda"
          aria-label="Email untuk berlangganan"
          className="w-full rounded-full border border-line bg-surface px-5 py-3.5 text-body text-ink placeholder-ink-soft outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {error && (
          <p className="mt-1.5 pl-2 text-caption text-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-gradient-to-r from-accent to-cyan px-7 py-3.5 font-display font-semibold text-bg transition-all hover:-translate-y-0.5"
      >
        Langganan
      </button>
    </form>
  );
}
