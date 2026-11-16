# -*- coding: utf-8 -*-
"""Deck v2 slides 1-8 — Canva Blue & Purple Gradient style."""

# ---------------------------------------------------------------- 1 COVER (editorial solid)
s = add_slide(bg=NAVY)
tb(s, 0.85, 1.15, 10.0, 0.3, "UTS · SI134 · KELOMPOK 10 · SEMESTER GANJIL 2026/2027",
   size=11, bold=True, color=GOLD_L, tracking=3.0)
tb(s, 0.85, 1.6, 8.5, 2.6, "CraftAI\nStudio.", size=58, bold=True, color=WHITE, spacing=0.92)
tb(s, 0.85, 3.95, 7.6, 1.0,
   "Platform AI-Assisted Template Customization (Human-in-the-Loop) untuk UMKM Digital\n"
   "Studi kasus: segmentasi pasar & customer journey map",
   size=13.5, color=RGBColor(0xE2, 0xE8, 0xF0), spacing=1.3)

# members row
members = [
    ("Recasar Rochwidias", "26.12.3804", 0.85),
    ("Muhammad Jefri S. U. A. F.", "26.12.3824", 3.05),
    ("Akhdhiyat Atilla Ts.", "26.12.3807", 5.4),
    ("Affan Firzi", "26.12.3794", 7.35),
    ("RM. Hadi Tri Kuncoro W.", "26.12.3816", 9.15),
]
for nm, nim, x in members:
    tb(s, x, 5.5, 2.2, 0.22, nm, size=9.5, bold=True, color=WHITE)
    tb(s, x, 5.71, 2.2, 0.2, nim, size=9, color=RGBColor(0xCB, 0xD5, 0xE1))
hline(s, 0.85, 5.3, 11.6, color=RGBColor(0x64, 0x74, 0x8B), width=0.75)
pic(s, LOGO, 0.85, 6.25, w=2.6)
# date chip top-right
chip(s, 10.9, 0.55, 1.6, 0.4, "UTS 2026", fill=GOLD, color=INK, size=11)
tb(s, 10.9, 6.98, 1.6, 0.24, f"01 / {TOTAL}", size=9.5, bold=True,
   color=RGBColor(0xCB, 0xD5, 0xE1), align=PP_ALIGN.RIGHT)

# ---------------------------------------------------------------- 2 AGENDA
s = add_slide(bg=OFFWHITE)
head(s, "Peta presentasi", "Enam bagian, satu alur cerita.",
     "Urutan mengikuti alur kerja kelompok: dari masalah, data, peta, sampai tindakan.")
rows = [
    ("01", "Masalah & Solusi", "Kenapa UMKM butuh CraftAI Studio", "3"),
    ("02", "Model Bisnis", "B2C dengan human-in-the-loop", "5"),
    ("03", "Data & Segmentasi", "Hasil simulasi, 4 segmen sasaran", "6"),
    ("04", "Rencana Riset", "Siapa, kapan, di mana, biaya", "9"),
    ("05", "Customer Journey Map", "5 tahap: touchpoint sampai peluang", "11"),
    ("06", "Tindakan & Kesimpulan", "Dari peta ke rencana aksi", "13"),
]
y = 2.4
for i, (no, t, d, pg) in enumerate(rows):
    fill = WHITE if i % 2 == 0 else PURPLE_XL
    card(s, 0.85, y, 11.63, 0.66, fill=fill, bar=False, line_color=RGBColor(0xE2, 0xE8, 0xF0))
    num_badge(s, 1.1, y + 0.14, no, size=0.38, fill=PURPLE if i % 2 == 0 else BLUE,
              fontsize=10)
    tb(s, 1.7, y + 0.13, 3.1, 0.3, t, size=14, bold=True, color=INK)
    tb(s, 1.7, y + 0.4, 4.6, 0.24, d, size=10.5, color=MUTED)
    tb(s, 11.2, y + 0.17, 1.0, 0.3, f"→ {pg}", size=12.5, bold=True, color=PURPLE,
       align=PP_ALIGN.RIGHT)
    y += 0.75
footer(s, 2)

