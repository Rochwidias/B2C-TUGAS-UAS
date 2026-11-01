"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type AuthState } from "@/actions/auth";
import { Alert, Button, Card, Input, Label } from "@/components/ui";

const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-2 lg:items-stretch lg:py-16">
      <aside className="relative hidden overflow-hidden rounded-3xl bg-ink lg:flex lg:flex-col lg:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/posters/kabut-dieng.svg"
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
          <p className="eyebrow text-paper/60">Akun baru</p>
          <h2 className="mt-3 max-w-sm text-balance font-display text-display-sm text-bg">
            Mulai koleksi poster yang punya cerita.
          </h2>
          <p className="mt-4 max-w-sm text-body-sm leading-relaxed text-paper/70">
            Setiap karya menampilkan prompt AI dan catatan manusia yang mengubahnya.
            Daftar untuk menyimpan riwayat pesanan dan brief custom.
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <p className="eyebrow">Akun</p>
          <h1 className="mt-2 font-display text-display-md">Daftar</h1>
          <p className="mt-2 text-body text-ink-muted">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-accent underline underline-offset-4">
              Masuk
            </Link>
            .
          </p>

          <Card variant="elevated" padding="lg" className="mt-6">
            <form action={formAction} className="space-y-4">
              {state.error ? <Alert>{state.error}</Alert> : null}

              <div>
                <Label htmlFor="name">Nama lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Nama Anda"
                  required
                  minLength={2}
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Ulangi password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Ketik ulang password"
                  required
                />
              </div>

              <Button type="submit" fullWidth disabled={pending} size="lg">
                {pending ? "Mendaftar…" : "Daftar"}
              </Button>
            </form>
          </Card>

          <p className="mt-4 text-caption leading-relaxed text-ink-soft">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-accent">
              syarat & ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-accent">
              kebijakan privasi
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
