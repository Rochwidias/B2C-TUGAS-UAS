# Deploy Aether Creative: Vercel (frontend-only)

Aplikasi ini **frontend-only** (kontrak [`FRONTEND-ONLY.md`](FRONTEND-ONLY.md)):
tidak ada backend, tidak ada database, tidak ada `render.yaml`. Deploy cukup
**satu proyek di Vercel**. Data pesanan hidup di localStorage browser
per-perangkat, jadi tidak ada konfigurasi server atau disk tambahan.

```
Browser  ->  https://<proj>.vercel.app        (Next.js, root directory frontend)
             semua halaman + data di localStorage browser masing-masing
```

## Langkah deploy

1. Push repo ini ke GitHub (tanpa folder `backend/` — sudah dihapus).
2. Buka dashboard Vercel -> **Add New...** -> **Project** -> **Import** repo
   `B2C-TUGAS-UAS`.
3. **Root Directory: `frontend`** (penting — repo juga berisi `docs/` dan
   artefak Milestone 1). Framework preset terdeteksi otomatis **Next.js**;
   build command dan output default cukup.
4. Tambahkan **Environment Variables** (Project → Settings → Environment
   Variables, atau di langkah import):

   | Variabel | Wajib? | Nilai |
   |---|---|---|
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | **Wajib diganti** | Nomor WhatsApp bisnis Anda, format internasional **tanpa `+` dan tanpa spasi**, contoh `6281234567890`. Dipakai merakit semua link `wa.me` (Buka WhatsApp saat checkout, Chat via WhatsApp di `/orders`, Chat ke Customer di back-office). Placeholder default `6281234567890` akan mengarahkan pesanan ke nomor yang salah. |
   | `NEXT_PUBLIC_ADMIN_PASSWORD` | Disarankan | Password back-office `/admin/login`. Default `admin123` bila tidak diisi. |
   | `NEXT_PUBLIC_SITE_URL` | Opsional | URL produksi, mis. `https://<proj>.vercel.app` — dipakai metadata, `sitemap.ts`, dan `robots.ts`. Default `http://localhost:3000`. |

5. Klik **Deploy**. Tunggu build sukses; URL produksi jadi
   `https://<proj>.vercel.app`.

Tidak ada variabel lain. `BACKEND_ORIGIN`, `NEXT_PUBLIC_API_URL`, dan
`render.yaml` **sudah tidak dipakai** — backend dihapus total 2026-11-25.

## Verifikasi setelah deploy

1. Buka URL produksi (root `/`) -> katalog menampilkan **3 kartu poster**
   (Poster Promo Kuliner, Poster Kreator & Portofolio, Poster Toko Online) dan
   **2 kartu paket** (Satuan Rp50.000, Paket Hemat Rp100.000).
2. Isi brief + kontak di `/customizer/<templateId>` -> **Kirim Pesanan via
   WhatsApp** -> muncul nomor order berpola `UK-ORD-XXXX` + tombol **Buka
   WhatsApp** (link `wa.me`). Pastikan nomor tujuan di link adalah nomor Anda,
   bukan placeholder.
3. Buka `/orders?number=UK-ORD-8812` -> pesanan demo tampil (auto-lookup).
4. Buka `/admin/login` -> login dengan `NEXT_PUBLIC_ADMIN_PASSWORD` (default
   `admin123`) -> kanban tampil dengan pesanan demo **UK-ORD-8812**; pindah
   status dari kanban dan kartu pindah kolom.

## Catatan penting (jujur soal batas aplikasi)

- **Data per perangkat.** Pesanan tersimpan di localStorage browser yang
  dipakai memesan. Perangkat/browser lain (termasuk perangkat admin) **tidak
  melihat** pesanan tersebut. Tidak ada sinkronisasi antar perangkat — ini
  memang demo tanpa backend.
- **Gate admin tingkat demo.** Password dibandingkan di client
  (`NEXT_PUBLIC_ADMIN_PASSWORD` ikut bundle) dan cookie `admin_session`
  diperiksa keberadaannya saja oleh middleware. **Bukan keamanan produksi.**
- **Data hilang bila cache browser dibersihkan** atau mode incognito ditutup.
  Itu perilaku normal localStorage.
