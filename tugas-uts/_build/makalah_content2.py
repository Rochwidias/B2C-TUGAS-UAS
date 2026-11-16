# -*- coding: utf-8 -*-
# content part 2: BAB II Landasan Teori, BAB III Metodologi

doc.add_page_break()
heading("BAB II LANDASAN TEORI", 1)
body(
    "Bab ini menguraikan kerangka konsep yang dipakai untuk merancang dan menganalisis "
    "CraftAI Studio. Enam konsep utama—technopreneurship, bisnis digital B2C, AI "
    "generatif dengan structured output, human-in-the-loop, market segmentation, "
    "customer journey mapping, dan model bisnis kanvas—menjadi alat analisis yang "
    "dipakai pada BAB IV.")

heading("2.1 Technopreneurship", 2)
body(
    "Technopreneurship adalah gabungan entrepreuneurship dengan penguasaan teknologi: "
    "kegiatan membangun usaha dengan cara memanfaatkan atau menciptakan teknologi "
    "inovatif lalu mengubahnya menjadi produk atau jasa yang bernilai jual. Fowosire, "
    "Idris, dan Opoola (2017) menyebut technopreneurship sebagai proses sintesis yang "
    "memadukan pengembangan teknologi, inovasi, dan kewirausahaan, di mana perbedaan "
    "utamanya terletak pada cara pelaku usaha menghadirkan produk berteknologi tinggi "
    "atau memakai teknologi dengan cara yang inovatif untuk menjangkau konsumen.")
body(
    "Definisi yang lebih operasional dikemukakan oleh Bailetti (2012) dalam Technology "
    "Innovation Management Review: technology entrepreneurship adalah investasi pada "
    "sebuah proyek yang menghimpun individu terlatih dan aset heterogen yang terkait erat "
    "dengan kemajuan pengetahuan ilmiah dan teknologi untuk menciptakan dan menangkap "
    "nilai bagi perusahaan. Definisi ini penting bagi CraftAI Studio karena menegaskan "
    "bahwa technopreneurship bukan sekadar pemakaian alat teknologi, melainkan komitmen "
    "menyusun sumber daya—manusia, template, data, dan model AI—dalam satu proyek yang "
    "terukur nilainya.")
body(
    "Dalam konteks UMKM, technopreneurship berarti memindahkan pekerjaan yang dulu "
    "membutuhkan keahlian desain profesional ke dalam alur kerja yang dapat dijalankan "
    "pelaku usaha sendiri dengan bantuan teknologi. CraftAI Studio mewujudkan prinsip "
    "tersebut dengan menyediakan template terkurasi dan draf otomatis, sehingga pelaku "
    "usaha mikro dapat bersaing mempromosikan produknya tanpa menyewa jasa desain "
    "berbiaya tinggi.")

heading("2.2 Bisnis Digital dan Model B2C", 2)
body(
    "Bisnis digital adalah model usaha yang nilai utamanya dihasilkan melalui produk, "
    "jasa, atau proses yang berjalan di kanal digital. Pada model business-to-consumer "
    "(B2C), perusahaan menjual produk atau jasanya langsung kepada konsumen akhir tanpa "
    "perantara distributor besar. CraftAI Studio termasuk B2C karena pelanggannya adalah "
    "pelaku UMKM yang membeli satu order pembuatan halaman jualan untuk usahanya "
    "sendiri, bukan distributor yang menjual ulang.")
body(
    "Salah satu ciri B2C adalah siklus pembelian yang singkat: konsumen menilai penawaran "
    "dalam hitungan menit hingga hari, bukan bulan seperti pada B2B (Deckary, 2025). "
    "Karakter ini memengaruhi desain CraftAI Studio: harga dan contoh hasil harus "
    "langsung terlihat, proses checkout harus pendek, dan nilai produk harus terbukti "
    "segera setelah pembelian. Dari sisi operasional, keberhasilan B2C sangat bergantung "
    "pada pengulangan pembelian. Swivel (2025), platform loyalitas untuk merchant "
    "e-commerce Indonesia, menunjukkan bahwa banyak pelaku usaha kesulitan mengubah "
    "pembeli sekali menjadi pelanggan tetap karena data pembelinya tersebar di "
    "marketplace. CraftAI Studio menjawab persoalan tersebut dengan menempatkan ulang "
    "order (repeat order) sebagai bagian dari perjalanan pelanggan pada tahap loyal.")

