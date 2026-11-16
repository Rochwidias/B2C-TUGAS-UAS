# -*- coding: utf-8 -*-
# content part 3: BAB IV, BAB V, daftar pustaka

doc.add_page_break()
heading("BAB IV HASIL DAN PEMBAHASAN", 1)

heading("4.1 Profil dan Identitas CraftAI Studio", 2)
body(
    "CraftAI Studio adalah platform AI-assisted template customization untuk UMKM "
    "digital. Pelanggan memilih template halaman jualan yang telah dirancang tim, "
    "mengisi brief singkat berupa nama merek, tagline, warna tema, gaya bahasa, dan ajakan "
    "bertindak, lalu sistem menghasilkan draf halaman secara otomatis menggunakan model "
    "AI generatif dengan structured output. Draf tersebut tidak langsung diterbitkan, "
    "melainkan masuk ke tahap review untuk diperiksa editor manusia sebelum menjadi "
    "halaman jualan final.")
tcaption("Identitas CraftAI Studio")
table([
    ["Unsur", "Keterangan"],
    ["Nama produk", "CraftAI Studio"],
    ["Subjudul", "Platform AI-Assisted Template Customization (Human-in-the-Loop) untuk UMKM Digital"],
    ["Model bisnis", "B2C, transaksi per order berbasis template"],
    ["Paket harga", "Basic Rp150.000 · Pro Rp250.000 per order"],
    ["Template", "Artisan Cafe & Resto (F&B, Rp250.000) · Modern Creative Portfolio (portfolio, Rp300.000) · Direct-to-Consumer Store (shop, Rp350.000)"],
    ["Prinsip kerja", "AI menghasilkan draf, manusia menvalidasi dan menyetujui sebelum terbit"],
    ["Segmen prioritas", "Kafe dan resto kecil serta warung dan kuliner mikro"],
], widths=[3.4, 12.6])

heading("4.2 Hasil Simulasi Platform CraftAI Studio", 2)
body(
    "Simulasi satu hari uji pada 14 November 2026 menghasilkan 56 order, 107 draf AI, dan "
    "127 log aktivitas. Tiga temuan berikut menjadi dasar analisis segmentasi dan "
    "perjalanan pelanggan.")
para("Tembuan 1 — Paket Pro dipilih mayoritas.", bold=True, space_after=2)
body(
    "Sebanyak 43 dari 56 order (76,8%) memilih paket Pro seharga Rp250.000 dengan total "
    "Rp10.750.000, sedangkan 13 order (23,2%) memilih paket Basic seharga Rp150.000 "
    "dengan total Rp1.950.000. Total pendapatan simulasi adalah Rp12.700.000 dalam satu "
    "hari uji. Pola ini menunjukkan pelanggan lebih bersedia membayar lebih ketika "
    "terdapat jaminan revisi dan pemeriksaan manusia—persis nilai yang dijual oleh "
    "pendekatan human-in-the-loop.")
para("Tembuan 2 — Satu template kategori F&B menyerap seluruh order.", bold=True, space_after=2)
body(
    "Seluruh 56 order memakai template “Artisan Cafe & Resto” berkategori F&B seharga "
    "Rp250.000, sementara template “Modern Creative Portfolio” (portfolio, Rp300.000) dan "
    "“Direct-to-Consumer Store” (shop, Rp350.000) belum terpakai pada hari uji. Ketika "
    "dihitung bersama paket yang dipilih, seluruh order menggunakan template F&B kelas "
    "dasar. Konsentrasi ini mempermudah fokus pengembangan, sekaligus menjadi peringatan "
    "bahwa tahap awal terlalu bergantung pada satu kategori.")
para("Tembuan 3 — Persona yang berulang berasal dari usaha kuliner kecil.", bold=True, space_after=2)
body(
    "Dari 107 draf AI, persona “Nasi Goreng Pak Kumis” muncul 28 kali dan “Warung Bu "
    "Tini” 16 kali, sehingga 44 draf (41,1%) memakai dua persona kuliner mikro tersebut. "
    "Persona lainnya tersebar pada 63 draf. Contoh instruktur input yang dipakai, "
    "misalnya brand “Warung Bu Tini” dengan tagline “Soto Ayam Kampung Asli Boyolali”, "
    "warna tema emerald, gaya bahasa santai, dan ajakan “Pesan Sekarang”, menunjukkan "
    "profil pelanggan yang konsisten: pemilik usaha kuliner yang ingin terlihat rapi tanpa "
    "kehilangan kesan khas warung.")
