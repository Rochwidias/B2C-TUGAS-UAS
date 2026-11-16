# -*- coding: utf-8 -*-
import sys
PDF = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/makalah_preview.pdf"
OUT = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/pages"
import os
os.makedirs(OUT, exist_ok=True)

try:
    import fitz
    doc = fitz.open(PDF)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=90)
        pix.save(f"{OUT}/p{i+1:02d}.png")
    print("pymupdf pages:", doc.page_count)
    sys.exit(0)
except Exception as e:
    print("fitz failed:", e)

try:
    import pdfplumber
    with pdfplumber.open(PDF) as pdf:
        for i, page in enumerate(pdf.pages):
            im = page.to_image(resolution=90)
            im.save(f"{OUT}/p{i+1:02d}.png")
        print("plumber pages:", len(pdf.pages))
except Exception as e:
    print("plumber failed:", e)