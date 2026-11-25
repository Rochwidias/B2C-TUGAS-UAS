# Aether Creative

B2C **platform pembuatan poster** untuk UMKM — tugas UAS. Aplikasi ini kini
**frontend-only**: tidak ada backend, tidak ada database, tidak ada API. Seluruh
data (katalog, paket, pesanan) hidup di **localStorage browser**, per perangkat.
Konten poster disusun **editor manusia lewat back-office** — tidak ada AI.

Alur kerja: **Brief merek → Editor validasi → Hasil siap pakai**, lalu
konfirmasi dan serah terima hasil berjalan lewat **WhatsApp (`wa.me`)**.

> **Kontrak yang berlaku: [`docs/FRONTEND-ONLY.md`](docs/FRONTEND-ONLY.md)**
> (2026-11-25). Dokumen `docs/SPEC.md`, `docs/REDESIGN.md`, dan
> `docs/WHATSAPP-FLOW.md` bersifat **historis** — bagian yang menyebut API,
> backend, atau database sudah tidak berlaku. Folder `backend/` dan
> `render.yaml` sudah dihapus total.

## Harga

Harga, estimasi, dan garansi kini **data statis di frontend**
(`frontend/src/lib/packages.ts`) — ditampilkan sebelum customer mengirim pesanan:

| Paket | Harga | Cakupan | Estimasi | Garansi |
|---|---|---|---|---|
| **Satuan** | Rp50.000 | 1 poster | 2–4 jam kerja | Revisi 2× dalam 3 hari |
| **Paket Hemat** | Rp100.000 | 3 poster + review editor | 1–3 hari kerja | Revisi 3× dalam 7 hari |

## Target

Mahasiswa & pelajar Yogyakarta yang punya tugas dan usaha sampingan; segmen
tambahan kreator/portofolio digital dan toko online. Aktif di Instagram, TikTok,
dan WhatsApp, ingin tampil profesional di bidang desain.

## Menjalankan — satu terminal

```bash
cd frontend && npm install && npm run dev    # http://localhost:3000
```

Tidak ada server lain yang perlu dinyalakan. Semua halaman (customer dan
back-office) dilayani Next.js ini; datanya ada di browser masing-masing.

## Arsitektur: satu aplikasi, data di browser

```
B2C-TUGAS-UAS/
  frontend/   Next.js 16 App Router + TypeScript + Tailwind   (port 3000)
```

- **Next.js App Router + TypeScript + Tailwind** — satu-satunya proyek. Tidak
  ada route `/api`, tidak ada fetch ke server manapun, tidak ada database.
- **Data di localStorage browser, per perangkat** — pesanan tidak pernah
  meninggalkan perangkat yang dipakai. Order yang dibuat customer tampil di
  kanban admin pada **browser yang sama**; browser/perangkat lain tidak melihat
  datanya. Ini memang aplikasi demo, bukan multi-user.
- **`frontend/src/lib/orders-store.ts` satu pintu** — satu-satunya modul yang
  menyentuh `localStorage['aether-orders']`. Shop dan admin sama-sama membaca
  store ini; komponen dilarang menulis key localStorage sendiri. Skema lengkap
  ada di [`docs/FRONTEND-ONLY.md`](docs/FRONTEND-ONLY.md).
- **Katalog & paket statis** — `CATALOG_TEMPLATES` (3 kartu poster) dan
  `PACKAGES` (2 kartu paket) di `frontend/src/lib/`.
- **Kontak WhatsApp** dari env `NEXT_PUBLIC_WHATSAPP_NUMBER` yang dirakit
  menjadi link `https://wa.me/<number>` (Buka WhatsApp saat checkout, Chat via
  WhatsApp di `/orders`, Chat ke Customer di back-office).

## Env frontend

```bash
# frontend/.env.local
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890   # nomor WA bisnis, tanpa '+' — WAJIB diganti di produksi
NEXT_PUBLIC_ADMIN_PASSWORD=admin123         # password back-office (default admin123)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # opsional: base URL untuk metadata/sitemap/robots
```

Semua variabel berawalan `NEXT_PUBLIC_`, artinya nilainya **ikut bundle
client**. `NEXT_PUBLIC_WHATSAPP_NUMBER` dengan placeholder `6281234567890`
**wajib diganti** di produksi (lihat [`docs/DEPLOY.md`](docs/DEPLOY.md)) agar
pesanan masuk ke nomor WhatsApp yang benar.

## Akun demo

- **Pesanan demo**: nomor **UK-ORD-8812** — otomatis di-seed ke localStorage
  saat penyimpanan masih kosong. Lacak di `/orders` (bisa langsung buka
  `/orders?number=UK-ORD-8812`).
- **Back-office**: `/admin/login`, password `admin123` (diganti lewat env
  `NEXT_PUBLIC_ADMIN_PASSWORD`). Setelah login, kanban menampilkan pesanan
  (termasuk demo) dan status bisa dipindah antar kolom.

> **Gate admin tingkat demo.** Password dibandingkan di sisi client dan cookie
> `admin_session` di-set lewat `document.cookie`; middleware hanya memeriksa
> keberadaan cookie. Karena `NEXT_PUBLIC_ADMIN_PASSWORD` ikut bundle client,
> gate ini **bukan keamanan produksi** — cukup untuk demo/dokumentasi tugas.
> Jangan simpan data sensitif di aplikasi ini.

## Verifikasi

```bash
cd frontend && npx tsc --noEmit && npx eslint src && npm run build
```

Suite uji (Python + Playwright, headless chromium; server Next dinyalakan
sendiri oleh skrip):

```bash
pytest frontend/tests/test_e2e.py frontend/tests/test_features.py
# atau sekali jalan dengan server otomatis:
cd frontend && bash tests/verify.sh
```

## Struktur

```
PLAN.md            dokumen perencanaan awal (Milestone 1, CraftAI Studio)
index.html         prototype HTML statis (Milestone 1)
docs/FRONTEND-ONLY.md  KONTRAK BERLAKU: frontend-only, localStorage, tanpa API
docs/DEPLOY.md     panduan deploy Vercel (frontend-only)
docs/SPEC.md       kontrak teknis lama — HISTORIS
docs/REDESIGN.md   kontrak desain lama — HISTORIS
docs/WHATSAPP-FLOW.md  kontrak alur WhatsApp lama — HISTORIS
frontend/          Next.js 16 (App Router + TypeScript + Tailwind)
  src/app/         halaman: home, customizer, orders, admin, error, SEO
  src/components/  komponen React (client) — shop, admin, ui
  src/lib/         catalog.ts, packages.ts, orders-store.ts (satu pintu localStorage)
  middleware.ts    gate halaman /admin/** (cek cookie admin_session)
  tests/           uji e2e + fitur (Playwright) dan verify.sh
```