figure("fig2_data_aplikasi.png", 16.0,
       "Ringkasan data simulasi: distribusi paket, status order, dan persona dominan")

heading("4.3 Segmentasi Pasar CraftAI Studio", 2)
body(
    "Berdasarkan data simulasi dan empat dimensi segmentasi pada BAB II, ditetapkan empat "
    "segmen sasaran CraftAI Studio. Prioritas segmen ditentukan dari kontribusi pendapatan "
    "simulasi, prevalensi persona, serta potensi pasar sektor terkait pada data UMKM "
    "nasional, di mana sektor kuliner tercatat 6,41 juta unit usaha.")
tcaption("Empat segmen sasaran CraftAI Studio")
table([
    ["Segmen", "Profil Singkat", "Kebutuhan Utama", "Bukti dari Data", "Prioritas"],
    ["S1 · Kafe & resto kecil", "Pemilik usaha 25–40 tahun, 1–10 karyawan, omzet menengah",
     "Halaman menu digital dan promosi mingguan", "Template F&B menyerap 100% order; paket Pro 76,8%", "1"],
    ["S2 · Warung & kuliner mikro", "Pemilik usaha mikro, 1–3 karyawan, omzet di bawah Rp60 juta/tahun",
     "Materi promosi murah dan cepat", "Persona Nasi Goreng Pak Kumis (28) dan Warung Bu Tini (16)", "2"],
    ["S3 · Kreator & pemilik portofolio", "Freelancer, desainer pemula, lulusan baru 20–30 tahun",
     "Halaman portofolio profesional", "Template “Modern Creative Portfolio” Rp300.000, belum terpakai", "3"],
    ["S4 · Toko online D2C", "Pemilik toko di marketplace yang ingin punya kanal sendiri",
     "Halaman produk siap konversi", "Template “Direct-to-Consumer Store” Rp350.000, belum terpakai", "4"],
], widths=[3.6, 3.6, 3.0, 4.2, 1.6], font_size=8.5, align_center_cols=(4,))
figure("fig3_segmentasi.png", 15.0, "Estimasi porsi kebutuhan pasar keempat segmen sasaran CraftAI Studio")
tcaption("Empat sudut pandang segmentasi pasar pada CraftAI Studio")
table([
    ["Dimensi", "Fokus Pertanyaan", "Temuan untuk CraftAI Studio"],
    ["Demografis", "Siapa pelanggannya?", "Pelaku UMKM usia 20–45 tahun; mayoritas pemilik usaha mikro dengan karyawan di bawah sepuluh orang"],
    ["Geografis", "Di mana mereka berada?", "Yogyakarta dan kota sekitar sebagai basis uji; penetrasi internet Jawa 84,69% (APJII, 2025) mendukung ekspansi ke Jawa Tengah dan Jabodetabek"],
    ["Psikografis", "Apa motivasinya?", "Ingin terlihat profesional dan konsisten, hemat waktu, tetapi tetap menginginkan kontrol atas isi promosi sehingga cocok dengan pendekatan human-in-the-loop"],
    ["Perilaku", "Bagaimana kebiasaannya?", "Aktif jualan di media sosial dan WhatsApp, sensitif harga, cenderung memilih paket dengan jaminan revisi, lalu melakukan repeat order setelah hasil memuaskan"],
], widths=[2.4, 3.4, 10.2], font_size=9)

heading("4.4 Customer Journey Map CraftAI Studio", 2)
body(
    "Perjalanan pelanggan CraftAI Studio dianalisis pada lima tahap: aware, consider, "
    "purchase, use, dan loyal. Kerangka lima tahap serta pemetaan touchpoint, pain point, "
    "dan emotion curve mengikuti pedoman customer journey mapping yang dipakai Deckary "
    "(2025), disesuaikan dengan kondisi produk dan data simulasi CraftAI Studio.")