# ---------------------------------------------------------------- 3 LATAR BELAKANG
s = add_slide(bg=WHITE)
head(s, "Masalah", "UMKM sudah online, materinya belum meyakinkan.",
     "30,21 juta UMKM non-pertanian, 229,43 juta pengguna internet, tapi promosi masih seadanya.")
pic(s, f"{FIG}/fig1_latar_belakang.png", 0.85, 2.4, w=8.6)
chips = [
    ("56,30%", "UMKM jualan via media sosial (INDEF 2024)", PURPLE),
    ("47,64%", "berjualan lewat e-commerce", BLUE),
    ("6,41 jt", "unit usaha kuliner (KemenUMKM 2025)", GOLD),
]
y = 2.4
for v, lbl, c in chips:
    card(s, 9.7, y, 2.78, 1.05, fill=WHITE, bar=False, line_color=RGBColor(0xE2, 0xE8, 0xF0))
    rect(s, 9.7, y, 0.05, 1.05, fill=c, shape=MSO_SHAPE.RECTANGLE)
    tb(s, 9.98, y + 0.1, 2.3, 0.4, v, size=22, bold=True, color=c)
    tb(s, 9.98, y + 0.52, 2.3, 0.5, lbl, size=9.5, color=MUTED, spacing=1.1)
    y += 1.15
rect(s, 9.7, 5.85, 2.78, 0.7, fill=NAVY, adj=0.12)
tb(s, 9.98, 5.97, 2.3, 0.5,
   "Hambatan: tak ada waktu, biaya, dan keahlian desain untuk materi promosi rutin.",
   size=9.5, color=WHITE, spacing=1.15)
tb(s, 0.85, 6.3, 8.6, 0.5,
   "Gap: hadir di kanal digital, tetapi foto, caption, dan identitas visual belum konsisten sehingga jualan sulit naik kelas.",
   size=11, color=MUTED, italic=True)
footer(s, 3)

# ---------------------------------------------------------------- 4 SOLUSI
s = add_slide(bg=OFFWHITE)
head(s, "Solusi", "Draft oleh AI, keputusan oleh manusia.",
     "CraftAI Studio mengubah brief singkat jadi halaman jualan siap terbit — dengan editor yang menvalidasi.")
cols = [
    ("Masalah", [
        "Materi promosi dibuat dadakan dan tidak konsisten",
        "Jasa desain mahal dan tidak selalu tersedia",
        "AI mentah sering menghasilkan teks generik",
    ]),
    ("Solusi CraftAI Studio", [
        "Template terkurasi sesuai kategori usaha",
        "Structured output langsung jadi halaman jualan",
        "Editor manusia memeriksa klaim & tone sebelum terbit",
    ]),
    ("Bukti dari simulasi", [
        "107 draf AI dihasilkan dalam satu hari uji",
        "7 order berada di tahap review validasi manusia",
        "43 dari 56 order memilih paket dengan revisi",
    ]),
]
x = 0.85
for idx, (title, items) in enumerate(cols):
    accent = [PURPLE, BLUE, GOLD][idx]
    card(s, x, 2.5, 3.66, 3.0, fill=WHITE, bar_color=accent)
    tb(s, x + 0.3, 2.75, 3.1, 0.3, title.upper(), size=11, bold=True, color=accent)
    yy = 3.2
    for it in items:
        tb(s, x + 0.3, yy, 0.2, 0.25, "•", size=13, bold=True, color=accent)
        tb(s, x + 0.5, yy, 2.9, 0.7, it, size=11, color=MUTED, spacing=1.15)
        yy += 0.75
    x += 3.91
rect(s, 0.85, 5.75, 11.63, 0.9, fill=NAVY, adj=0.1)
steps = ["Brief singkat", "AI structured output", "Review manusia", "Halaman jualan terbit"]
sx = 1.25
for i, st in enumerate(steps):
    tb(s, sx, 5.9, 0.5, 0.3, f"0{i+1}", size=10, bold=True, color=PURPLE_L)
    tb(s, sx, 6.15, 2.4, 0.3, st, size=13, bold=True, color=WHITE)
    if i < 3:
        tb(s, sx + 2.35, 6.1, 0.4, 0.3, "→", size=14, bold=True, color=PURPLE)
    sx += 2.85
