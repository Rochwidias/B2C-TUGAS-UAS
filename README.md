# CraftAI Studio

B2C **AI-Assisted Template Customization Service** — tugas UAS. Customer memilih template,
mengisi brief bisnis, AI menghasilkan draft website (JSON terstruktur), lalu developer
manusia menyelesaikan, mendeploy, dan menyerahkan hasil live + source code.

Alur bisnis, skema database, dan rubrik penilaian ada di [`PLAN.md`](PLAN.md).
Kontrak teknis antar-modul ada di [`docs/SPEC.md`](docs/SPEC.md).
Artefak Milestone 1 (prototype statis) tetap disimpan di [`index.html`](index.html).

## Arsitektur: dua proyek terpisah

```
B2C-TUGAS-UAS/
  backend/    Express + node:sqlite  — semua endpoint /api/*        (port 4000)
  frontend/   Next.js 16 App Router  — UI saja, fetch ke backend     (port 3000)
```

- **backend/** — API murni: katalog, draft AI (Gemini + fallback lokal), order,
  delivery, login admin, statistik, export HTML. Database `backend/data/app.db`
  (sqlite built-in, auto-create + seed). Gate admin & rate limit per IP hidup di sini.
- **frontend/** — halaman customer (`/`, `/customizer/[id]`, `/orders`) dan
  back-office (`/admin`). Semua akses data lewat `fetch` ke `NEXT_PUBLIC_API_URL`
  (default `http://localhost:4000`); tidak ada lagi route `/api` atau akses DB
  langsung di Next.js. Route `/api/*` diteruskan ke backend via rewrite di
  `next.config.ts` (`BACKEND_ORIGIN`, default `http://localhost:4000`) supaya
  satu origin juga tetap jalan.

## Menjalankan

Dua terminal:

```bash
# terminal 1 — backend
cd backend && npm install && npm start        # http://localhost:4000

# terminal 2 — frontend
cd frontend && npm install && npm start        # http://localhost:3000
```

Dev mode: `npm run dev` di masing-masing folder.

## Struktur

```
PLAN.md            dokumen perencanaan (Milestone 1)
index.html         prototype HTML statis (Milestone 1)
docs/SPEC.md       kontrak teknis: model data, API, kepemilikan file
backend/           API Express
  src/index.ts     server HTTP: CORS, cookie, security headers, mount routes
  src/routes/      templates, drafts, orders, delivery, admin, export
  src/services/    orders (checkout & lacak), stats (agregat admin)
  src/lib/         db, ai, render, validate, security, ratelimit, http
  src/middleware/  adminAuth (verifikasi token sesi)
  data/app.db      sqlite (auto-create saat pertama diakses, sudah ada seed)
frontend/          Next.js (App Router + TypeScript + Tailwind)
  src/app/         halaman: home, customizer, orders, admin, error, SEO
  src/components/  komponen React (client) — shop, admin, ui
  src/lib/api.ts   API_BASE (NEXT_PUBLIC_API_URL) untuk semua fetch
  middleware.ts    gate halaman /admin/** (verifikasi token cookie)
```

## Kunci API (opsional)

Tanpa kunci, generator AI bekerja mode **lokal** (deterministik, konten tetap
spesifik brief). Dengan kunci, draft dihasilkan model Gemini dan badge engine
menampilkan `gemini`:

```bash
# backend/.env  (atau environment)
GEMINI_API_KEY=***
ADMIN_PASSWORD=admin123
```

## Akun demo

Back-office: `/admin/login`, password `admin123` (bisa diganti lewat env
`ADMIN_PASSWORD` di backend). Pesanan demo seed: nomor **UK-ORD-8812** (dapat
dilacak di `/orders`).