"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type AuthState } from "@/actions/auth";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-2 lg:items-stretch lg:py-16">
      <aside className="relative hidden overflow-hidden rounded-3xl bg-ink lg:flex lg:flex-col lg:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/posters/cyberpunk-sunset.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" aria-hidden="true" />

        <div className="relative p-10">
          <Link href="/" className="inline-flex items-baseline gap-2 text-bg">
            <span className="font-display text-heading-lg font-extrabold">PosterAI</span>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative p-10">
          <p className="eyebrow text-paper/60">Selamat datang kembali</p>
          <h2 className="mt-3 max-w-sm text-balance font-display text-display-sm text-bg">
            Poster yang dimulai AI, diselesaikan manusia.
          </h2>
          <ul className="mt-8 space-y-3 text-body-sm text-paper/70">
            {[
              "Riwayat pesanan dan status produksi",
              "Penawaran custom order terlacak",
              "Checkout lebih cepat dengan alamat tersimpan",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <p className="eyebrow">Akun</p>
          <h1 className="mt-2 font-display text-display-md">Masuk</h1>
          <p className="mt-2 text-body text-ink-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-accent underline underline-offset-4">
              Daftar di sini
            </Link>
            .
          </p>

          <Card variant="elevated" padding="lg" className="mt-6">
            <form action={formAction} className="space-y-4">
              {state.error ? <Alert>{state.error}</Alert> : null}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" fullWidth disabled={pending} size="lg">
                {pending ? "Memproses…" : "Masuk"}
              </Button>
            </form>
          </Card>

          <div className="mt-4 rounded-2xl border border-line bg-bg-alt px-4 py-3 text-caption text-ink-muted">
            <p className="font-display font-semibold text-ink">Akun demo</p>
            <p className="mt-1">Customer: demo@posterai.id / demo12345</p>
            <p>Admin: admin@posterai.id / admin12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
