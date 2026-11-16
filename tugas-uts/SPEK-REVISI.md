# SPEK PERBAIKAN — UTS Technopreneur Kelompok 10 (CraftAI Studio)

Deliverable yang harus diperbaiki (jangan bikin baru):
- `D:/Project/B2C-TUGAS-UAS/tugas-uts/Presentasi-CraftAI-Studio-Kelompok-10-UTS-SI134.pptx` (16 slide, 13.333x7.5 in)
- `D:/Project/B2C-TUGAS-UAS/tugas-uts/Makalah-CraftAI-Studio-Kelompok-10-UTS-SI134.docx` (A4)

Builder (SEMUA edit lewat file ini, lalu rebuild; jangan edit .pptx/.docx secara langsung dengan tangan):
- Deck: `D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/deck_core.py` (helper), `deck_slides_a.py` (slide 1-5), `deck_slides_b.py` (slide 6-15), pemangkasan: `python _build/build_deck.py`
- Makalah: `makalah_core.py` (helper), `makalah_content1.py` (sampul/kata pengantar/daftar isi/bab I), `makalah_content2.py` (bab II-III), `makalah_content3.py` (bab IV-V + daftar pustaka + `doc.save(OUT)` di baris 274)
- Gambar: `_build/make_figs.py` (matplotlib → `_build/figs/*.png`)
Interpreter: `D:/hermes/environments/documents/gen-42988a4987bc4c058c9030adb74a997b/venv/Scripts/python.exe` (python-pptx 1.0.2, python-docx, Pillow, reportlab, pypdf, pdfplumber, matplotlib tersedia). Shell = bash git-bash; `$TMPDIR` terbaca `/tmp` yang TIDAK bisa dibaca native python → pakai path `D:/hermes/cache/scratch/...`.

## FAKTA DARI DATABASE (sumber kebenaran: `D:/Project/B2C-TUGAS-UAS/frontend/data/app.db`, baca ulang dengan `sqlite3`)
- Paket: **Basic = Rp150.000** (13 order, total Rp1.950.000); **Pro = Rp250.000** (43 order, total Rp10.750.000). Total **Rp12.700.000** ✓ (ini sudah benar di dokumen).
- `templates.base_price`: Artisan Cafe & Resto **250000**, Modern Creative Portfolio **300000**, Direct-to-Consumer Store **350000** (semua ini SUDAH benar di dokumen — jangan diubah).
- Jadi yang SALAH hanya **harga satuan paket** yang tertulis `Rp250.000` (Basic) dan `Rp500.000` (Pro) — harus jadi `Rp150.000` dan `Rp250.000`.
- Data lain (jangan diubah): 56 order, 107 draft, 127 log; status paid 33 / review 7 / in_progress 1 / completed 15; Pro 76,8%; persona Nasi Goreng Pak Kumis 28 + Warung Bu Tini 16 = 41,1%; hari uji 14-11-2026.

## BUG 1 (KRITIS) — Gambar BMC (fig6) tumpang tindih + keluar batas slide
Penyebab dua-duanya: perkiraan lebar teks di `make_figs.py:206`:
```python
avail_chars = max(12, int((w - 0.34) / 0.0215))   # SALAH: ~2,6x terlalu besar
```
Perkiraan lebar 1 karakter di Calibri 9 ≈ **0,0655 unit sumbu** (bukan 0,0215). Akibat teks 1 blok (mis. Value Propositions, 145 huruf) membungkus cuma 75 karakter → lebar ≈ 4,9 unit padahal lebar blok cuma 2 unit → meluber ke blok tetangga & keluar sumbu.

PERBAIKAN di `make_figs.py` blok Fig 6 (baris 193-214):
1. Ganti konstanta: `avail_chars = max(10, int((w - 0.34) / 0.0655))`
   (w=2 → 25 karakter; w=5 → 71 karakter; verifikasi: setiap baris hasil `textwrap.fill` ≤ lebar blok).
2. Kurangi tinggi gambar agar muat di slide: ganti `figsize=(11.6, 5.6)` → **`(11.6, 4.6)`** (aspect naik ~2,097 → ~2,48).
   Alasan: slide 6 memakai `pic(..., 1.0, 2.3, w=11.3)` di `deck_slides_b.py:8`, tinggi hasil = 11.3/aspect. Sekarang 11.3/2.097 = 5.39 → bawah = 2.3+5.39 = **7.69 > 7.5 (keluar slide)** dan menabrak footer di 6.92. Dengan aspect 2.48 → tinggi 4.55 → bawah 6.85 (aman, di atas garis footer 6.92).
   Budget vertikal slide 6: konten mulai y=2.30, garis footer y=6.92 → tinggi maks gambar **4.55 in**.
3. Sesuaikan posisi judul `ax.text(0, 5.05, ...)` agar mengikuti ylim baru (ylim tetap 0-5; judul di atas kanvas, aman — hanya pastikan `fig.tight_layout()` tetap dipakai).
4. Setelah rebuild: cek `_build/figs/fig6_bmc.png` dengan `vision_analyze` — teks tiap blok harus terkurung di kotaknya sendiri (tidak ada baris teks yang melintasi batas kotak), 9 blok terbaca.
5. Gambar yang sama dipakai makalah: `makalah_content3.py:159` → `figure("fig6_bmc.png", 16.0, ...)`. Karena aspect berubah, tinggi gambar di makalah ikut berubah — pastikan tidak melewati batas bawah halaman (lebar 16 cm di lebar teks A4 16 cm → tinggi = 16/aspect cm; dengan aspect 2.48 → 6.45 cm, aman).

