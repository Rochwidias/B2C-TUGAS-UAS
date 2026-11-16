# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
# content part 1: sampul, kata pengantar, daftar isi, BAB I-III

# =========================================================== HALAMAN SAMPUL
sp = doc.add_paragraph()
sp.alignment = WD_ALIGN_PARAGRAPH.CENTER
sp.paragraph_format.space_before = Pt(10)
sp.add_run().add_picture(LOGO, width=Cm(9.0))

para("", space_after=14)
para("MAKALAH TECHNOPRENEUR", size=13, bold=True, color=TEAL_D,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para("CraftAI Studio", size=30, bold=True, color=DARK,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4, line=1.0)
para("Platform AI-Assisted Template Customization (Human-in-the-Loop)\nuntuk UMKM Digital",
     size=13, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10, line=1.2)

para("Disusun untuk memenuhi tugas UTS Semester Ganjil TA 2026/2027\n"
     "Mata Kuliah Technopreneur (SI134)", size=11,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14, line=1.2)

para("OLEH: KELOMPOK 10", size=11, bold=True, color=TEAL_D,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)

anggota = [
    ("Recasar Rochwidias", "26.12.3804"),
    ("Muhammad Jefri S. U. A. F.", "26.12.3824"),
    ("Akhdhiyat Atilla Ts.", "26.12.3807"),
    ("Affan Firzi", "26.12.3794"),
    ("RM. Hadi Tri Kuncoro W.", "26.12.3816"),
]
mt = doc.add_table(rows=len(anggota), cols=2)
mt.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (nama, nim) in enumerate(anggota):
    for j, val in enumerate((nama, nim)):
        cell = mt.cell(i, j)
        cell.text = ""
        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.LEFT if j == 0 else WD_ALIGN_PARAGRAPH.RIGHT
        cp.paragraph_format.space_after = Pt(0)
        cp.paragraph_format.line_spacing = 1.1
        rr = cp.add_run(val)
        rr.font.size = Pt(11)
        rr.font.name = "Calibri"
    mt.cell(i, 0).width = Cm(8.2)
    mt.cell(i, 1).width = Cm(3.4)

para("", space_after=10)
para("DOSEN PENGAMPU", size=10.5, bold=True, color=TEAL_D,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
for dsn in ["Nur Widjiyati, M.Kom", "Eli Pujastuti, M.Kom",
            "Netci Hesvindrati, S.E., M.Kom", "Dr. Wiji Nurastuti, S.E., M.T., CRP"]:
    para(dsn, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0, line=1.15)

para("", space_after=8)
para("PROGRAM STUDI S1 SISTEM INFORMASI\nFAKULTAS ILMU KOMPUTER\n"
     "UNIVERSITAS AMIKOM YOGYAKARTA\n2026", size=11, bold=True,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0, line=1.3)

# ---- section 2: front matter (roman numbering) ---------------------------------
front = doc.add_section(WD_SECTION.NEW_PAGE)
front.page_width = Cm(21.0)
front.page_height = Cm(29.7)
front.left_margin = front.right_margin = Cm(2.5)
front.top_margin = front.bottom_margin = Cm(2.5)
front.header.is_linked_to_previous = True
new_footer(front, "Makalah Technopreneur · CraftAI Studio · Kelompok 10", fmt="lowerRoman", start=1)

# =========================================================== KATA PENGANTAR
heading("KATA PENGANTAR", 1)
body(
    "Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa karena atas berkah dan "
    "rahmat-Nya, makalah berjudul “CraftAI Studio: Platform AI-Assisted Template "
    "Customization (Human-in-the-Loop) untuk UMKM Digital” dapat diselesaikan tepat "
    "waktu untuk memenuhi tugas UTS Semester Ganjil Tahun Akademik 2026/2027 pada mata "
    "kuliah Technopreneur (SI134) di Program Studi S1 Sistem Informasi, Fakultas Ilmu "
    "Komputer, Universitas AMIKOM Yogyakarta.")
body(
    "Makalah ini lahir dari satu pengamatan sederhana namun cukup mengganggu: UMKM "
    "Indonesia sudah pintar berjualan di media sosial, tetapi tidak semua pelaku usaha "
    "mampu membuat materi promosi digital yang meyakinkan. Survei INDEF (2024) "
    "mencatat 56,30% UMKM berjualan melalui platform media sosial dan 47,64% melalui "
    "e-commerce, sementara jumlah UMKM non-pertanian tercatat 30,21 juta unit per 31 "
    "Desember 2025. Pasar yang sedemikian besar membuat kebutuhan akan alat bantu desain "
    "digital berbasis AI menjadi nyata, bukan sekadar tren.")
body(
    "CraftAI Studio kami rancang sebagai platform B2C yang memanfaatkan AI generatif "
    "untuk menghasilkan draf halaman jualan berbasis template, lalu tetap meletakkan "
    "manusia sebagai validator pada setiap keluaran. Pendekatan human-in-the-loop ini "
    "menjadi jawaban kami atas keterbatasan AI yang masih sering menghasilkan teks "
    "promosi generik dan tidak sesuai karakter usaha mikro. Seluruh angka yang muncul "
    "dalam makalah ini—56 order, 107 draf AI, 127 log aktivitas, distribusi paket "
    "Basic dan Pro, serta persona dominan “Nasi Goreng Pak Kumis” dan “Warung Bu "
    "Tini”—diperoleh dari simulasi platform CraftAI Studio yang kami jalankan pada "
    "14 November 2026 selama satu hari uji.")
body(
    "Dalam penyusunan makalah ini kami banyak menerima bantuan dan masukan, terutama "
    "dari dosen pengampu mata kuliah Technopreneur, yaitu Ibu Nur Widjiyati, M.Kom; Ibu "
    "Eli Pujastuti, M.Kom; Ibu Netci Hesvindrati, S.E., M.Kom; dan Ibu Dr. Wiji "
    "Nurastuti, S.E., M.T., CRP. Untuk itu kami mengucapkan terima kasih yang "
    "sebesar-besarnya. Kami juga berterima kasih kepada seluruh pihak yang telah "
    "membantu, baik berupa data, referensi, maupun diskusi yang memperkaya isi makalah "
    "ini.")
body(
    "Kami menyadari bahwa makalah ini masih jauh dari sempurna, baik dari segi isi "
    "maupun penyusunannya. Oleh karena itu, kami mengharapkan kritik dan saran yang "
    "membangun dari pembaca agar kami dapat memperbaikinya pada kesempatan berikutnya. "
    "Semoga makalah ini dapat memberikan manfaat bagi pembaca, khususnya dalam memahami "
    "pemanfaatan AI generatif secara bertanggung jawab untuk kemajuan UMKM digital di "
    "Indonesia.")
para("Yogyakarta, 15 November 2026", size=11, align=WD_ALIGN_PARAGRAPH.RIGHT,
     space_after=2, space_before=8)
para("Kelompok 10", size=11, bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=0)

doc.add_page_break()

# =========================================================== DAFTAR ISI
heading("DAFTAR ISI", 1)
toc_entries = [
    ("KATA PENGANTAR", "i"),
    ("BAB I PENDAHULUAN", "1"),
    ("1.1 Latar Belakang", "1"),
    ("1.2 Rumusan Masalah", "2"),
    ("1.3 Tujuan Penulisan", "2"),
    ("1.4 Manfaat Penulisan", "3"),
    ("1.5 Batasan Masalah", "3"),
    ("1.6 Sistematika Penulisan", "3"),
    ("BAB II LANDASAN TEORI", "5"),
    ("2.1 Technopreneurship", "5"),
    ("2.2 Bisnis Digital dan Model B2C", "5"),
    ("2.3 AI Generatif dan Structured Output", "6"),
    ("2.4 Human-in-the-Loop", "6"),
    ("2.5 Market Segmentation", "6"),
    ("2.6 Customer Journey Mapping", "7"),
    ("2.7 Model Bisnis Kanvas", "8"),
    ("BAB III METODOLOGI PENELITIAN", "9"),
    ("3.1 Jenis dan Pendekatan Penelitian", "9"),
    ("3.2 Objek Penelitian dan Simulasi Platform", "9"),
    ("3.3 Sumber Data dan Teknik Pengumpulan Data", "10"),
    ("3.4 Teknik Analisis Data", "10"),
    ("BAB IV HASIL DAN PEMBAHASAN", "12"),
    ("4.1 Profil dan Identitas CraftAI Studio", "12"),
    ("4.2 Hasil Simulasi Platform CraftAI Studio", "12"),
    ("4.3 Segmentasi Pasar CraftAI Studio", "13"),
    ("4.4 Customer Journey Map CraftAI Studio", "14"),
    ("4.5 Interpretasi Kurva Emosi dan Aksi Prioritas", "15"),
    ("4.6 Model Bisnis Kanvas CraftAI Studio", "16"),
    ("BAB V KESIMPULAN DAN SARAN", "17"),
    ("5.1 Kesimpulan", "17"),
    ("5.2 Saran", "17"),
    ("DAFTAR PUSTAKA", "19"),
]
for label, page in toc_entries:
    list_entry(label, page)

doc.add_page_break()

# =========================================================== DAFTAR GAMBAR & TABEL
heading("DAFTAR GAMBAR", 1)
fig_list = [
    ("Gambar 1. Kanal jualan UMKM dan skala pasar digital Indonesia", "1"),
    ("Gambar 2. Ringkasan data simulasi platform CraftAI Studio", "13"),
    ("Gambar 3. Estimasi porsi kebutuhan pasar keempat segmen CraftAI Studio", "14"),
    ("Gambar 4. Alur lima tahap perjalanan pelanggan CraftAI Studio", "14"),
    ("Gambar 5. Kurva emosi pelanggan lima tahap perjalanan", "15"),
    ("Gambar 6. Business Model Canvas CraftAI Studio", "16"),
]
for label, page in fig_list:
    list_entry(label, page)

heading("DAFTAR TABEL", 1)
tab_list = [
    ("Tabel 1. Rumusan masalah, tujuan, dan metode pemenuhan", "2"),
    ("Tabel 2. Empat dimensi segmentasi pasar yang dipakai pada makalah ini", "7"),
    ("Tabel 3. Sintesis data hasil simulasi platform CraftAI Studio (14 November 2026)", "9"),
    ("Tabel 4. Estimasi biaya pelaksanaan riset (20 responden wawancara)", "11"),
    ("Tabel 5. Identitas CraftAI Studio", "12"),
    ("Tabel 6. Empat segmen sasaran CraftAI Studio", "13"),
    ("Tabel 7. Empat sudut pandang segmentasi pasar pada CraftAI Studio", "14"),
    ("Tabel 8. Customer journey map CraftAI Studio: touchpoint, pain point, emosi, peluang", "14"),
    ("Tabel 9. Rencana aksi dari hasil peta perjalanan pelanggan", "15"),
]
for label, page in tab_list:
    list_entry(label, page)

# ---- section 3: isi utama (arabic numbering mulai 1) ---------------------------
body_sec = doc.add_section(WD_SECTION.NEW_PAGE)
body_sec.page_width = Cm(21.0)
body_sec.page_height = Cm(29.7)
body_sec.left_margin = body_sec.right_margin = Cm(2.5)
body_sec.top_margin = body_sec.bottom_margin = Cm(2.5)
body_sec.header.is_linked_to_previous = True
new_footer(body_sec, "Makalah Technopreneur · CraftAI Studio · Kelompok 10", fmt="decimal", start=1)

# =========================================================== BAB I
heading("BAB I PENDAHULUAN", 1)

heading("1.1 Latar Belakang", 2)
body(
    "Transformasi digital di Indonesia berjalan sangat cepat dan ditopang oleh jumlah "
    "pengguna internet yang besar. Asosiasi Penyelenggara Jasa Internet Indonesia (APJII) "
    "mencatat pengguna internet Indonesia mencapai 229,43 juta jiwa pada 2025 dengan "
    "tingkat penetrasi 80,66%, naik dari 221,56 juta pada 2024. Artinya, lebih dari "
    "delapan dari sepuluh penduduk Indonesia kini terhubung ke internet, dan aktivitas "
    "itu tidak lagi terbatas pada komunikasi: mayoritas menggunakannya untuk media sosial, "
    "berbelanja, dan mencari informasi produk.")
body(
    "Di sisi lain, basis pelaku usahanya juga sangat luas. Kementerian UMKM mencatat "
    "30,21 juta unit UMKM non-pertanian per 31 Desember 2025, dengan sektor perdagangan "
    "besar dan eceran (14,44 juta unit) serta penyediaan akomodasi, makan dan minum atau "
    "kuliner (6,41 juta unit) sebagai pendorong utama. Angka ini menunjukkan bahwa pasar "
    "potensial produk digital berbasis teknologi bukan sekadar korporasi, melainkan jutaan "
    "usaha mikro dan kecil yang selama ini menjadi tulang punggung ekonomi nasional.")
figure("fig1_latar_belakang.png", 15.5,
       "Kanal jualan UMKM Indonesia (INDEF, 2024) dan skala pasar digital Indonesia (APJII, 2025; KemenUMKM)")
body(
    "Karakter UMKM tersebut sejalan dengan temuan INDEF (2024) dalam kajian “Peran "
    "Platform Digital Terhadap Pengembangan UMKM di Indonesia”: sebanyak 56,30% responden "
    "UMKM memilih platform media sosial sebagai tempat berjualan online, disusul "
    "aplikasi e-commerce sebesar 47,64%, dan online food delivery 14,96%. UMKM memang "
    "sudah hadir di kanal digital, tetapi kehadiran itu sering berhenti pada unggahan "
    "seadanya: foto produk dari ponsel, keterangan harga di caption, dan promosi yang "
    "berulang tanpa identitas visual yang konsisten. Di sinilah kesenjangan kemampuan "
    "desain digital muncul—pelaku usaha punya produk dan pelanggan, namun tidak punya "
    "waktu, biaya, maupun keahlian untuk membuat materi promosi yang meyakinkan.")
body(
    "Kesenjangan tersebut berpeluang dijawab oleh kecerdasan buatan generatif. Model "
    "bahasa besar dan model gambar kini mampu menghasilkan teks promosi, struktur halaman, "
    "dan visual berdasarkan instruktur input yang sederhana. Namun demikian, pengalaman "
    "menunjukkan bahwa keluaran AI tanpa pengawasan manusia cenderung generik, sulit "
    "menangkap karakter usaha mikro, dan berisiko menghasilkan klaim promosi yang tidak "
    "akurat. Pendekatan human-in-the-loop—manusia tetap berada di dalam lingkaran proses "
    "sebagai peninjau dan pengambil keputusan akhir—menjadi prinsip yang tepat untuk "
    "produk yang menyasar UMKM.")
body(
    "Berdasarkan latar tersebut, kelompok kami merancang CraftAI Studio: platform "
    "B2C berbasis web yang membantu UMKM membuat halaman jualan dari template terkurasi "
    "dengan bantuan AI generatif, yang setiap hasilnya divalidasi manusia sebelum "
    "diterbitkan. Untuk memastikan rancangan bisnis dan pengalaman pelanggannya "
    "berdasarkan data, kami menjalankan simulasi platform dan menganalisis hasilnya "
    "menggunakan segmentasi pasar serta customer journey mapping. Hasil simulasi pada "
    "hari uji 14 November 2026 menghasilkan 56 order, 107 draf AI, dan 127 catatan log "
    "aktivitas, seluruhnya berada pada template “Artisan Cafe & Resto” kategori F&B "
    "dengan harga Rp150.000 sampai Rp250.000 per order—sebuah temuan yang justru memperkuat fokus segmen "
    "kuliner mikro pada tahap awal.")

heading("1.2 Rumusan Masalah", 2)
body("Berdasarkan latar belakang di atas, rumusan masalah dalam makalah ini adalah:")
for i, rm in enumerate([
    "Bagaimana pemanfaatan AI generatif dengan pendekatan human-in-the-loop dapat "
    "menjawab keterbatasan UMKM dalam menghasilkan materi promosi digital?",
    "Siapa saja segmen sasaran CraftAI Studio berdasarkan dimensi demografis, "
    "geografis, psikografis, dan perilaku yang didukung data simulasi platform?",
    "Bagaimana perjalanan pelanggan CraftAI Studio dari tahap aware hingga loyal "
    "ditinjau dari touchpoint, pain point, emosi, dan peluang perbaikan?",
    "Bagaimana model bisnis CraftAI Studio dirancang agar layak secara komersial "
    "sebagai produk B2C untuk UMKM?",
], 1):
    para(f"({chr(96+i)}) {rm}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

heading("1.3 Tujuan Penulisan", 2)
body("Adapun tujuan penulisan makalah ini adalah:")
for i, t in enumerate([
    "Menjelaskan konsep technopreneurship, bisnis digital B2C, AI generatif dengan "
    "structured output, dan human-in-the-Loop sebagai landasan pengembangan CraftAI Studio.",
    "Menyusun segmentasi pasar CraftAI Studio ke dalam empat segmen sasaran berdasarkan "
    "data simulasi platform dan empat dimensi segmentasi.",
    "Menganalisis customer journey map CraftAI Studio pada lima tahap perjalanan pelanggan "
    "beserta touchpoint, pain point, emosi, dan peluang perbaikannya.",
    "Merancang model bisnis kanvas CraftAI Studio sekaligus menyusun rencana aksi "
    "berprioritas dari hasil analisis peta perjalanan pelanggan.",
], 1):
    para(f"({chr(96+i)}) {t}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

tcaption("Rumusan masalah, tujuan, dan metode pemenuhan")
table([
    ["Rumusan Masalah", "Tujuan Penulisan", "Metode Pemenuhan"],
    ["AI generatif + human-in-the-loop untuk UMKM", "Menjelaskan landasan konsep dan prinsip tanggung jawab atas keluaran AI",
     "Kajian pustaka (BAB II)"],
    ["Empat segmen sasaran CraftAI Studio", "Menyusun segmentasi pasar berbasis empat dimensi dan data simulasi",
     "Segmentasi pasar + data simulasi (BAB IV)"],
    ["Perjalanan pelanggan lima tahap", "Menganalisis touchpoint, pain point, emosi, dan peluang tiap tahap",
     "Customer journey mapping (BAB IV)"],
    ["Model bisnis yang layak", "Merancang model bisnis kanvas dan rencana aksi prioritas",
     "Business Model Canvas + perencanaan riset (BAB III–IV)"],
], widths=[5.4, 5.6, 5.0], align_center_cols=())

heading("1.4 Manfaat Penulisan", 2)
body("Manfaat yang diharapkan dari penulisan makalah ini adalah sebagai berikut.")
para("a. Manfaat Akademis", bold=True, space_after=2)
body(
    "Makalah ini menjadi salah satu bahan penerapan materi mata kuliah Technopreneur "
    "(SI134), khususnya konsep segmentasi pasar, customer journey mapping, dan model "
    "bisnis kanvas, sehingga mahasiswa tidak hanya memahami teori tetapi juga "
    "menerapkannya pada produk digital nyata.")
para("b. Manfaat Praktis", bold=True, space_after=2)
body(
    "Hasil analisis dapat menjadi rancangan awal (blueprint) bagi tim pengembang "
    "CraftAI Studio untuk memprioritaskan perbaikan pengalaman pelanggan, terutama pada "
    "tahap consider dan use yang memiliki emosi terendah. Bagi UMKM, platform ini "
    "menawarkan alternatif pembuatan materi promosi yang terjangkau dan tetap terkontrol "
    "kualitasnya.")
para("c. Manfaat Sosial", bold=True, space_after=2)
body(
    "Pemanfaatan AI yang tetap melibatkan manusia diharapkan mendorong adopsi teknologi "
    "yang sehat di kalangan pelaku usaha mikro, sekaligus menjaga agar promosi yang "
    "beredar tetap jujur dan sesuai dengan kondisi usaha masing-masing.")

heading("1.5 Batasan Masalah", 2)
body("Agar pembahasan tetap fokus, makalah ini dibatasi pada hal-hal berikut:")
for b in [
    "Produk yang dikaji adalah CraftAI Studio, platform AI-assisted template customization "
    "bermodel B2C untuk UMKM digital; aspek pengembangan teknis model AI (pelatihan model) "
    "tidak dibahas mendalam.",
    "Analisis segmentasi dan customer journey menggunakan data simulasi platform selama "
    "satu hari uji (14 November 2026) berisi 56 order, 107 draf AI, dan 127 log; data "
    "tersebut bersifat demonstratif, bukan hasil survei pasar berskala nasional.",
    "Yang dianalisis adalah empat segmen sasaran utama dan lima tahap perjalanan pelanggan "
    "(aware, consider, purchase, use, loyal); tahap advocacy yang lebih luas hanya "
    "diringkas pada tahap loyal.",
    "Pembahasan keuangan dibatasi pada struktur harga paket dan estimasi biaya riset, "
    "bukan proyeksi laba rugi jangka panjang.",
]:
    bullet(b)

heading("1.6 Sistematika Penulisan", 2)
body("Sistematika penulisan makalah ini disusun sebagai berikut.")
body(
    "BAB I Pendahuluan memuat latar belakang masalah, rumusan masalah, tujuan, manfaat, "
    "batasan, dan sistematika penulisan. BAB II Landasan Teori membahas konsep "
    "technopreneurship, bisnis digital dan model B2C, AI generatif beserta structured "
    "output, human-in-the-loop, market segmentation, customer journey mapping, dan model "
    "bisnis kanvas. BAB III Metodologi Penelitian menjelaskan jenis penelitian, objek "
    "berupa simulasi platform, sumber data, serta teknik analisis yang digunakan. "
    "BAB IV Hasil dan Pembahasan memaparkan profil CraftAI Studio, hasil simulasi, empat "
    "segmen pasar, serta customer journey map lima tahap lengkap dengan kurva emosi dan "
    "rencana aksi. BAB V Kesimpulan dan Saran menutup makalah dengan simpulan dan saran "
    "yang diturunkan dari analisis, dilanjutkan Daftar Pustaka.")