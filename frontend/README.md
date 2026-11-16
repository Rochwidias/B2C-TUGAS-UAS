# CraftAI Studio

Layanan kustomisasi template website berbantuan AI. Customer memilih template,
mengisi brief bisnis, server menyusun draft konten (JSON terstruktur), lalu
developer mengeksekusi sampai halaman live beserta source code.

Stack: **Next.js 16 App Router + React 19 + TypeScript + Tailwind v4**, database
**`node:sqlite`** (tanpa dependency), AI lewat REST Gemini dengan fallback
generator lokal deterministik.

Frontend **tidak lagi memiliki route `/api`** — semua data diambil dari
**backend Express** (`../backend`, port 4000). Baca `README.md` root atau
`../backend/README.md` untuk struktur & endpoint API.

## Menjalankan

Dua proses (backend harus jalan dulu):

```bash
cd backend && npm start               # API :4000
cd frontend && npm start              # UI  :3000
npm run dev                           # pengembangan
```

Back-office: `http://localhost:3000/admin` (password default `admin123`,
diatur lewat `ADMIN_PASSWORD` di **backend**).

Salin `.env.example` ke `.env.local`. Kunci penting: `NEXT_PUBLIC_API_URL`
(alamat backend, opsional — kosong = relatif via rewrite; SSR pakai
`BACKEND_ORIGIN`). Tanpa `GEMINI_API_KEY` di backend, sistem memakai generator
lokal dan badge engine menampilkan `local`.

Deploy produksi (Vercel, set `BACKEND_ORIGIN` ke URL Render):
[`../docs/DEPLOY.md`](../docs/DEPLOY.md).

## Struktur

Frontend adalah **satu bagian: UI Next.js** (halaman + komponen `"use client"`).
Keduanya tidak mengakses DB atau logika server — semua lewat `fetch` ke backend:

| Path | Isi |
|---|---|
| `src/app/page.tsx` | Halaman depan: hero, cara kerja, katalog, tabel harga |
| `src/app/customizer/[templateId]` | Brief + live preview + checkout |
| `src/app/orders` | Lacak pesanan tanpa login (nomor `UK-ORD-XXXX`) |
| `src/app/admin` | Back-office: statistik, kanban, detail order, delivery |
| `src/components/shop/` `src/components/admin/` `src/components/ui/` | Komponen React (toast, feedback/skeleton, empty state, kanban) |
| `src/lib/api.ts` | `API_BASE` — base URL backend untuk SEMUA fetch |
| `middleware.ts` | gate halaman `/admin/**` (verifikasi token cookie) |

Aturan: file `"use client"` mengakses backend lewat `fetch` ke
`${API_BASE}/api/*` dengan `credentials: 'include'` untuk request admin.
Route `/api/*` diteruskan ke backend via rewrite di `next.config.ts`
(`BACKEND_ORIGIN`, default `http://localhost:4000`).

Kontrak domain & API: [`docs/SPEC.md`](../docs/SPEC.md). Arah desain:
[`design-system/craftai-studio/`](../design-system/craftai-studio/).

## Verifikasi

Satu perintah, menyalakan server bersih sendiri per suite (penting: uji
keamanan sengaja menabrakkan rate limit, jadi penghitung per-IP harus nol):

```bash
cd frontend && bash tests/verify.sh
```

Isi suite:

| Suite | Cakupan |
|---|---|
| `tests/test_api.py` | 41 kasus kontrak API |
| `tests/test_security.py` | 43 kasus: gate admin, rate limit, validasi, header, SEO |
| `tests/test_e2e.py` | 24 kasus alur customer (Playwright) |
| `tests/test_features.py` | 26 kasus fitur UX: toast, copy, filter, persistensi, responsif |

Verifikasi manual: `npx tsc --noEmit`, `npx eslint src`, `npm run build`.

## Keamanan

- Gate admin di **setiap** route tulis (`PATCH /api/orders/[id]`,
  `PUT /api/orders/[id]/delivery`, `/api/admin/*`).
- Middleware memverifikasi **token** sesi, bukan keberadaan cookie.
- Rate limit per IP: login 6/15 menit, draft AI 8/5 menit, checkout 5/10 menit,
  lacak order 20/menit. Lewat batas → 429 + sisa waktu.
- Batas panjang & sanitasi input terpusat di `backend/src/lib/security.ts`; WhatsApp
  dinormalkan ke `08xx`, nomor order unik dengan retry saat tabrakan.
- Header keamanan global di `next.config.ts`, `poweredByHeader: false`.
- Error boundary berlapis: `app/error.tsx`, `app/global-error.tsx`,
  `app/admin/error.tsx`, `app/not-found.tsx`.

CSP belum dipasang karena script tema pre-paint berjalan inline dan butuh nonce.

## Catatan Next.js

`next.config.ts` memakai `cacheComponents`, yang **melarang** route segment config
`export const runtime` dan `export const dynamic`. Route handler sudah berjalan di
runtime Node.js secara default, jadi keduanya tidak perlu (dan tidak boleh)
ditulis.