footer(s, 4)

# ---------------------------------------------------------------- 5 MODEL BISNIS
s = add_slide(bg=WHITE)
head(s, "Model bisnis", "B2C per order, dengan human-in-the-loop.",
     "Pelanggan membayar per order; nilai tambahnya bukan sekadar AI, melainkan hasil yang sudah ditinjau manusia.")
flow = [
    ("BRIEF", "brandName, tagline,\nwarna, tone, CTA"),
    ("AI DRAFT", "structured output\nJSON tervalidasi"),
    ("REVIEW", "editor periksa klaim,\ntone, & keterbacaan"),
    ("TERBIT", "halaman jualan final\n+ file siap unggah"),
]
x = 0.85
for i, (t, d) in enumerate(flow):
    card(s, x, 2.4, 2.6, 1.5, fill=PURPLE_XL if i == 2 else WHITE, bar=True,
         bar_color=BLUE if i == 2 else PURPLE)
    tb(s, x + 0.25, 2.6, 2.1, 0.3, t, size=12, bold=True,
       color=PURPLE if i != 2 else BLUE)
    tb(s, x + 0.25, 2.95, 2.15, 0.8, d, size=10.5, color=MUTED, spacing=1.15)
    if i < 3:
        tb(s, x + 2.6, 3.0, 0.35, 0.3, "→", size=16, bold=True, color=PURPLE,
           align=PP_ALIGN.CENTER)
    x += 2.95
tb(s, 0.85, 4.2, 5.0, 0.3, "PAKET & PENDAPATAN SIMULASI", size=11, bold=True, color=PURPLE)
pk = [
    ("Paket Basic", "Rp150.000", "13 order · Rp1.950.000", "Draft AI + 1× revisi", WHITE),
    ("Paket Pro", "Rp250.000", "43 order · Rp10.750.000", "Revisi + review editor", PURPLE_XL),
]
y = 4.55
for nm, price, rev, isi, fill in pk:
    card(s, 0.85, y, 5.6, 1.0, fill=fill, bar=False, line_color=RGBColor(0xE2, 0xE8, 0xF0))
    rect(s, 0.85, y, 0.05, 1.0, fill=PURPLE if fill == PURPLE_XL else LINE,
         shape=MSO_SHAPE.RECTANGLE)
    tb(s, 1.1, y + 0.15, 2.0, 0.3, nm, size=13, bold=True, color=INK)
    tb(s, 1.1, y + 0.5, 2.4, 0.3, isi, size=10, color=MUTED)
    tb(s, 3.6, y + 0.13, 1.7, 0.3, price, size=15, bold=True, color=PURPLE,
       align=PP_ALIGN.RIGHT)
    tb(s, 3.4, y + 0.5, 2.9, 0.3, rev, size=10.5, color=MUTED, align=PP_ALIGN.RIGHT)
    y += 1.1
tb(s, 0.85, 6.75, 5.6, 0.3, "Total simulasi satu hari uji: 56 order · Rp12.700.000",
   size=11, bold=True, color=INK)
card(s, 6.9, 4.2, 5.58, 2.4, fill=WHITE, line_color=RGBColor(0xE2, 0xE8, 0xF0))
tb(s, 7.2, 4.4, 5.0, 0.3, "KANAL & RELASI PELANGGAN", size=11, bold=True, color=PURPLE)
kv = [
    ("Kanal", "Situs CraftAI Studio, Instagram & TikTok, WhatsApp"),
    ("Relasi", "Self-service + review manusia, dukungan WhatsApp"),
    ("Pendapatan", "Order paket, lisensi template lanjutan, add-on revisi"),
    ("Biaya", "API model AI, honor editor, produksi template, promosi"),
]
yy = 4.75
for k, v in kv:
    tb(s, 7.2, yy, 1.5, 0.28, k, size=10.5, bold=True, color=PURPLE)
    tb(s, 8.7, yy, 3.6, 0.4, v, size=10.5, color=MUTED, spacing=1.1)
    yy += 0.45
footer(s, 5)