heading("2.3 AI Generatif dan Structured Output", 2)
body(
    "AI generatif adalah kelompok model kecerdasan buatan yang belajar dari kumpulan "
    "data besar untuk menghasilkan konten baru berupa teks, gambar, audio, maupun kode. "
    "Dalam CraftAI Studio, AI generatif bertugas mengubah informasi singkat tentang "
    "sebuah usaha menjadi draf halaman jualan: judul, tagline, deskripsi produk, tombol "
    "ajakan bertindak, sampai pilihan warna tema.")
body(
    "Agar hasilnya dapat langsung dipakai aplikasi, keluaran model harus berupa structured "
    "output, yaitu data terstruktur dengan skema yang telah ditentukan lebih dahulu "
    "(schema JSON) sehingga tidak perlu diuraikan lagi secara manual. Contoh instruktur "
    "input yang dipakai pada simulasi berbunyi: "
    "“{\"brandName\":\"Warung Bu Tini\",\"tagline\":\"Soto Ayam Kampung Asli Boyolali\","
    "\"themeColor\":\"emerald\",\"toneOfVoice\":\"santai\",\"ctaText\":\"Pesan "
    "Sekarang\"}”. Dengan skema yang tetap, platform dapat memvalidasi setiap field "
    "sebelum menyimpannya sebagai draf, sehingga kesalahan format tidak merambat ke "
    "tampilan akhir.")
body(
    "Meski demikian, terstrukturnya data tidak menjamin mutu isi. Model dapat menghasilkan "
    "kalimat promosi yang terdengar meyakinkan namun tidak akurat, misalnya menjanjikan "
    "kualitas atau waktu pengantaran yang tidak diberikan pemilik usaha. Keraguan semacam "
    "ini yang membuat pengawasan manusia tetap diperlukan pada setiap keluaran.")

heading("2.4 Human-in-the-Loop", 2)
body(
    "Human-in-the-loop (HITL) adalah pendekatan di mana manusia tetap berada dalam "
    "siklus kerja sistem otomatis pada titik-titik tertentu untuk memeriksa, mengoreksi, "
    "dan menyetujui hasilnya. Dalam praktik pengembangan AI, HITL dipakai untuk "
    "meningkatkan keandalan model melalui umpan balik manusia, misalnya pada teknik "
    "reinforcement learning from human feedback (Sun, Bosch, De Wit, dan Krahmer, 2023), "
    "serta pada "
    "penyuntingan bertahap keluaran teks (Du dkk., 2022).")
body(
    "Prinsip yang sama diterapkan pada pemberitaan: Nishal dan Diakopoulos (2023) "
    "mencatat keluaran algoritmik pada media berita selalu diberi keterangan bahwa artikel "
    "dibantu mesin lalu ditinjau dan diperiksa fakta oleh staf editorial—pola yang "
    "persis diterapkan CraftAI Studio. Pada platform ini, setiap draf AI berstatus "
    "“review” sebelum menjadi “published”: editor manusia memeriksa kebenaran klaim, "
    "kesesuaian tone dengan karakter usaha, dan keterbacaan ajakan bertindak. Dari 127 "
    "catatan log pada simulasi, tercatat alur status order bergerak dari paid (33), "
    "review (7), in_progress (1), sampai completed (15)—bukti bahwa jalur validasi "
    "manusia benar-benar dilalui, bukan sekadar klaim pemasaran.")

heading("2.5 Market Segmentation", 2)
body(
    "Market segmentation adalah proses membagi pasar yang luas menjadi kelompok-kelompok "
    "heterogen yang memiliki kebutuhan, karakteristik, atau perilaku serupa sehingga dapat "
    "dilayani dengan strategi pemasaran yang berbeda-beda. Segmentasi pasar UMKM lazimnya "
    "menggunakan empat dimensi yang saling melengkapi.")
