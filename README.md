# Aether Creative

B2C **platform pembuatan poster** untuk UMKM — tugas UAS. Customer memilih contoh
poster per segmen, mengisi brief merek, AI menghasilkan draft konten poster
(JSON terstruktur), lalu editor/manusia memvalidasi, mengerjakan, dan menyerahkan
hasil siap pakai beserta source code-nya.

Alur kerja: **Brief merek → Editor validasi → Hasil siap pakai.**

Arah desain & kontrak teknis terbaru ada di [`docs/REDESIGN.md`](docs/REDESIGN.md)
(menggantikan bagian `docs/SPEC.md` yang bertentangan). Rencana bisnis awal
(Milestone 1, merek CraftAI Studio) tetap disimpan utuh di [`PLAN.md`](PLAN.md)
beserta prototype statisnya di [`index.html`](index.html).

## Harga

Diambil dari `GET /api/packages` (satu-satunya sumber harga, estimasi, dan garansi):

| Paket | Harga | Cakupan | Estimasi | Garansi |
|---|---|---|---|---|
| **Satuan** | Rp50.000 / order | 1 poster | 2–4 jam kerja | Revisi 2× dalam 3 hari |
| **Paket Hemat** | Rp100.000 | 3 order + review editor | 1–3 hari kerja | Revisi 3× dalam 7 hari, termasuk review editor |

Estimasi dan garansi ditampilkan **sebelum customer membayar** — ini jawaban atas
dua titik keraguan terbesar dari customer journey: "cemas bayar tanpa hasil jelas"
dan "pilihan paket membingungkan".

## Target

Mahasiswa & pelajar Yogyakarta yang punya tugas dan usaha sampingan; segmen
tambahan kreator/portofolio digital dan toko online. Aktif di Instagram, TikTok,
dan WhatsApp, ingin tampil profesional di bidang desain.

## Deploy

Deploy produksi: **frontend di Vercel** (root directory `frontend`) + **backend
di Render** (blueprint `render.yaml`). Semua trafik lewat rewrite Next.js (satu
origin) sehingga tanpa CORS di produksi. Panduan langkah demi langkah:
[`docs/DEPLOY.md`](docs/DEPLOY.md).

- Vercel — https://vercel.com/new
- Render — https://render.com (New+ -> Blueprint -> pilih repo)

## Arsitektur: dua proyek terpisah

```
B2C-TUGAS-UAS/
  backend/    Express + node:sqlite  — semua endpoint /api/*        (port 4000)
  frontend/   Next.js 16 App Router  — UI saja, fetch ke backend     (port 3000)
```

- **backend/** — API murni: katalog contoh poster, paket harga, draft AI
  (Gemini + fallback lokal), order, kuota paket, revisi, delivery, login admin,
  statistik, export HTML poster. Database `backend/data/app.db` (sqlite bawaan
  Node, auto-create + migrasi idempoten + seed). Gate admin & rate limit per IP
  hidup di sini.
- **frontend/** — halaman customer (`/`, `/customizer/[id]`, `/orders`) dan
  back-office (`/admin`). Semua akses data lewat `fetch` ke `NEXT_PUBLIC_API_URL`
  (default `http://localhost:4000`); tidak ada route `/api` dan tidak ada akses
  DB langsung di Next.js. Route `/api/*` diteruskan ke backend via rewrite di
  `next.config.ts` (`BACKEND_ORIGIN`, default `http://localhost:4000`) supaya
  satu origin juga tetap jalan.

## Menjalankan

Dua terminal:

```bash
# terminal 1 — backend
cd backend && npm install && npm start        # http://localhost:4000

# terminal 2 — frontend
cd frontend && npm install && npm start       # http://localhost:3000
```

Dev mode: `npm run dev` di masing-masing folder.

## Struktur

```
PLAN.md            dokumen perencanaan awal (Milestone 1, CraftAI Studio)
index.html         prototype HTML statis (Milestone 1)
docs/REDESIGN.md   kontrak terbaru: identitas, paket, skema draft, API, halaman
docs/SPEC.md       kontrak teknis lama (berlaku sejauh tidak bertentangan)
docs/DEPLOY.md     panduan deploy Vercel + Render
backend/           API Express
  src/index.ts     server HTTP: CORS, cookie, security headers, mount routes
  src/routes/      templates, packages, drafts, orders, delivery, admin, export
  src/services/    orders (checkout, kuota, revisi), stats (agregat admin)
  src/lib/         db, ai, render, validate, security, ratelimit, http
  src/middleware/  adminAuth (verifikasi token sesi)
  data/app.db      sqlite (auto-create, migrasi idempoten, seed idempoten)
frontend/          Next.js (App Router + TypeScript + Tailwind)
  src/app/         halaman: home, customizer, orders, admin, error, SEO
  src/components/  komponen React (client) — shop, admin, ui
  src/lib/api.ts   API_BASE / API_BASE_SERVER untuk semua fetch
  middleware.ts    gate halaman /admin/** (verifikasi sesi ke backend)
  tests/           uji API, keamanan, e2e Playwright, fitur
```

## Kunci API (opsional)

Tanpa kunci, generator AI bekerja mode **lokal** (deterministik, konten poster
benar-benar memakai brief customer). Dengan kunci, draft dihasilkan model Gemini
dan badge engine menampilkan `gemini`:

```bash
# backend/.env  (atau environment)
GEMINI_API_KEY=***
ADMIN_PASSWORD=admin123
```

## Akun demo

Back-office: `/admin/login`, password `admin123` (bisa diganti lewat env
`ADMIN_PASSWORD` **di backend/Render**; verifikasi sesi dilakukan oleh backend,
bukan frontend). Pesanan demo seed: nomor **UK-ORD-8812** (dapat dilacak di
`/orders`).

## Verifikasi

```bash
cd backend  && npx tsc
cd frontend && npx tsc --noEmit && npx eslint src && npm run build
```

Suite uji (Python + Playwright; tiap fase memakai backend baru karena rate limit
in-memory):

```bash
bash /home/rochwidias/.hermes/cache/scratch/verify-linux.sh all   # api, security, e2e, features
```

Skrip asli Windows ada di `frontend/tests/verify.sh`.