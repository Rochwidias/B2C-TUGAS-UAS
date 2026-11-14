# CraftAI Studio

B2C **AI-Assisted Template Customization Service** — tugas UAS. Customer memilih template,
mengisi brief bisnis, AI menghasilkan draft website (JSON terstruktur), lalu developer
manusia menyelesaikan, mendeploy, dan menyerahkan hasil live + source code.

Alur bisnis, skema database, dan rubrik penilaian ada di [`PLAN.md`](PLAN.md).
Kontrak teknis antar-modul ada di [`docs/SPEC.md`](docs/SPEC.md).
Artefak Milestone 1 (prototype statis) tetap disimpan di [`index.html`](index.html).

## Menjalankan

```bash
cd frontend
npm install        # sekali saja
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
cd frontend && npm run build && npm start
```

## Struktur

```
PLAN.md            dokumen perencanaan (Milestone 1)
index.html         prototype HTML statis (Milestone 1)
docs/SPEC.md       kontrak teknis: model data, API, kepemilikan file
frontend/          aplikasi Next.js (App Router + TypeScript + Tailwind)
  src/lib/         types, sqlite DB, layer AI (Gemini + fallback lokal), renderer export
  src/app/api/     route API (draft, orders, admin, export)
  src/app/         halaman customer (home, customizer, orders)
  src/app/admin/   back-office: kanban + detail order
  data/app.db      sqlite (dibuat otomatis saat pertama diakses, sudah ada seed)
```

## Kunci API (opsional)

Tanpa kunci, generator AI bekerja mode **lokal** (deterministik, konten tetap spesifik brief).
Dengan kunci, draft dihasilkan model Gemini dan badge engine menampilkan `gemini`:

```bash
# frontend/.env.local
GEMINI_API_KEY=***
ADMIN_PASSWORD=admin123
```

## Akun demo

Back-office: `/admin/login`, password `admin123` (bisa diganti lewat env `ADMIN_PASSWORD`).
Pesanan demo seed: nomor **UK-ORD-8812** (dapat dilacak di `/orders`).