tcaption("Empat dimensi segmentasi pasar yang dipakai pada makalah ini")
table([
    ["Dimensi", "Pertanyaan Kunci", "Penerapan pada CraftAI Studio"],
    ["Demografis", "Siapa orangnya? Usia, jenis kelamin, pendidikan, pendapatan, jenis usaha",
     "Pemilik usaha usia 20–45 tahun, mayoritas usaha mikro dengan omzet di bawah Rp60 juta per tahun"],
    ["Geografis", "Di mana mereka berada? Kota, daerah, wilayah distribusi",
     "Yogyakarta dan kota sekitar (Solo, Magelang), lalu ekspansi ke Jawa Tengah dan Jabodetabek"],
    ["Psikografis", "Bagaimana cara berpikirnya? Gaya hidup, nilai, motivasi, sikap terhadap teknologi",
     "Ingin terlihat profesional namun hemat waktu; terbuka pada AI, tetapi tetap ingin kontrol atas isi"],
    ["Perilaku", "Bagaimana mereka bertindak? Frekuensi beli, kebiasaan kanal, loyalitas, respons harga",
     "Aktif jualan di Instagram dan WhatsApp; sensitif harga; cenderung repeat order setelah hasil memuaskan"],
], widths=[3.0, 5.4, 7.6])
body(
    "Segmentasi yang baik pada akhirnya harus terbukti dari perbedaan perilaku pembelian. "
    "Dalam simulasi CraftAI Studio, perbedaan itu tampak jelas: 43 dari 56 order memilih "
    "paket Pro (Rp250.000) dan 13 order memilih paket Basic (Rp150.000), dengan seluruh "
    "order menggunakan template kategori F&B “Artisan Cafe & Resto”. Pola ini menjadi "
    "dasar penentuan empat segmen sasaran pada BAB IV.")

heading("2.6 Customer Journey Mapping", 2)
body(
    "Customer journey mapping adalah representasi visual dari keseluruhan pengalaman "
    "pelanggan terhadap sebuah merek dari sudut pandang pelanggan sendiri—bukan dari "
    "sudut pandang proses internal perusahaan (Deckary, 2025). Berbeda dengan peta proses "
    "bisnis yang menjelaskan cara perusahaan bekerja, peta perjalanan pelanggan menjawab "
    "apa yang dilakukan, dipikirkan, dan dirasakan pelanggan pada setiap tahap.")
body(
    "Secara umum perjalanan pelanggan terbagi ke dalam lima tahap: awareness (menyadari "
    "kebutuhan dan mengenal merek), consideration (membandingkan solusi), decision atau "
    "purchase (memutuskan dan membeli), retention atau use (memakai produk), dan advocacy "
    "(merekomendasikan). Pada setiap tahap, peta perjalanan merekam lima lapisan: "
    "tindakan pelanggan, touchpoint, pikiran, emosi, dan peluang perbaikan. Touchpoint "
    "adalah setiap interaksi antara pelanggan dan merek; pain point adalah titik di mana "
    "pengalaman terasa menghambat; sedangkan emotion curve adalah grafik yang memplot "
    "perasaan pelanggan dari negatif ke positif di sepanjang tahapan tersebut.")
body(
    "Emotion curve penting karena menunjukkan mengapa pelanggan pergi, bukan hanya di "
    "mana mereka pergi. Deckary (2025) menyebut beberapa pola khas, antara lain lembah "
    "pertimbangan yang membuat calon pembeli merasa kewalahan membandingkan pilihan, "
    "kecemasan saat pembelian, kebingungan pada onboarding, serta jurang dukungan ketika "
    "masalah muncul tanpa respons. Pola-pola tersebut menjadi kerangka bacaan untuk "
    "menganalisis kurva emosi CraftAI Studio pada BAB IV.")

heading("2.7 Model Bisnis Kanvas", 2)
body(
    "Model Bisnis Kanvas (Business Model Canvas) adalah alat visual yang memetakan sebuah "
    "model bisnis ke dalam sembilan blok: customer segments, value propositions, channels, "
    "customer relationships, revenue streams, key resources, key activities, key "
    "partnerships, dan cost structure (Osterwalder dan Pigneur). Kanvas memudahkan tim "
    "melihat keterkaitan antarblok: nilai yang ditawarkan harus sesuai dengan segmen, "
    "kanal harus menjangkau segmen tersebut, dan pendapatan harus menutup biaya yang "
    "dikeluarkan untuk menghasilkan nilai.")
