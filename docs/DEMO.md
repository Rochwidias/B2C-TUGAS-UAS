# Skenario Demo (≈5 menit)

Persiapan sebelum tampil:

```bash
npm run db:reset   # data bersih: 2 user, 12 poster, 108 varian
npm run dev
```

Buka dua jendela browser: satu **normal** (user), satu **incognito** (admin). Jangan lupa `npm run build` + `npm test` sudah hijau sebelum kelas.

---

## 0. Pembuka (30 detik)

Buka beranda. Tunjukkan headline dan kalimat konsep: poster dibuat model AI, lalu dirapikan manusia. Sebutkan bahwa pembeda proyek ini bukan sekadar toko poster — ada bukti proses di tiap produk.

## 1. Admin menambah produk (60 detik)

1. Masuk sebagai `admin@posterai.id` / `admin12345` → otomatis ke `/admin`.
2. Tunjukkan kartu statistik (poster aktif, pendapatan, brief menunggu).
3. **Produk → + Poster baru**: isi judul, deskripsi, kategori, harga dasar, pilih gambar, isi prompt AI dan catatan manusia. Simpan.
4. Buka `/admin/products`, tunjukkan poster baru muncul dengan 9 varian (3 ukuran × 3 bingkai) dan harga turunan otomatis.

> Poin bicara: harga varian dihitung dari satu harga dasar, jadi admin tidak mengisi 9 harga manual.

## 2. User berbelanja (90 detik)

1. Di jendela normal, buka `/products`, coba pencarian dan filter kategori.
2. Buka satu poster, ganti ukuran ke **A2 + bingkai hitam**, lihat harga berubah, tambah ke keranjang.
3. Buka `/cart`, ubah jumlah, tunjukkan ongkir jadi gratis di atas Rp 250.000.
4. **Checkout**: isi alamat, klik bayar. Tunjukkan halaman sukses dan keranjang kosong.

> Poin bicara: harga di keranjang hanya untuk tampilan; server menghitung ulang saat order dibuat (ada test `memakai harga dari database, bukan harga kiriman client`).

## 3. Riwayat & status (60 detik)

1. Buka `/account/orders`, buka detail pesanan — perhatikan nomor order dan status **Dibayar**.
2. Pindah ke jendela admin: `/admin/orders`, ubah status ke **Dikirim**, simpan.
3. Refresh halaman user: status ikut berubah.

> Poin bicara: admin juga bisa membatalkan pesanan; stok kembali tepat satu kali dan pesanan tidak bisa diaktifkan lagi.

## 4. Custom order (60 detik)

1. Sebagai user, buka `/custom-order`, kirim brief (tema, gaya, ukuran, budget).
2. Sebagai admin, buka `/admin/custom-orders`, isi penawaran harga dan catatan, ubah status ke **Penawaran dikirim**.
3. Refresh halaman user: penawaran dan catatan tampil di daftar permintaan.

## 5. Penutup (30 detik)

Tunjukkan `npm test` — 39 test hijau, termasuk test stok, idempotency, dan pembatalan. Sebutkan batasan: pembayaran simulasi dan gambar placeholder SVG.

---

## Jika ada pertanyaan

| Pertanyaan | Jawaban singkat |
|---|---|
| Kenapa bukan payment gateway? | Fokus tugas ada di alur B2C dan konsistensi data; gateway butuh akun bisnis dan KYC. |
| Bagaimana mencegah harga diubah dari devtools? | Server mengabaikan harga kiriman; hanya `variantId` + `quantity` yang dipakai, harga diambil dari database. |
| Bagaimana kalau stok habis saat checkout? | Transaksi Prisma memvalidasi ulang stok dan menolak dengan pesan spesifik; stok tidak berubah. |
| Bagaimana user biasa tidak bisa buka `/admin`? | `app/admin/layout.tsx` memanggil `requireAdmin()` pada setiap request, plus setiap action admin memeriksa sesi lagi. |
| Kenapa SQLite? | Cukup untuk demo dan tidak butuh server database; Prisma memudahkan pindah ke Postgres. |
