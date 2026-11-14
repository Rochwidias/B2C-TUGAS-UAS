'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      setError('Password tidak boleh kosong.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Login ditolak (HTTP ${response.status})`);
      }
      const next = searchParams.get('from');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal, coba lagi.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-300">
          Password admin
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          disabled={busy}
          placeholder="••••••••"
          aria-describedby="password-hint"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
        />
        <p id="password-hint" className="mt-1.5 text-xs text-slate-500">
          Password demo: <span className="font-mono text-indigo-300">admin123</span>
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {busy ? 'Memverifikasi…' : 'Masuk ke back office'}
      </button>

      <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-center text-xs text-rose-400">
        {error}
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-xl bg-indigo-500 text-xl text-white shadow-lg shadow-indigo-500/30"
          >
            ✦
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">CraftAI Studio</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke back office developer & admin</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Memuat formulir…</p>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-600">
          Akses dibatasi untuk tim internal. Sesi disimpan lewat cookie{' '}
          <code className="font-mono text-slate-500">admin_session</code>.
        </p>
      </div>
    </div>
  );
}