body(
    "CraftAI Studio memakai kanvas sebagai rancangan bisnisnya. Pada blok customer "
    "segments, empat segmen sasaran ditetapkan dari data simulasi; pada value "
    "propositions, keunggulannya adalah halaman jualan siap pakai dengan hasil yang "
    "divalidasi manusia; pada revenue streams, pendapatan berasal dari penjualan paket "
    "Basic Rp150.000 dan Pro Rp250.000 per order. Kanvas lengkap CraftAI Studio dipaparkan "
    "pada Gambar 6 di BAB IV.")

# =========================================================== BAB III
doc.add_page_break()
heading("BAB III METODOLOGI PENELITIAN", 1)

heading("3.1 Jenis dan Pendekatan Penelitian", 2)
body(
    "Penelitian ini menggunakan pendekatan deskriptif dengan metode studi kasus. "
    "Penelitian deskriptif bertujuan menggambarkan dan menjelaskan keadaan suatu objek "
    "apa adanya berdasarkan data yang terkumpul, tanpa memengaruhi atau mengubah variabel "
    "yang diteliti (Sugiyono, 2019). Dalam konteks ini, penelitian deskriptif dipakai "
    "untuk menggambarkan perilaku pelanggan CraftAI Studio pada simulasi platform, "
    "mulai dari pemilihan paket, pemakaian template, sampai alur status order.")
body(
    "Studi kasus dipilih karena analisis difokuskan pada satu produk bernama CraftAI "
    "Studio dalam konteks yang spesifik, yaitu pengembangan rancangan bisnis dan "
    "pengalaman pelanggan untuk UMKM digital. Studi kasus memungkinkan peneliti memahami "
    "fenomena secara mendalam dalam konteks nyata, termasuk hubungan sebab-akibat yang "
    "muncul selama penggunaan platform (Yin, 2018).")
body(
    "Selain dua metode di atas, penelitian ini menambahkan tahap simulasi platform: "
    "tim membangun dan menjalankan prototipe CraftAI Studio selama satu hari uji untuk "
    "menghasilkan data perilaku yang konkret. Simulasi berfungsi sebagai pengganti survei "
    "lapangan yang belum dapat dilaksanakan pada tahap UTS, sekaligus menyediakan bahan "
    "empiris untuk segmentasi pasar dan customer journey mapping.")

heading("3.2 Objek Penelitian dan Simulasi Platform", 2)
body(
    "Objek penelitian adalah platform CraftAI Studio dengan tiga komponen utama: katalog "
    "template halaman jualan, mesin draf AI berbasis structured output, dan alur validasi "
    "manusia. Pada simulasi dijalankan tiga template pilihan dengan harga berbeda: "
    "“Artisan Cafe & Resto” kategori F&B seharga Rp250.000, “Modern Creative Portfolio” "
    "kategori portfolio seharga Rp300.000, dan “Direct-to-Consumer Store” kategori shop "
    "seharga Rp350.000. Konsumen memilih paket layanan, bukan sekadar template: paket "
    "Basic seharga Rp150.000 dan paket Pro seharga Rp250.000, di mana paket Pro mencakup "
    "tambahan revisi dan pemeriksaan editor.")
body(
    "Simulasi dijalankan pada 14 November 2026 selama satu hari uji. Sepanjang periode "
    "tersebut, sistem mencatat seluruh aktivitas dalam tiga jenis data: order (pesanan "
    "pembuatan halaman jualan), draft (keluaran AI yang menunggu validasi), dan log "
    "(catatan aktivitas sistem). Data inilah yang menjadi sumber utama analisis pada BAB IV.")

tcaption("Sintesis data hasil simulasi platform CraftAI Studio (14 November 2026)")
table([
    ["Aspek Data", "Hasil Simulasi", "Keterangan"],
    ["Jumlah order", "56 order", "Seluruhnya pada template “Artisan Cafe & Resto” (F&B, Rp250.000)"],
    ["Jumlah draf AI", "107 draf", "Keluaran structured output yang menunggu validasi manusia"],
    ["Jumlah log aktivitas", "127 log", "Catatan sistem atas aksi pengguna dan proses"],
    ["Paket Pro", "43 order (Rp10.750.000)", "76,8% dari seluruh order; paket dengan revisi tambahan"],
    ["Paket Basic", "13 order (Rp1.950.000)", "23,2% dari seluruh order"],
    ["Status order", "paid 33 · review 7 · in_progress 1 · completed 15", "Alur pembayaran hingga penyelesaian"],
    ["Persona dominan", "Nasi Goreng Pak Kumis (28) · Warung Bu Tini (16)", "Persona F&B kecil, 44 dari 107 draf (41,1%)"],
    ["Rentang data", "14 November 2026", "Satu hari uji; sifat data demonstratif"],
], widths=[3.6, 5.6, 6.8])

