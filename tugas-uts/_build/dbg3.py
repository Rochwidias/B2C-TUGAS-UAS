
import pdfplumber
pdf = pdfplumber.open("D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/makalah_preview.pdf")
for i in [0,1,2,4,9,16,22]:
    t = pdf.pages[i].extract_text() or ""
    tail = [l for l in t.split("\n") if "Halaman" in l]
    print(i+1, "->", tail[-1] if tail else "NO FOOTER")