## BUG 2 (KECIL) — 6 textbox slide 14 melewati tepi kanan
`deck_slides_b.py` slide 14 (TINDAKAN): kolom "INDIKATOR" di `x=10.65` dengan `w=3.00/2.90` → kanan = 13.65/13.55 padahal lebar slide 13.333. Definisi sebenarnya (semua `tb(...)` berupa word_wrap=True + auto_size=SHAPE_TO_FIT_TEXT jadi teks tetap terbaca, tapi kotaknya keluar kanvas):
- header: `tb(s, 10.65, 2.50, 3.00, 0.30, "INDIKATOR", ...)` → lebar harus **2.30** (kanan = 12.95)
- 5 baris data di `x=10.65, w=2.90` → lebar harus **2.30**
- Catatan: teks terpanjang "Rata-rata review < 2×24 jam" (26 huruf) pada Calibri 10.5 ≈ 1,7 in → masih muat di 2.30 in. **Sebelum rebuild, verifikasi dengan mengukur lebar teks via PIL `ImageFont.truetype("C:/Windows/Fonts/calibri.ttf", size)`** bahwa teks terpanjang ≤ lebar kotak baru; kalau tidak, naikkan x kolom PEMILIK/INDIKATOR sedikit atau turunkan font jadi 10.
- Juga periksa seluruh slide: tidak boleh ada shape dengan `left+width > 13.3333` atau `top+height > 7.5`.

## BUG 3 (FAKTA) — Harga paket salah di banyak tempat
Ganti SEMUA (11 titik, lewat builder .py, bukan .docx):
- `deck_slides_a.py:154` `("Paket Basic", "Rp250.000", ...)` → `"Rp150.000"`
- `deck_slides_a.py:155` `("Paket Pro", "Rp500.000", ...)` → `"Rp250.000"`
- `makalah_content1.py:245` "dengan harga Rp250.000 per order" → **Rp150.000–Rp250.000 per order** (karena template F&B base_price memang 250000 tapi harga order yang tercatat 150k/250k — pakai frasa yang akurat: "dengan harga Rp150.000 sampai Rp250.000 per order")
- `makalah_content2.py:123` `paket Pro (Rp500.000)` → `(Rp250.000)`; `paket Basic (Rp250.000)` → `(Rp150.000)`
- `makalah_content2.py:165` `Basic Rp250.000 dan Pro Rp500.000` → `Basic Rp150.000 dan Pro Rp250.000`
- `makalah_content2.py:201` `paket Basic seharga Rp250.000 dan paket Pro seharga Rp500.000` → `Rp150.000` / `Rp250.000`
- `makalah_content3.py:35-36` `paket Pro seharga Rp500.000` → `Rp250.000`; `paket Basic seharga Rp250.000` → `Rp150.000`
- `makalah_content3.py:156` `Basic Rp250.000 dan Pro Rp500.000` → `Basic Rp150.000 dan Pro Rp250.000`
- `makalah_content3.py:185` `Basic Rp250.000 dan Pro Rp500.000` → `Basic Rp150.000 dan Pro Rp250.000`
- `make_figs.py:191` Revenue Streams body: `pakét Basic Rp250.000 dan Pro Rp500.000` → `Basic Rp150.000 dan Pro Rp250.000`
- `makalah_content2.py:215-216` baris tabel (Rp10.750.000 / Rp1.950.000) → **SUDAH BENAR**, jangan diubah.
- JANGAN ubah angka Rp250.000 yang merujuk `templates.base_price` Artisan Cafe & Resto (ada di `makalah_content2.py:198,212` dan `makalah_content3.py:23,44`) — itu benar.
Setelah ganti, jalankan grep untuk memastikan tidak ada sisa `"Rp500.000"` (kecuali biaya riset responden `Rp500.000` di `makalah_content2.py:272` dan `deck_slides_b.py:103` — itu ANGKA BIAYA RISET, BUKAN harga paket → **jangan diubah**).

## VERIFIKASI WAJIB SETELAH REBUILD
1. `python _build/build_deck.py` → sukses, file .pptx tertulis.
2. `python _build/build_makalah.py` → sukses, file .docx tertulis.
3. Jalankan `D:/Project/B2C-TUGAS-UAS/tugas-uts/verify.py <nama_pptx> <nama_docx>` dengan venv documents → harus keluar `ALL CHECKS PASSED`.
4. Cek geometri sendiri: iterasi semua shape di kedua file → tidak ada yang `left<0`, `top<0`, `left+width>13.3333` (pptx) / `>21cm` (docx gambar), `top+height>7.5` (pptx).
5. Render ulang preview kalau bisa: `powershell -File _build/export_slides.ps1` (PowerPoint COM) dan `_build/export_doc.ps1` (Word COM), lalu `vision_analyze` slide 6, 14, dan halaman makalah yang memuat Gambar 6 — pastikan teks blok BMC terkurung, tidak ada yang terpotong.
6. Laporkan angka verifikasi persis (jumlah slide, jumlah paragraf, jumlah tabel, hasil grep harga).