# -*- coding: utf-8 -*-
"""Deck v2 slides 6-16 — Canva Blue & Purple Gradient style."""

# ---------------------------------------------------------------- 6 BMC
s = add_slide(bg=OFFWHITE)
head(s, "Rancangan", "Sembilan blok yang saling mengunci.",
     "Business Model Canvas CraftAI Studio — nilai, segmen, kanal, dan pendapatan dalam satu peta.")
pic(s, f"{FIG}/fig6_bmc.png", 1.37, 2.3, w=10.6)
tb(s, 0.85, 6.5, 11.6, 0.4,
   "Blok value propositions menjadi poros: halaman jualan cepat + hasil yang ditinjau manusia, "
   "dijual per order ke empat segmen UMKM.", size=11, color=MUTED, italic=True)
footer(s, 6)

# ---------------------------------------------------------------- 7 DATA SIMULASI
s = add_slide(bg=WHITE)
head(s, "Data aplikasi", "Satu hari uji: 56 order, 107 draf, 127 log.",
     "Angka-angka berikut menjadi bukti perilaku nyata yang dipakai untuk memilih segmen dan menyusun peta.")
pic(s, f"{FIG}/fig2_data_aplikasi.png", 0.85, 2.3, w=11.6)
tb(s, 0.85, 5.85, 5.7, 0.9,
   "Paket Pro menyerap 76,8% order: pelanggan mau membayar lebih ketika ada jaminan revisi dan "
   "pemeriksaan manusia.", size=11.5, color=MUTED, spacing=1.2, italic=True)
tb(s, 6.8, 5.85, 5.7, 0.9,
   "Persona dominan “Nasi Goreng Pak Kumis” (28) dan “Warung Bu Tini” (16) = 41,1% draf AI: "
   "pasar awalnya adalah usaha kuliner kecil.", size=11.5, color=MUTED, spacing=1.2, italic=True)
footer(s, 7)

# ---------------------------------------------------------------- 8 SEGMENTASI
s = add_slide(bg=OFFWHITE)
head(s, "Segmentasi pasar", "Empat segmen sasaran CraftAI Studio.",
     "Prioritas ditentukan dari kontribusi pendapatan simulasi, frekuensi persona, dan potensi sektor terkait.")
pic(s, f"{FIG}/fig3_segmentasi.png", 0.85, 2.3, w=7.1)
segs = [
    ("S1", "Kafe & resto kecil", "100% order · template F&B", PURPLE),
    ("S2", "Warung & kuliner mikro", "44 draf dari dua persona", BLUE),
    ("S3", "Kreator & portofolio", "template Rp300.000 belum terpakai", GOLD),
    ("S4", "Toko online D2C", "template Rp350.000 belum terpakai", CORAL),
]
y = 2.35
for tag, nm, note, c in segs:
    card(s, 8.3, y, 4.18, 1.0, fill=WHITE, bar=False, line_color=RGBColor(0xE2, 0xE8, 0xF0))
    rect(s, 8.3, y, 0.05, 1.0, fill=c, shape=MSO_SHAPE.RECTANGLE)
    tb(s, 8.55, y + 0.14, 0.7, 0.3, tag, size=13, bold=True, color=c)
    tb(s, 9.2, y + 0.14, 3.1, 0.3, nm, size=13, bold=True, color=INK)
    tb(s, 8.55, y + 0.5, 3.7, 0.4, note, size=10, color=MUTED, spacing=1.1)
    y += 1.08
tb(s, 0.85, 6.3, 11.6, 0.5,
   "Segmen kuliner mikro diprioritaskan: sektor penyediaan akomodasi, makan dan minum tercatat "
   "6,41 juta unit usaha dalam data UMKM nasional 2025.", size=11, color=MUTED, italic=True)
footer(s, 8)

# ---------------------------------------------------------------- 9 EMPAT DIMENSI
s = add_slide(bg=WHITE)
head(s, "Segmentasi pasar", "Empat sudut pandang, satu gambaran segmen.",
     "Demografis menjawab siapa, geografis di mana, psikografis mengapa, perilaku bagaimana.")