heading("3.3 Sumber Data dan Teknik Pengumpulan Data", 2)
body("Sumber data dalam penelitian ini terbagi menjadi dua kelompok.")
para("a. Data Primer", bold=True, space_after=2)
body(
    "Data primer diperoleh langsung dari simulasi platform CraftAI Studio, berupa "
    "order, draf AI, dan log aktivitas yang dihasilkan selama hari uji. Data ini menjadi "
    "bukti perilaku konkret: paket mana yang dipilih, template mana yang dipakai, persona "
    "apa yang berulang, dan di mana status order berhenti.")
para("b. Data Sekunder", bold=True, space_after=2)
body(
    "Data sekunder berupa literatur akademik dan laporan lembaga yang dipakai untuk "
    "mengkontekskan temuan simulasi, antara lain survei APJII 2025 tentang pengguna "
    "internet Indonesia, data Kementerian UMKM tentang 30,21 juta unit UMKM "
    "non-pertanian, kajian INDEF 2024 tentang kanal jualan UMKM, serta sumber rujukan "
    "praktis seperti Deckary untuk kerangka customer journey map dan Swivel untuk praktik "
    "loyaltas merchant.")
body(
    "Teknik pengumpulan data yang digunakan meliputi observasi terhadap alur penggunaan "
    "platform, penelusuran basis data (database tracing) untuk menghitung jumlah order, "
    "draf, dan log, serta dokumentasi berupa tangkapan layar dan ekstraksi data untuk "
    "memastikan angka yang dilaporkan dapat diverifikasi ulang.")

heading("3.4 Teknik Analisis Data", 2)
body("Analisis data dilaksanakan dalam empat tahap berikut.")
para("a. Reduksi Data", bold=True, space_after=2)
body(
    "Seluruh catatan order, draf, dan log diringkas ke dalam indikator yang dapat "
    "dibaca: jumlah per paket, distribusi status, penggunaan template, dan frekuensi "
    "persona. Data yang tidak relevan dengan segmentasi dan perjalanan pelanggan "
    "disingkirkan agar analisis tetap terfokus.")
para("b. Penyajian Data", bold=True, space_after=2)
body(
    "Data yang telah diringkas disajikan dalam bentuk tabel ringkasan dan grafik, "
    "sehingga pola perbandingan—misalnya keunggulan paket Pro atas paket Basic—dapat "
    "terlihat langsung.")
para("c. Penarikan Kesimpulan dan Verifikasi", bold=True, space_after=2)
body(
    "Kesimpulan ditarik dari pola yang muncul, misalnya dominasi template kategori F&B "
    "menjadi dasar penetapan segmen kuliner mikro sebagai segmen prioritas. Kesimpulan "
    "kemudian diverifikasi dengan membandingkannya terhadap data sekunder seperti jumlah "
    "sektor kuliner dalam data UMKM nasional.")
para("d. Analisis Customer Journey", bold=True, space_after=2)
body(
    "Perjalanan pelanggan dianalisis pada lima tahap dengan merekam touchpoint, pain "
    "point, emosi, dan peluang pada setiap tahap. Emosi diberi skala ordinal dari −3 "
    "(sangat kecewa) sampai +4 (sangat puas) untuk membentuk emotion curve, kemudian "
    "setiap pain point dipasangkan dengan rencana aksi pada BAB IV.")
tcaption("Estimasi biaya pelaksanaan riset (20 responden wawancara)")
table([
    ["No", "Komponen Biaya", "Perkiraan Biaya"],
    ["1", "Incentif responden (20 orang × Rp25.000)", "Rp500.000"],
    ["2", "Penggunaan template survei digital dan alat bantu", "Rp150.000"],
    ["3", "Operasional transportasi dan konsumsi tim", "Rp400.000"],
    ["4", "Percetakan materi dan dokumentasi", "Rp150.000"],
    ["", "Total estimasi", "Rp1.200.000"],
], widths=[1.4, 9.6, 5.0], align_center_cols=(0, 2))