figure("fig5_journey_flow.png", 16.0, "Alur lima tahap perjalanan pelanggan CraftAI Studio")
tcaption("Customer journey map CraftAI Studio: touchpoint, pain point, emosi, dan peluang")
table([
    ["Tahap", "Touchpoint", "Pain Point", "Emosi", "Peluang"],
    ["1 · Aware", "Instagram dan TikTok CraftAI Studio, unggahan komunitas UMKM, rekomendasi sesama pelaku usaha, hasil pencarian",
     "Calon pelanggan belum tahu bahwa halaman jualan bisa dibuat otomatis; konten awal terlalu berfokus pada teknologi AI, bukan masalah promosi",
     "Penasaran (+1)",
     "Ganti pesan utama menjadi masalah sehari-hari UMKM: foto produk tidak menarik dan caption berulang"],
    ["2 · Consider", "Halaman harga, galeri contoh hasil, testimoni, formulir singkat trial, chat WhatsApp",
     "Tiga template dan dua paket membuat calon pelanggan ragu memilih; belum ada bukti bahwa hasil AI sesuai karakter usaha",
     "Bingung (−1)",
     "Tampilkan contoh sebelum–sesudah per segmen, beri rekomendasi paket otomatis, dan sisipkan penjelasan bahwa hasil ditinjau manusia"],
    ["3 · Purchase", "Halaman checkout, pilihan paket Basic atau Pro, konfirmasi pembayaran, email penerimaan order",
     "Kecemasan membayar tanpa hasil jelas; detail biaya revisi kurang transparan di awal",
     "Cemas (−0,5)",
     "Sertakan ringkasan hasil yang didapat per paket, garansi revisi, dan estimasi waktu pengerjaan sebelum tombol bayar"],
    ["4 · Use", "Formulir brief, editor draf AI, layar review editor, notifikasi WhatsApp saat draf siap",
     "Menunggu validasi manusia terasa lambat; pelaku usaha awam bingung mengisi brief",
     "Antusias lalu menunggu (+2)",
     "Percepat SLA review, sediakan contoh brief terisi, kirim pemberitauan progres otomatis"],
    ["5 · Loyal", "Halaman hasil final, permintaan testimoni, penawaran repeat order, program rujukan",
     "Belum ada pengingat pemesanan ulang dan program loyalitas terstruktur",
     "Puas (+3)",
     "Kirim penawaran pembaruan menu atau materi promosi musiman, buat program rujukan antarUMKM"],
], widths=[2.0, 3.8, 4.4, 2.4, 3.4], font_size=8.5)

heading("4.5 Interpretasi Kurva Emosi dan Aksi Prioritas", 2)
body(
    "Emosi tiap tahap dipetakan pada skala dari −3 sampai +4 sehingga membentuk emotion "
    "curve berikut: aware +1, consider −1, purchase −0,5, use +2, dan loyal +3. Kurva ini "
    "menunjukkan dua titik terendah yang khas, yaitu lembah pertimbangan dan kecemasan "
    "pembelian, persis pola yang dikenali pada literatur customer journey mapping "
    "(Deckary, 2025). Sebaliknya, emosi naik tajam pada tahap use karena pelanggan mulai "
    "melihat draf nyata, dan mencapai puncak pada tahap loyal ketika hasil akhir "
    "diterima.")
figure("fig4_emotion_curve.png", 15.5,
       "Kurva emosi pelanggan CraftAI Studio pada lima tahap perjalanan")
body(
    "Pembacaan kurva ini menghasilkan tiga prioritas perbaikan. Pertama, merapikan tahap "
    "consider melalui contoh hasil per segmen dan rekomendasi paket otomatis karena "
    "merupakan titik emosi terendah. Kedua, menutup kecemasan pembelian dengan informasi "
    "hasil, garansi revisi, dan estimasi waktu yang tampil sebelum pembayaran. Ketiga, "
    "mempercepat dan memperjelas tahap use melalui SLA review serta pemberitauan progres, "
    "karena justru tahap ini yang paling menentukan apakah pelanggan kembali memesan.")
tcaption("Rencana aksi dari hasil peta perjalanan pelanggan")
table([
    ["No", "Pain Point", "Rencana Aksi", "Pemilik Aksi", "Indikator Keberhasilan"],
    ["1", "Calon pelanggan belum paham manfaatnya", "Buat konten masalah–solusi di Instagram dan TikTok tiga kali per minggu", "Tim pemasaran", "Kenaikan kunjungan halaman harga 30% dalam sebulan"],
    ["2", "Ragu memilih paket dan template", "Tambahkan contoh hasil per segmen dan pemberi saran paket otomatis", "Tim produk", "Penurunan pertanyaan pemilihan paket lewat WhatsApp 50%"],
    ["3", "Kecemasan membayar tanpa hasil jelas", "Tampilkan ringkasan hasil, garansi revisi, dan estimasi waktu di halaman checkout", "Tim produk", "Peningkatan penyelesaian checkout dari kondisi awal 20%"],
    ["4", "Menunggu validasi manusia terasa lama", "Tetapkan SLA review 2×24 jam dan kirim pemberitauan progres otomatis", "Tim editor", "Rata-rata waktu review turun di bawah 2×24 jam"],
    ["5", "Belum ada pengingat pemesanan ulang", "Aktifkan penawaran repeat order dan program rujukan antarUMKM", "Tim pemasaran", "Minimal 20% pelanggan melakukan repeat order"],
], widths=[1.0, 3.6, 5.4, 2.4, 3.6], font_size=8.5, align_center_cols=(0,))

