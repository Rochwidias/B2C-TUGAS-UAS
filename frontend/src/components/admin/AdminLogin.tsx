'use client';

// Formulir login back office. Dipisah dari page.tsx supaya halaman tetap bisa
// mengekspor metadata (halaman 'use client' tidak boleh).

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ThemeToggle } from '@/components/shop/ThemeToggle';
import { Spinner } from '@/components/ui/Feedback';
import { API_BASE } from '@/lib/api';

/** Ambil sisa detik dari pesan 429 server ("Coba lagi dalam 42 detik."). */
function parseRetrySeconds(message: string): number | null {
  const match = /(\d+)\s*detik/i.exec(message);
  if (!match) return null;
  const value = Number.parseInt(match[1] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Hanya path internal yang boleh jadi tujuan redirect setelah login. */
function safeFrom(value: string | null): string {
  if (!value) return '/admin';
  if (!value.startsWith('/admin')) return '/admin';
  if (value.startsWith('/admin/login')) return '/admin';
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = safeFrom(searchParams.get('from'));

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hitung mundur sisa waktu setelah 429 supaya admin tahu kapan boleh mencoba
  // lagi tanpa menebak-nebak.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy || cooldown > 0) return;

      // Validasi field sebelum menyentuh jaringan: request kosong hanya
      // menghabiskan kuota rate limit.
      if (!password.trim()) {
        setError('Password wajib diisi.');
        inputRef.current?.focus();
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
          credentials: 'include',
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;

        if (response.ok) {
          router.replace(from);
          router.refresh();
          return;
        }

        const message = payload?.error ?? `Login ditolak (HTTP ${response.status})`;
        setError(message);
        setPassword('');
        if (response.status === 429) {
          const seconds = parseRetrySeconds(message);
          if (seconds) setCooldown(seconds);
        }
        inputRef.current?.focus();
      } catch {
        setError('Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.');
      } finally {
        setBusy(false);
      }
    },
    [busy, cooldown, from, password, router],
  );

  const locked = cooldown > 0;

  return (
    <form onSubmit={submit} className="flex flex-col" noValidate>
      <div className="flex items-baseline justify-between gap-2 border-b border-rule px-4 py-2.5">
        <h2 className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
          Lembar akses / 01
        </h2>
        <span aria-hidden="true" className="font-mono text-[10px] text-ink-soft">
          ★
        </span>
      </div>

      <div className="px-4 py-4">
        <label htmlFor="admin-password" className="mb-1.5 block text-[12px] font-semibold text-ink">
          Password admin
        </label>
        <input
          ref={inputRef}
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          disabled={busy || locked}
          placeholder="Masukkan password"
          aria-describedby="password-hint"
          aria-invalid={error ? true : undefined}
          className={`min-h-11 w-full border bg-paper px-2.5 text-[13px] text-ink placeholder:text-ink-soft/80 transition focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
            error ? 'border-danger' : 'border-rule'
          }`}
        />
        <p
          id="password-hint"
          className="mt-2 border border-dashed border-rule px-2 py-1.5 text-[11px] text-ink-soft"
        >
          Password diatur oleh admin melalui konfigurasi server, bukan dibagikan di halaman ini.
          Akun demo dicatat di README.
        </p>

        <button
          type="submit"
          disabled={busy || locked}
          aria-busy={busy}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-ink bg-ink px-4 text-[12.5px] font-semibold text-paper transition hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy ? <Spinner /> : null}
          {busy ? 'Memverifikasi…' : locked ? `Tunggu ${cooldown} detik` : 'Masuk ke back office'}
        </button>

        {/* Pesan galat dari server ditampilkan apa adanya, termasuk 429 dengan
            sisa waktu, supaya penyebabnya jelas tanpa menebak. */}
        <p
          role="alert"
          aria-live="polite"
          className={`mt-2 min-h-[1.25rem] text-[11px] leading-relaxed font-medium ${
            error ? 'text-danger' : 'text-ink-soft'
          }`}
        >
          {error ?? '\u00A0'}
        </p>

        {from !== '/admin' ? (
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">
            Setelah masuk Anda akan diarahkan ke <span className="text-ink">{from}</span>.
          </p>
        ) : null}
      </div>

      <div className="border-t border-rule px-4 py-2.5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-mono text-[10px] tracking-wide text-ink-soft uppercase underline decoration-rule underline-offset-4 transition hover:text-ink hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← Kembali ke situs customer
        </Link>
      </div>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="flex items-center justify-between gap-3 border-b border-ink px-4 py-2.5 sm:px-6">
        <p className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
          Aether Creative / back office
        </p>
        <ThemeToggle />
      </div>

      <main
        id="konten"
        className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-stretch lg:gap-0 lg:py-14"
      >
        {/* Panel keterangan: band tinta penuh sebagai kontraposisi editorial. */}
        <section className="relative border-[1.5px] border-ink bg-ink px-5 py-6 text-paper lg:max-w-[46%] lg:border-r-0 lg:px-7 lg:py-8">
          <span
            aria-hidden="true"
            className="absolute top-2 right-3 font-mono text-[11px] leading-none text-paper/60"
          >
            +
          </span>
          <p className="font-mono text-[10px] tracking-wider text-paper/70 uppercase">
            Akses terbatas
          </p>
          <h1 className="mt-3 text-3xl leading-[0.95] font-semibold tracking-tight sm:text-[38px]">
            Meja kerja
            <br />
            <span className="font-serif italic">produksi</span>
          </h1>
          <p className="mt-4 max-w-[38ch] text-[12.5px] leading-relaxed text-paper/85">
            Papan pesanan, berkas brief poster, dan penyerahan hasil cetak. Hanya untuk tim editor
            dan admin Aether Creative.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-paper/25 pt-4 font-mono text-[10.5px]">
            <div>
              <dt className="tracking-wide text-paper/60 uppercase">Sesi</dt>
              <dd className="mt-0.5 text-paper">Cookie admin_session</dd>
            </div>
            <div>
              <dt className="tracking-wide text-paper/60 uppercase">Data</dt>
              <dd className="mt-0.5 text-paper">Demo lokal</dd>
            </div>
            <div>
              <dt className="tracking-wide text-paper/60 uppercase">Status</dt>
              <dd className="mt-0.5 text-paper">5 tahap produksi</dd>
            </div>
            <div>
              <dt className="tracking-wide text-paper/60 uppercase">Format</dt>
              <dd className="mt-0.5 text-paper">Poster + ZIP</dd>
            </div>
          </dl>
        </section>

        {/* Panel formulir: kartu kertas dengan garis registrasi di sudut. */}
        <div className="reg-mark relative min-w-0 flex-1 border-[1.5px] border-ink bg-surface px-4 py-5 sm:px-6 sm:py-7">
          <p className="mb-3 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
            Formulir masuk
          </p>
          <Suspense fallback={<p className="text-[12px] text-ink-soft">Memuat formulir…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}