dims = [
    ("Demografis", "Siapa", PURPLE, [
        "Pemilik usaha 20–45 tahun",
        "Usaha mikro, karyawan < 10 orang",
        "Mayoritas omzet < Rp60 jt/tahun",
    ]),
    ("Geografis", "Di mana", BLUE, [
        "Basis uji: Yogyakarta & sekitarnya",
        "Ekspansi: Jawa Tengah, Jabodetabek",
        "Penetrasi internet Jawa 84,69%",
    ]),
    ("Psikografis", "Mengapa", GOLD, [
        "Ingin terlihat profesional & hemat waktu",
        "Terbuka pada AI, tetap mau kontrol isi",
        "Sensitif pada kesesuaian tone merek",
    ]),
    ("Perilaku", "Bagaimana", CORAL, [
        "Aktif jualan di Instagram & WhatsApp",
        "Pilih paket yang ada jaminan revisi",
        "Repeat order setelah hasil memuaskan",
    ]),
]
x = 0.85
for title, q, c, items in dims:
    card(s, x, 2.4, 2.7, 3.1, fill=WHITE, bar_color=c)
    tb(s, x + 0.25, 2.6, 2.2, 0.3, title, size=14, bold=True, color=INK)
    tb(s, x + 0.25, 2.95, 2.2, 0.25, q.upper(), size=10, bold=True, color=c, tracking=2.0)
    yy = 3.4
    for it in items:
        tb(s, x + 0.25, yy, 0.2, 0.2, "•", size=12, bold=True, color=c)
        tb(s, x + 0.45, yy, 2.0, 0.7, it, size=10.5, color=MUTED, spacing=1.15)
        yy += 0.7
    x += 2.91
rect(s, 0.85, 5.75, 11.63, 0.85, fill=PURPLE_XL, adj=0.12)
tb(s, 1.15, 5.95, 11.0, 0.5,
   "Pemetaan empat dimensi ini yang mengubah “UMKM” yang luas menjadi empat segmen yang bisa "
   "dilayani dengan pesan, template, dan harga berbeda.", size=11.5, color=PURPLE, spacing=1.2)
footer(s, 9)

# ---------------------------------------------------------------- 10 RENCANA RISET
s = add_slide(bg=OFFWHITE)
head(s, "Rencana riset", "Siapa, kapan, di mana, berapa biaya.",
     "Riset lanjutan untuk memvalidasi empat segmen dan kurva emosi yang kini berasal dari simulasi satu hari uji.")
plan = [
    ("SIAPA", "20 pelaku UMKM", "Pemilik kafe, warung, dan toko online di Yogyakarta; 5 di antaranya wawancara mendalam"),
    ("KAPAN", "3 minggu", "Minggu 1 penyusunan instrumen, minggu 2 pengumpulan, minggu 3 analisis"),
    ("DI MANA", "Yogyakarta & online", "Kota Yogyakarta, Sleman, Bantul; pendampingan via WhatsApp dan Google Form"),
    ("BERAPA BIAYA", "Rp1.200.000", "Incentif responden Rp500.000 · alat bantu Rp150.000 · operasional Rp400.000 · dokumentasi Rp150.000"),
]
y = 2.4
for i, (k, big, d) in enumerate(plan):
    card(s, 0.85, y, 7.4, 0.95, fill=WHITE if i % 2 == 0 else PURPLE_XL, bar=False,
         line_color=RGBColor(0xE2, 0xE8, 0xF0))
    tb(s, 1.1, y + 0.17, 1.9, 0.3, k, size=10.5, bold=True, color=PURPLE, tracking=1.5)
    tb(s, 1.1, y + 0.45, 2.6, 0.4, big, size=15, bold=True, color=INK)
    tb(s, 3.9, y + 0.2, 4.1, 0.7, d, size=10.5, color=MUTED, spacing=1.15)
    y += 1.03
card(s, 8.5, 2.4, 3.98, 4.05, fill=NAVY, bar=True, bar_color=GOLD)
tb(s, 8.8, 2.65, 3.4, 0.3, "PEMBAGIAN TUGAS KELOMPOK", size=10.5, bold=True,
   color=GOLD_L, tracking=1.5)
tasks = [
    ("Recasar", "Instrumen & analisis segmen"),
    ("Jefri", "Wawancara & pengumpulan data"),
    ("Akhdhiyat", "Peta perjalanan & emotion curve"),
    ("Affan", "Rancang komunikasi riset"),
    ("Hadi", "Biaya, jadwal & dokumentasi"),
]
yy = 3.05
for nm, role in tasks:
    tb(s, 8.8, yy, 1.6, 0.26, nm, size=11.5, bold=True, color=WHITE)
    tb(s, 8.8, yy + 0.24, 3.4, 0.3, role, size=10, color=DIM)
    yy += 0.62
