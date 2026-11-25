# Deploy Aether Creative: Vercel (frontend) + Render (backend)

Cara termudah deploy Aether Creative. Frontend di Vercel, backend (API Express)
di Render. Semua trafik produksi lewat **rewrite Next.js** (satu origin), jadi
frontend dan API tampak dari domain yang sama — tidak ada masalah CORS, cookie
login admin tetap same-site, dan env yang perlu diisi sedikit.

```
Browser  ->  https://<proj>.vercel.app        (Next.js, root directory frontend)
                    |
                    |  rewrite /api/*  ->  BACKEND_ORIGIN
                    v
            https://<nama>-<hash>.onrender.com/api/*   (Express + SQLite)
```

Env penting yang dibaca frontend (Vercel):

- `BACKEND_ORIGIN` — **wajib**. URL backend Render, tanpa trailing slash,
  contoh `https://craftai-backend-xxxx.onrender.com`. Tanpa ini rewrite
  menunjuk `http://localhost:4000` dan semua request API 404.
- `NEXT_PUBLIC_API_URL` — opsional. Hanya dipakai kalau Anda ingin frontend
  memanggil backend langsung (cross-origin). Default dikosongkan (relatif) agar
  trafik lewat rewrite. Kalau diisi cross-origin, set juga `FRONTEND_ORIGIN`
  di backend supaya CORS mengizinkannya.

Env backend (Render) diatur otomatis oleh `render.yaml`:

- `NODE_ENV=production`, `DB_DIR=/var/data` (disk persistent), dan tiga env yang
  diisi manual: `FRONTEND_ORIGIN` (URL Vercel), `ADMIN_PASSWORD`, dan
  **`WHATSAPP_NUMBER`**.

## Langkah A — Deploy backend di Render

1. Buka dashboard Render -> **New+** -> **Blueprint**.
2. Pilih repository GitHub `B2C-TUGAS-UAS` (repo ini).
3. Render membaca `render.yaml` di root repo. Konfirmasi blueprint (service
   `craftai-backend`, node runtime, root dir `backend`).
4. Klik **Apply / Deploy**. Build menjalankan `npm ci && npm run build`, lalu
   `npm start` (Express di port `PORT`, otomatis dari Render).
5. Setelah service hidup, salin URL publiknya:
   `https://<nama>-<hash>.onrender.com` (halaman service di dashboard).

Catatan: env `FRONTEND_ORIGIN`, `ADMIN_PASSWORD` & `WHATSAPP_NUMBER` ditandai
`sync: false` (sengaja tidak diberi nilai default). Deploy tetap berhasil tanpa
ketiganya; Anda mengisinya di Langkah C.

## Langkah B — Deploy frontend di Vercel

1. Buka dashboard Vercel -> **Add New...** -> **Project** -> **Import** repo
   `B2C-TUGAS-UAS`.
2. **Root Directory: `frontend`** (penting — repo berisi dua proyek).
   Framework preset otomatis Next.js. Build command & output default cukup.
3. Tambahkan Environment Variable:
   - `BACKEND_ORIGIN` = URL Render dari Langkah A
     (mis. `https://craftai-backend-xxxx.onrender.com`, tanpa trailing slash).
4. Klik **Deploy**. Tunggu build sukses; URL produksi jadi
   `https://<proj>.vercel.app`.

> `BACKEND_ORIGIN` dibaca Next.js **saat build** (config `next.config.ts`) dan
> dibutuhkan juga oleh SSR fetch di `sitemap.ts` / halaman customizer. Kalau
> variabel diubah belakangan, **redeploy** agar rewrite ikut berubah.

## Langkah C — Kembali ke Render: set origin & password

1. Buka service `craftai-backend` di Render -> tab **Environment**.
2. `FRONTEND_ORIGIN` = URL Vercel dari Langkah B
   (mis. `https://craftai-studio.vercel.app`, tanpa trailing slash). Ini
   dipakai backend untuk CORS bila ada fetch absolut lewat `NEXT_PUBLIC_API_URL`.
   Kalau frontend memakai default (relatif lewat rewrite), env ini opsional tapi
   tetap dianjurkan.
3. `ADMIN_PASSWORD` = password back-office pilihan Anda. Bila dibiarkan kosong,
   backend memakai default `admin123`.
   **Catatan redesign:** verifikasi sesi admin dilakukan oleh **backend**
   (`frontend/middleware.ts` memanggil `GET /api/admin/session`), jadi
   `ADMIN_PASSWORD` cukup diset **di Render saja** — tidak perlu disalin ke
   Vercel. Pastikan `BACKEND_ORIGIN` di Vercel menunjuk service ini, karena
   gerbang `/admin` bergantung padanya.