heading("4.6 Model Bisnis Kanvas CraftAI Studio", 2)
body(
    "Keseluruhan temuan di atas dirangkum ke dalam sembilan blok Business Model Canvas. "
    "Pada blok customer segments, empat segmen sasaran ditetapkan dari data simulasi; "
    "pada value propositions, CraftAI Studio menawarkan halaman jualan siap pakai dalam "
    "hitungan menit dengan hasil yang divalidasi manusia; pada channels, platform "
    "dijangkau lewat situs resmi, Instagram dan TikTok, serta WhatsApp. Blok revenue "
    "streams mencatat penjualan paket Basic Rp150.000 dan Pro Rp250.000 per order, "
    "sementara cost structure didominasi biaya layanan model AI, honor editor, produksi "
    "template, dan promosi digital.")
figure("fig6_bmc.png", 16.0, "Business Model Canvas CraftAI Studio")

# =========================================================== BAB V
doc.add_page_break()
heading("BAB V KESIMPULAN DAN SARAN", 1)

heading("5.1 Kesimpulan", 2)
body(
    "Berdasarkan pembahasan pada BAB I sampai BAB IV, dapat ditarik kesimpulan sebagai "
    "berikut.")
for i, k in enumerate([
    "CraftAI Studio merupakan wujud technopreneurship pada skala UMKM: ia memindahkan "
    "pekerjaan desain yang selama ini membutuhkan jasa profesional ke dalam alur kerja "
    "digital yang tetap dikawal manusia. Pendekatan human-in-the-loop menjawab keterbatasan "
    "AI generatif yang rentan menghasilkan konten generik dan klaim yang tidak akurat, "
    "sekaligus menjadi nilai jual utama paket Pro.",
    "Segmentasi pasar ditetapkan ke dalam empat segmen sasaran, yaitu kafe dan resto "
    "kecil, warung dan kuliner mikro, kreator dan pemilik portofolio, serta toko online "
    "D2C. Dua segmen pertama didukung bukti data simulasi: template kategori F&B menyerap "
    "seluruh 56 order, paket Pro mencatat 76,8% transaksi, dan dua persona kuliner mikro "
    "menyumbang 41,1% dari 107 draf AI.",
    "Customer journey map CraftAI Studio pada lima tahap menunjukkan titik kritis di "
    "tahap consider (emosi −1) dan purchase (−0,5), yang berangkat dari keraguan memilih "
    "paket serta kecemasan membayar tanpa hasil yang jelas. Emosi naik ke +2 pada tahap "
    "use dan mencapai puncak +3 pada tahap loyal ketika hasil akhir diterima pelanggan.",
    "Model bisnis kanvas CraftAI Studio menempatkan pendapatan pada penjualan paket "
    "Basic Rp150.000 dan Pro Rp250.000 per order, dengan biaya utama berupa layanan model "
    "AI, honor editor, produksi template, dan promosi digital. Simulasi menghasilkan "
    "Rp12.700.000 dari 56 order dalam satu hari uji, sehingga arah model dinilai layak "
    "untuk diuji lebih lanjut.",
    "Rencana aksi telah disusun dari hasil peta perjalanan pelanggan ke dalam lima butir "
    "terukur, mulai dari konten masalah–solusi, contoh hasil per segmen, transparansi "
    "checkout, SLA review, sampai program repeat order.",
], 1):
    para(f"({chr(96+i)}) {k}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=5)

heading("5.2 Saran", 2)
para("a. Saran bagi Tim Pengembang CraftAI Studio", bold=True, space_after=2)
for s in [
    "Perbaiki tahap pertimbangan terlebih dahulu karena menjadi titik emosi terendah: "
    "sediakan contoh hasil per segmen dan rekomendasi paket otomatis berdasarkan jenis usaha.",
    "Percepat proses validasi manusia dengan standar waktu penyelesaian 2×24 jam dan "
    "pemberitauan progres otomatis agar antusiasme pelanggan pada tahap use tidak tergerus.",
    "Kembangkan template untuk segmen portfolio dan toko online yang belum terpakai pada "
    "simulasi, sehingga ketergantungan pada satu kategori F&B dapat dikurangi.",
]:
    bullet(s)
para("b. Saran bagi Pelaku UMKM", bold=True, space_after=2)
for s in [
    "Gunakan AI sebagai penghasil draf awal, bukan sebagai penentu akhir; periksa kembali "
    "klaim promosi agar sesuai dengan kondisi usaha yang sebenarnya.",
    "Manfaatkan paket dengan jaminan revisi bila materi promosi diperbarui rutin, "
    "misalnya menu musiman atau promo mingguan.",
]:
    bullet(s)
para("c. Saran bagi Peneliti Selanjutnya", bold=True, space_after=2)
for s in [
    "Uji temuan ini dengan survei terhadap minimal 20 responden pelaku UMKM untuk "
    "memvalidasi empat segmen dan kurva emosi yang kini berasal dari simulasi satu hari uji.",
    "Perluas periode pengumpulan data simulasi sehingga distribusi template dan paket dapat "
    "dibandingkan antarminggu, bukan hanya pada satu hari uji.",
    "Tambahkan metrik retensi jangka panjang, seperti tingkat pemesanan ulang dan rujukan "
    "antarUMKM, untuk mengukur tahap loyal secara kuantitatif.",
]:
    bullet(s)

# =========================================================== DAFTAR PUSTAKA
doc.add_page_break()
heading("DAFTAR PUSTAKA", 1)
refs = [
    "APJII. (2025). Profil Internet Indonesia 2025. Asosiasi Penyelenggara Jasa Internet "
    "Indonesia. Diakses dari https://apjii.org",
    "Bailetti, T. (2012). Technology entrepreneurship: Overview, definition, and distinctive "
    "aspects. Technology Innovation Management Review, 2(2), 5–15. Diakses dari "
    "https://timreview.ca/article/520",
    "Deckary. (2025). Customer journey mapping: A consultant’s guide to CX transformation. "
    "Diakses dari https://deckary.com/blog/customer-journey-mapping",
    "Deckary. (2025). Customer journey map template: Five journey stages from awareness to "
    "advocacy. Diakses dari https://deckary.com/template/customer-journey-map",
    "Du, W., Kim, Z. M., Raheja, V., Kumar, D., & Kang, D. (2022). Read, revise, repeat: A "
    "system demonstration for human-in-the-loop iterative text revision. In Proceedings of "
    "the First Workshop on Intelligent and Interactive Writing Assistants (In2Writing 2022) "
    "(pp. 96–108). Association for Computational Linguistics.",
    "Fowosire, R. A., Idris, O. Y., & Opoola, E. (2017). Technopreneurship: A view of "
    "technology, innovations and entrepreneurship. Global Journal of Researches in "
    "Engineering: Electrical and Electronics Engineering, 17(7), 42–49.",
    "INDEF. (2024). Peran platform digital terhadap pengembangan UMKM di Indonesia. The "
    "Institute for Development of Economics and Finance. Diakses dari "
    "https://indef.or.id/wp-content/uploads/2024/01/Laporan-Final-Peran-Platform-Digital-"
    "Terhadap-Pengembangan-UMKM-di-Indonesia-INDEF.pdf",
    "Kementerian Usaha Mikro, Kecil, dan Menengah. (2025). Data UMKM non-pertanian per 31 "
    "Desember 2025. Diakses dari https://kadin.id/data-dan-statistik/umkm-indonesia",
    "Nishal, S., & Diakopoulos, N. (2023). Envisioning the applications and implications of "
    "generative AI for news media. In CHI ’23 Workshop on Generative AI and HCI, April "
    "23–28, 2023, Hamburg, Germany. ACM.",
    "Osterwalder, A., & Pigneur, Y. (2010). Business model generation: A handbook for "
    "visionaries, game changers, and challengers. John Wiley & Sons.",
    "Sun, X., Bosch, J. A., De Wit, J., & Krahmer, E. (2023). Human-in-the-loop interaction "
    "for continuously improving generative model in conversational agent for behavioral "
    "intervention. In Proceedings of the 28th International Conference on Intelligent User "
    "Interfaces (IUI ’23) (pp. 99–101). ACM.",
    "Sugiyono. (2019). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.",
    "Swivel. (2025). Loyalty platform untuk merchant e-commerce Indonesia. Diakses dari "
    "https://swivel.id/",
    "Yin, R. K. (2018). Case study research and applications: Design and methods (6th ed.). "
    "SAGE Publications.",
]
for r in refs:
    p = para("", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, line=1.15)
    p.paragraph_format.left_indent = Cm(0.8)
    p.paragraph_format.first_line_indent = Cm(-0.8)
    run = p.add_run(r)
    run.font.size = Pt(10.5)
    run.font.name = "Calibri"

doc.save(OUT)
print("saved:", OUT)