footer(s, 10)

# ---------------------------------------------------------------- 11 PENGAMBILAN DATA
s = add_slide(bg=WHITE)
head(s, "Pengambilan data", "Dua sumber, empat metode.",
     "Data primer dari simulasi platform digabungkan dengan data sekunder dari lembaga dan literatur.")
card(s, 0.85, 2.4, 5.6, 3.6, fill=WHITE, bar_color=PURPLE, line_color=RGBColor(0xE2, 0xE8, 0xF0))
tb(s, 1.1, 2.6, 5.0, 0.3, "DATA PRIMER · SIMULASI PLATFORM", size=11, bold=True,
   color=PURPLE, tracking=1.5)
prim = [
    ("56 order", "Pesanan halaman jualan selama hari uji 14 Nov 2026"),
    ("107 draf AI", "Keluaran structured output yang menunggu validasi"),
    ("127 log", "Catatan aktivitas sistem & aksi pengguna"),
]
yy = 3.0
for v, d in prim:
    tb(s, 1.1, yy, 2.0, 0.3, v, size=15, bold=True, color=PURPLE)
    tb(s, 3.1, yy + 0.03, 3.2, 0.6, d, size=10.5, color=MUTED, spacing=1.15)
    yy += 0.7
tb(s, 1.1, 5.1, 5.0, 0.7,
   "Metode: observasi alur penggunaan, penelusuran basis data (database tracing), dan dokumentasi layar.",
   size=10.5, color=MUTED, spacing=1.2)

card(s, 6.8, 2.4, 5.68, 3.6, fill=WHITE, bar_color=BLUE, line_color=RGBColor(0xE2, 0xE8, 0xF0))
tb(s, 7.05, 2.6, 5.0, 0.3, "DATA SEKUNDER · LEMBAGA & LITERATUR", size=11, bold=True,
   color=BLUE, tracking=1.5)
sec_rows = [
    ("APJII 2025", "229,43 juta pengguna internet · penetrasi 80,66%"),
    ("KemenUMKM 2025", "30,21 juta unit UMKM non-pertanian (31 Des 2025)"),
    ("INDEF 2024", "56,30% jualan via media sosial · 47,64% e-commerce"),
    ("Deckary / Swivel", "Kerangka customer journey map & praktik loyalitas"),
]
yy = 3.0
for k, v in sec_rows:
    tb(s, 7.05, yy, 2.4, 0.3, k, size=11.5, bold=True, color=BLUE)
    tb(s, 9.4, yy + 0.03, 3.0, 0.5, v, size=10.5, color=MUTED, spacing=1.15)
    yy += 0.62
tb(s, 7.05, 5.1, 5.2, 0.7,
   "Metode: studi dokumen, kajian pustaka, dan penelusuran sumber resmi untuk mengontekskan temuan simulasi.",
   size=10.5, color=MUTED, spacing=1.2)
rect(s, 0.85, 6.2, 11.63, 0.5, fill=PURPLE_XL, adj=0.2)
tb(s, 1.15, 6.3, 11.0, 0.3,
   "Jenis penelitian: deskriptif + studi kasus + simulasi platform — menggambarkan keadaan objek apa adanya berdasarkan data.",
   size=11, color=PURPLE)
footer(s, 11)

# ---------------------------------------------------------------- 12 CJM MATRIX (dark)
s = add_slide(bg=NAVY)
head(s, "Customer journey map", "Lima tahap, empat kolom pembacaan.",
     "Setiap tahap dipetakan lewat touchpoint, pain point, emosi, dan peluang perbaikan.", dark=True)
