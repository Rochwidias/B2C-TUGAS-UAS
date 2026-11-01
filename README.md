# PosterAI — Marketplace Poster AI + Finishing Manusia

Proyek B2C untuk tugas kelompok: toko poster yang menjual karya **dibuat dengan model AI, lalu dirapikan manual oleh manusia sebelum dicetak**. Karena itu setiap produk punya dua bagian yang ditampilkan di halaman detail: `aiPrompt` (prompt yang dipakai) dan `humanNote` (apa yang diubah manusia).

Pembayaran masih **simulasi**: tidak ada payment gateway, order langsung berstatus `PAID` dan stok berkurang.

## Stack

| Bagian | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) + TypeScript |
| Styling | Tailwind CSS v4 (token warna di `app/globals.css`) |
| Database | SQLite + Prisma 6 |
| Auth | Cookie JWT httpOnly (`jose`) + `bcryptjs` |
| Validasi | Zod (dipakai di client form dan server action) |
| Test | Vitest (logika harga, cart, auth, checkout, status pesanan) |

## Menjalankan

```bash
npm install            # menginstall dependency
cp .env.example .env   # atau buat sendiri, lihat di bawah
npx prisma migrate deploy
npx prisma db seed
npm run dev            # http://localhost:3000
```

Isi `.env`:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ganti-dengan-string-acak-panjang"
```

`.env` sudah disiapkan untuk lingkungan lokal; ganti `AUTH_SECRET` sebelum deploy.

### Akun demo

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@posterai.id` | `admin12345` |
| User | `demo@posterai.id` | `demo12345` |

`npm run db:reset` menghapus database lalu menjalankan ulang migrasi + seed.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run build` | Build produksi + typecheck |
| `npm test` | Semua test Vitest (butuh `test.db` sementara, dibuat otomatis) |
| `npm run db:seed` | Isi ulang data demo |
| `npm run db:reset` | Reset database + seed |

## Alur pengguna

1. **Beranda** — poster unggulan, penjelasan konsep AI + manusia, kategori.
2. **Katalog** `/products` — pencarian (judul, deskripsi, prompt), filter kategori, urut harga, paginasi.
3. **Detail** `/products/[slug]` — galeri, pemilih ukuran (A4/A3/A2) × bingkai, stok per varian, section "Di balik poster ini".
4. **Keranjang** `/cart` — tersimpan di `localStorage`, jumlah dibatasi stok.
5. **Checkout** `/checkout` — alamat + pembayaran simulasi, idempotency key mencegah order ganda.
6. **Sukses** `/checkout/success?order=...` — ringkasan pesanan, keranjang dikosongkan.
7. **Akun** `/account/orders` — riwayat dan detail pesanan milik sendiri.
8. **Custom order** `/custom-order` — kirim brief, lihat status dan penawaran harga.

## Panel admin `/admin`

- **Ringkasan** — jumlah poster aktif, pesanan, pendapatan (tanpa order batal), brief menunggu, varian stok tipis.
- **Produk** — tambah/edit poster, aktif/nonaktifkan. Poster baru otomatis mendapat 9 varian (3 ukuran × 3 bingkai) dengan harga turunan dari harga dasar.
- **Pesanan** — filter status, ubah status. Status `CANCELLED` mengembalikan stok tepat satu kali dan tidak bisa dibuka kembali.
- **Custom order** — kirim penawaran harga, catatan, dan ubah status.

Akses `/admin` dijaga di `app/admin/layout.tsx` (`requireAdmin`), bukan hanya menyembunyikan link.

## Struktur folder

```
app/
  page.tsx                 beranda
  products/                katalog + detail
  cart/ checkout/          keranjang + checkout + sukses
  account/orders/          riwayat pesanan user
  custom-order/            brief custom
  admin/                   layout terproteksi + dashboard + CRUD
  login/ register/         autentikasi
actions/                   server actions (auth, checkout, custom order, admin)
components/                UI, cart provider, form, kartu poster
lib/
  orders.ts                createOrder + updateOrderStatus (inti transaksi)
  pricing.ts               calcTotals, calcShipping, variantPrice, variantMatrix
  cart.ts                  reducer cart murni (dipakai test)
  session.ts               cookie JWT + requireUser/requireAdmin
  validation.ts            skema Zod
prisma/                    schema, migrasi, seed
public/posters/            12 poster SVG 3:4
tests/                     Vitest
docs/PLAN.md               rencana 14 task
docs/DEMO.md               skenario demo presentasi
```

## Keputusan keamanan & konsistensi data

- Harga dan stok **selalu dihitung ulang di server** saat checkout; angka dari `localStorage` diabaikan (ada test khusus untuk ini).
- `createOrder` berjalan dalam satu transaksi Prisma: validasi stok → buat order → kurangi stok.
- Idempotency key unik mencegah order ganda saat tombol diklik dua kali.
- Pesanan user lain menghasilkan 404, bukan hanya redirect.
- Semua server action admin memanggil `requireAdmin()` sendiri, jadi tidak bergantung pada proteksi halaman saja.

## Keterbatasan

- Pembayaran, ongkir, dan nomor resi hanya simulasi.
- Gambar poster adalah SVG yang dibuat `scripts/generate-posters.mjs` (bukan hasil model AI sungguhan) agar repo ringan dan bebas lisensi.
- Stok varian belum bisa diedit dari UI admin; hanya berkurang lewat checkout dan bertambah saat pembatalan.
- Belum ada upload gambar; admin memilih dari daftar di `public/posters/`.
