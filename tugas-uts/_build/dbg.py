
import pdfplumber
pdf = pdfplumber.open("D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/makalah_preview.pdf")
for i, p in enumerate(pdf.pages):
    t = (p.extract_text() or "").replace("\n", " ")
    for key in ["Gambar 6", "Business Model Canvas CraftAI", "4.6 Model Bisnis", "Halaman"]:
        if key in t:
            print(i+1, key, "|", t[:110])
            break