cols = ["Tahap", "Touchpoint", "Pain point", "Emosi", "Peluang"]
widths = [1.5, 3.3, 3.5, 1.3, 2.6]
rows_data = [
    ("Aware", "Sosial media, rekomendasi\nsesama UMKM", "Belum tahu halaman jualan bisa\ndibuat cepat", "+1", "Pesan utama = masalah\npromosi harian UMKM"),
    ("Consider", "Halaman harga, galeri hasil,\nchat WhatsApp", "Dua paket & tiga template\nmembingungkan", "−1", "Contoh per segmen +\nrekomendasi paket otomatis"),
    ("Purchase", "Checkout, konfirmasi\npembayaran", "Cemas bayar tanpa hasil\nyang jelas", "−0,5", "Tampilkan hasil, garansi\nrevisi, estimasi waktu"),
    ("Use", "Brief, editor draf, layar\nreview, notifikasi", "Menunggu validasi manusia\nterasa lama", "+2", "SLA review 2×24 jam +\npemberitauan progres"),
    ("Loyal", "Hasil final, testimoni,\npenawaran ulang", "Belum ada pengingat &\nprogram loyalitas", "+3", "Repeat order & program\nrujukan antarUMKM"),
]
x0, y0 = 0.85, 2.6
hgt = 0.72
xx = x0
for c, w in zip(cols, widths):
    tb(s, xx + 0.1, y0, w, 0.3, c.upper(), size=10, bold=True, color=GOLD_L, tracking=1.5)
    xx += w
hline(s, x0, y0 + 0.3, 11.8, color=BORDER)
yy = y0 + 0.45
for i, row in enumerate(rows_data):
    if i % 2 == 0:
        rect(s, x0 - 0.05, yy - 0.08, 12.2, hgt, fill=CARD, shape=MSO_SHAPE.RECTANGLE)
    xx = x0
    for j, (val, w) in enumerate(zip(row, widths)):
        if j == 0:
            tb(s, xx + 0.1, yy + 0.05, w, 0.3, val, size=13, bold=True, color=WHITE)
        elif j == 3:
            tb(s, xx + 0.1, yy + 0.02, w, 0.4, val, size=17, bold=True,
               color=GOLD_L if val.startswith("−") else PURPLE_L)
        else:
            tb(s, xx + 0.1, yy, w - 0.1, 0.6, val, size=9.5, color=DIM, spacing=1.15)
        xx += w
    yy += hgt
tb(s, 0.85, 6.4, 11.6, 0.4,
   "Dua titik terendah: lembah pertimbangan (−1) dan kecemasan pembelian (−0,5) — keduanya jadi prioritas perbaikan.",
   size=11, color=DIM2, italic=True)
footer(s, 12, dark=True)

# ---------------------------------------------------------------- 13 EMOTION CURVE
s = add_slide(bg=WHITE)
head(s, "Emotion curve", "Dari bingung, ke antusias, lalu loyal.",
     "Skala emosi −3 sampai +4 pada lima tahap: aware +1, consider −1, purchase −0,5, use +2, loyal +3.")
pic(s, f"{FIG}/fig4_emotion_curve.png", 0.85, 2.3, w=8.4)
reads = [
    ("Lembah pertimbangan", "−1", "Calon pelanggan ragu memilih paket & template", GOLD),
    ("Kecemasan bayar", "−0,5", "Takut membayar tanpa hasil yang jelas", GOLD),
    ("Naik saat melihat draf", "+2", "Begitu draf muncul, kekhawatiran turun", PURPLE),
    ("Puncak di loyal", "+3", "Hasil diterima, siap merekomendasikan", BLUE),
]
y = 2.35
for t, v, d, c in reads:
    card(s, 9.6, y, 2.88, 1.0, fill=WHITE, bar=False, line_color=RGBColor(0xE2, 0xE8, 0xF0))
    rect(s, 9.6, y, 0.05, 1.0, fill=c, shape=MSO_SHAPE.RECTANGLE)
    tb(s, 9.85, y + 0.12, 2.0, 0.3, t, size=11, bold=True, color=INK)
    tb(s, 9.85, y + 0.4, 2.4, 0.5, d, size=9.5, color=MUTED, spacing=1.1)
    tb(s, 11.9, y + 0.1, 0.5, 0.3, v, size=13, bold=True, color=c, align=PP_ALIGN.RIGHT)
    y += 1.06
tb(s, 0.85, 6.3, 8.4, 0.5,
   "Bacaan: emosi terendah ada di tahap awal pembelian, bukan di akhir — perbaikan paling berdampak ada di sana.",
   size=11, color=MUTED, italic=True)
footer(s, 13)

# ---------------------------------------------------------------- 14 ACTION PLAN
s = add_slide(bg=OFFWHITE)
head(s, "Tindakan", "Dari peta ke lima rencana aksi berprioritas.",
     "Setiap pain point dipasangkan satu aksi, satu pemilik, dan satu indikator keberhasilan.")
