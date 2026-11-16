
import pdfplumber, re
pdf = pdfplumber.open("D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/makalah_preview.pdf")
for i, p in enumerate(pdf.pages):
    t = (p.extract_text() or "").replace("\n", " ")
    for m in re.finditer(r"(Gambar \d+\.[^|]{0,60}|Tabel \d+\.[^|]{0,60})", t):
        print(i+1, m.group(0)[:70])