4. `WHATSAPP_NUMBER` = nomor WhatsApp bisnis Anda dalam format internasional
   **tanpa `+` dan tanpa spasi**, contoh `6281234567890`. Dipakai endpoint
   `GET /api/contact` untuk merakit link `https://wa.me/<number>` (tombol
   "Buka WhatsApp", "Chat via WhatsApp", "Chat ke Customer"). Bila dibiarkan
   kosong, backend memakai placeholder `6281234567890` — **wajib diganti**
   sebelum produksi supaya pesanan masuk ke nomor yang benar.
5. Simpan. Render otomatis **redeploy**. Tunggu service kembali hidup
   (perhatikan **Logs**: `[backend] Aether Creative API berjalan di ...`).

## Langkah D — Verifikasi

1. Buka URL Vercel (root `/`) -> katalog menampilkan **3 kartu poster**
   (Poster Promo Kuliner, Poster Kreator & Portofolio, Poster Toko Online) yang
   diambil dari backend.
2. Buka `/admin/login` -> login dengan `ADMIN_PASSWORD` (default `admin123`).
   Setelah login, kanban admin tampil; di detail order ada **Editor Konten
   Poster** (simpan lewat `PUT /api/admin/orders/:id/poster`) dan tombol
   **Chat ke Customer**.
3. Di `/orders`, lacak nomor order demo **UK-ORD-8812** -> status `in_progress`,
   konten poster tersimpan (diisi editor, `engine = manual`).
4. Isi brief + kontak di `/customizer/<templateId>` -> **Kirim Pesanan via
   WhatsApp** -> muncul nomor order + tombol **Buka WhatsApp** (link `wa.me`
   berisi nomor order, paket, ETA, brief). Cek `GET /api/contact` mengembalikan
   nomor dari `WHATSAPP_NUMBER`, bukan placeholder.

Kalau semuanya berjalan, deploy sukses.

## Catatan penting

- **Database**: SQLite di disk persistent Render (`DB_DIR=/var/data`, disk
  `craftai-data` 1 GB). Data **selamat** saat redeploy / restart, tetapi
  **hilang** kalau service dihapus/di-recreate dari nol. Saat DB baru, seed
  idempoten otomatis mengisi 3 template + order demo UK-ORD-8812.
- **Rate limit**: in-memory per instance. Free plan = 1 instance, jadi konsisten.
  Kalau nanti scale >1 instance, tiap instance punya ember terpisah.
- **Cold start**: free plan Render *spin-down* saat idle; request pertama setelah
  idle bisa memakan ~30 detik (service "bangun"). Tunggu sebentar, lalu reload.

## Troubleshooting

- **API 404 / semua request `/api/*` gagal dari frontend**: `BACKEND_ORIGIN`
  belum diset atau frontend belum di-redeploy. Rewrite dibaca saat build —
  set env lalu **redeploy** proyek Vercel.
- **CORS error di console browser**: ada `NEXT_PUBLIC_API_URL` yang menunjuk
  origin berbeda (cross-origin) tanpa `FRONTEND_ORIGIN` di backend yang cocok.
  Solusi: kosongkan `NEXT_PUBLIC_API_URL` (pakai rewrite) atau tambahkan origin
  frontend ke `FRONTEND_ORIGIN` di Render lalu redeploy.
- **Cookie admin gagal / langsung logout**: login dilakukan via `http://`
  (cookie `Secure` hanya dikirim di https). Pastikan akses lewat URL https
  Vercel, bukan http.
- **Login ditolak terus**: cek `ADMIN_PASSWORD` di Render. Bila kosong, pakai
  default `admin123`.
- **Tombol WhatsApp mengarah ke nomor asing (placeholder `6281234567890`)**:
  `WHATSAPP_NUMBER` belum diset di Render. Isi di Environment -> Environment
  Variables (format internasional tanpa `+`), lalu tunggu redeploy; cek
  `GET /api/contact` menampilkan nomor Anda.
- **Render service gagal start**: cek Logs — biasanya `npm ci` gagal karena
  `package-lock.json` tidak ada di `backend/` (pastikan file lock ter-commit),
  atau `PORT` bentrok (Render sudah supply `PORT`, jangan override manual).