acts = [
    ("1", "Belum paham manfaatnya", "Konten masalah–solusi di Instagram/TikTok 3× per minggu", "Pemasaran", "Kunjungan halaman harga +30%"),
    ("2", "Ragu memilih paket", "Contoh hasil per segmen + saran paket otomatis", "Produk", "Pertanyaan pemilihan −50%"),
    ("3", "Cemas bayar", "Hasil, garansi revisi, estimasi waktu di checkout", "Produk", "Penyelesaian checkout +20%"),
    ("4", "Menunggu review lama", "SLA review 2×24 jam + notifikasi progres", "Editor", "Rata-rata review < 2×24 jam"),
    ("5", "Belum ada repeat order", "Penawaran pemesanan ulang + program rujukan", "Pemasaran", "≥ 20% pelanggan repeat order"),
]
cols_h = ["No", "Pain point", "Rencana aksi", "Pemilik", "Indikator"]
widths = [0.7, 2.9, 4.4, 1.7, 2.4]
x0, y0 = 0.85, 2.5
xx = x0
for c, w in zip(cols_h, widths):
    tb(s, xx + 0.1, y0, w - 0.1, 0.3, c.upper(), size=10, bold=True, color=PURPLE, tracking=1.5)
    xx += w
hline(s, x0, y0 + 0.3, 12.1, color=RGBColor(0xE2, 0xE8, 0xF0))
yy = y0 + 0.45
for i, row in enumerate(acts):
    rect(s, x0 - 0.05, yy - 0.07, 12.2, 0.7, fill=WHITE if i % 2 == 0 else PURPLE_XL,
         shape=MSO_SHAPE.ROUNDED_RECTANGLE, adj=0.06)
    xx = x0
    for j, (val, w) in enumerate(zip(row, widths)):
        if j == 0:
            tb(s, xx + 0.15, yy + 0.1, w, 0.3, val, size=13, bold=True, color=PURPLE)
        elif j == 2:
            tb(s, xx + 0.1, yy + 0.06, w - 0.1, 0.5, val, size=10.5, color=INK, spacing=1.1)
        else:
            tb(s, xx + 0.1, yy + 0.08, w - 0.1, 0.5, val, size=10.5, color=MUTED, spacing=1.1)
        xx += w
    yy += 0.76
tb(s, 0.85, 6.4, 11.6, 0.4,
   "Urutan pengerjaan mengikuti dampak: perbaiki tahap consider lebih dulu, lalu checkout, baru kecepatan review.",
   size=11, color=MUTED, italic=True)
footer(s, 14)

# ---------------------------------------------------------------- 15 KESIMPULAN
s = add_slide(bg=NAVY)
head(s, "Kesimpulan", "AI mempercepat, manusia menjamin.",
     "Tiga simpulan yang menutup seluruh rangkaian analisis.", dark=True, title_size=34)
concl = [
    ("01", "Model human-in-the-loop terbukti dibayar",
     "43 dari 56 order memilih paket Pro yang mencakup review editor — pelanggan membayar untuk jaminan mutu, bukan sekadar kecepatan AI.", PURPLE),
    ("02", "Segmen awal jelas: kuliner mikro",
     "Seluruh order memakai template F&B dan dua persona kuliner menyumbang 41,1% draf — fokus sempit lebih baik daripada menyebar.", BLUE),
    ("03", "Peta perjalanan menunjuk dua perbaikan prioritas",
     "Lembah pertimbangan (−1) dan kecemasan pembelian (−0,5) adalah titik terendah; memperbaikinya berdampak langsung pada konversi.", GOLD),
]
x = 0.85
for no, t, d, c in concl:
    rect(s, x, 2.7, 3.66, 2.7, fill=CARD, adj=0.06, line_color=BORDER)
    rect(s, x, 2.7, 3.66, 0.05, fill=c, shape=MSO_SHAPE.RECTANGLE)
    tb(s, x + 0.3, 2.95, 1.0, 0.4, no, size=20, bold=True, color=c)
    tb(s, x + 0.3, 3.45, 3.1, 0.7, t, size=13.5, bold=True, color=WHITE, spacing=1.1)
    tb(s, x + 0.3, 4.3, 3.1, 1.0, d, size=10.5, color=DIM, spacing=1.2)
    x += 3.91
