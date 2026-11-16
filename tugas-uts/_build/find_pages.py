# -*- coding: utf-8 -*-
"""Extract the page number of every heading/caption so the TOC can list real numbers."""
import pdfplumber, re, json

PDF = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/makalah_preview.pdf"
targets = [
    "KATA PENGANTAR", "BAB I PENDAHULUAN", "1.1 Latar Belakang", "1.2 Rumusan Masalah",
    "1.3 Tujuan Penulisan", "1.4 Manfaat Penulisan", "1.5 Batasan Masalah", "1.6 Sistematika Penulisan",
    "BAB II LANDASAN TEORI", "2.1 Technopreneurship", "2.2 Bisnis Digital dan Model B2C",
    "2.3 AI Generatif dan Structured Output", "2.4 Human-in-the-Loop", "2.5 Market Segmentation",
    "2.6 Customer Journey Mapping", "2.7 Model Bisnis Kanvas",
    "BAB III METODOLOGI PENELITIAN", "3.1 Jenis dan Pendekatan Penelitian",
    "3.2 Objek Penelitian dan Simulasi Platform", "3.3 Sumber Data dan Teknik Pengumpulan Data",
    "3.4 Teknik Analisis Data",
    "BAB IV HASIL DAN PEMBAHASAN", "4.1 Profil dan Identitas CraftAI Studio",
    "4.2 Hasil Simulasi Platform CraftAI Studio", "4.3 Segmentasi Pasar CraftAI Studio",
    "4.4 Customer Journey Map CraftAI Studio", "4.5 Interpretasi Kurva Emosi dan Aksi Prioritas",
    "BAB V KESIMPULAN DAN SARAN", "5.1 Kesimpulan", "5.2 Saran", "DAFTAR PUSTAKA",
]
figs = ["Gambar 1.", "Gambar 2.", "Gambar 3.", "Gambar 4.", "Gambar 5.", "Gambar 6."]
tabs = ["Tabel 1.", "Tabel 2.", "Tabel 3.", "Tabel 4.", "Tabel 5.", "Tabel 6.", "Tabel 7."]

with pdfplumber.open(PDF) as pdf:
    texts = [(p.extract_text() or "").replace("\n", " ") for p in pdf.pages]

def find_all(pref, start=5, stop_after=None):
    out = {}
    for i, t in enumerate(texts):
        if i + 1 < start:
            continue
        for p in pref:
            if p in t and p not in out:
                out[p] = i + 1
        if stop_after and len(out) == len(pref):
            break
    return out

res = {"KATA PENGANTAR": 2}
res.update({k: v for k, v in find_all(targets).items() if k != "KATA PENGANTAR"})
res.update(find_all(figs))
res.update(find_all(tabs))
res = {k: (v - 4 if v >= 5 else v) for k, v in res.items()}
missing = [t for t in targets + figs + tabs if t not in res]
print(json.dumps(res, indent=0, ensure_ascii=False))
print("MISSING:", missing)