rect(s, 0.85, 5.65, 11.63, 0.9, fill=PURPLE, adj=0.1)
tb(s, 1.2, 5.85, 11.0, 0.5,
   "Saran lanjutan: validasi dengan survei 20 responden UMKM, perluas periode data simulasi, "
   "dan ukur retensi jangka panjang lewat tingkat pemesanan ulang.",
   size=11.5, color=WHITE, spacing=1.2)
hline(s, 0.85, 6.9, 11.63, color=BORDER)
tb(s, 0.85, 6.98, 9.0, 0.24, IDENT, size=9.5, color=DIM2)
tb(s, 9.9, 6.98, 2.6, 0.24, f"Terima kasih · 15 / {TOTAL}", size=9.5, bold=True,
   color=DIM2, align=PP_ALIGN.RIGHT)

# ---------------------------------------------------------------- 16 PENUTUP (editorial solid)
s = add_slide(bg=NAVY)
tb(s, 0.85, 1.7, 8.0, 0.3, "PENUTUP", size=11, bold=True, color=GOLD_L, tracking=3.0)
tb(s, 0.85, 2.1, 8.4, 1.6, "Terima kasih.\nSiap berdiskusi.", size=48, bold=True,
   color=WHITE, spacing=0.95)
tb(s, 0.85, 4.0, 7.6, 0.6,
   "CraftAI Studio · Platform AI-Assisted Template Customization (Human-in-the-Loop) untuk UMKM Digital",
   size=13, color=RGBColor(0xE2, 0xE8, 0xF0), spacing=1.25)
hline(s, 0.85, 4.9, 7.6, color=RGBColor(0x64, 0x74, 0x8B))
tb(s, 0.85, 5.05, 7.6, 0.25, "KELOMPOK 10 · PROGRAM STUDI S1 SISTEM INFORMASI", size=10,
   bold=True, color=GOLD_L, tracking=2.0)
closing = [
    ("Recasar Rochwidias", "26.12.3804", 0.85, 5.45),
    ("Muhammad Jefri S. U. A. F.", "26.12.3824", 4.4, 5.45),
    ("Akhdhiyat Atilla Ts.", "26.12.3807", 0.85, 5.85),
    ("Affan Firzi", "26.12.3794", 4.4, 5.85),
    ("RM. Hadi Tri Kuncoro W.", "26.12.3816", 0.85, 6.25),
]
for nm, nim, x, y in closing:
    tb(s, x, y, 3.4, 0.22, nm, size=11, bold=True, color=WHITE)
    tb(s, x, y + 0.2, 3.4, 0.2, nim, size=9.5, color=RGBColor(0xCB, 0xD5, 0xE1))
tb(s, 0.85, 6.6, 7.6, 0.3,
   "Dosen pengampu: Nur Widjiyati, M.Kom · Eli Pujastuti, M.Kom · Netci Hesvindrati, S.E., M.Kom · Dr. Wiji Nurastuti, S.E., M.T., CRP",
   size=9.5, color=RGBColor(0xCB, 0xD5, 0xE1))
rect(s, 9.0, 1.7, 3.48, 4.7, fill=CARD, adj=0.05, line_color=BORDER)
tb(s, 9.3, 1.95, 2.9, 0.3, "RANGKUMAN SEKILAS", size=10, bold=True, color=GOLD_L, tracking=1.5)
recap = [("56 order", "107 draf AI · 127 log"),
         ("Rp12,7 jt", "pendapatan simulasi satu hari"),
         ("4 segmen", "dua di antaranya kuliner mikro"),
         ("−1 → +3", "emosi dari consider ke loyal")]
yy = 2.4
for v, d in recap:
    tb(s, 9.3, yy, 2.9, 0.35, v, size=17, bold=True, color=WHITE)
    tb(s, 9.3, yy + 0.36, 2.9, 0.4, d, size=9.5, color=DIM2, spacing=1.1)
    yy += 0.95
pic(s, LOGO, 9.3, 6.6, w=2.4)
tb(s, 0.85, 6.98, 9.0, 0.24, IDENT, size=9.5, color=RGBColor(0xCB, 0xD5, 0xE1))
tb(s, 10.9, 6.98, 1.6, 0.24, f"16 / {TOTAL}", size=9.5, bold=True,
   color=RGBColor(0xCB, 0xD5, 0xE1), align=PP_ALIGN.RIGHT)

prs.save(OUT)
print("saved:", OUT, "slides:", len(prs.slides._sldIdLst))