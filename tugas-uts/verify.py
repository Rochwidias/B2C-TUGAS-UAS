"""Verifikasi mandiri hasil makalah + PPT UTS Technopreneur Kelompok 10.

Jalankan dengan venv documents (bukan python sistem):
  D:/hermes/environments/documents/gen-42988a4987bc4c058c9030adb74a997b/venv/Scripts/python.exe verify.py
"""
# pyright: reportMissingImports=false
import sys, os, json
from pptx import Presentation
from pptx.util import Emu
import docx

OUT = "D:/Project/B2C-TUGAS-UAS/tugas-uts"
pptx_path = os.path.join(OUT, sys.argv[1] if len(sys.argv) > 1 else "UTS-Technopreneur-Kelompok10-CraftAI-Studio.pptx")
docx_path = os.path.join(OUT, sys.argv[2] if len(sys.argv) > 2 else "Makalah-Technopreneur-CraftAI-Studio.docx")

print("=" * 70)
missing = [p for p in (pptx_path, docx_path) if not os.path.exists(p)]
for p in (pptx_path, docx_path):
    print(("OK  " if os.path.exists(p) else "MISS"), p,
          os.path.getsize(p) if os.path.exists(p) else "-")
if missing:
    sys.exit("Belum ada hasil (menunggu subagent menulis): " + ", ".join(missing))

print("\n--- PPTX ---")
prs = Presentation(pptx_path)
W, H = Emu(prs.slide_width).inches, Emu(prs.slide_height).inches
print(f"slides={len(prs.slides)} size={W:.3f}x{H:.3f}in")
assert len(prs.slides) >= 14, "slide < 14"
assert abs(W - 13.333) < 0.02 and abs(H - 7.5) < 0.02, "bukan 16:9"

texts_all = []
for i, s in enumerate(prs.slides, 1):
    shapes = list(s.shapes)
    ntxt = sum(1 for sh in shapes if sh.has_text_frame and sh.text_frame.text.strip())
    # out-of-bounds / overlap sanity
    oob = []
    for sh in shapes:
        try:
            l, t = Emu(sh.left).inches, Emu(sh.top).inches
            r, b = l + Emu(sh.width).inches, t + Emu(sh.height).inches
        except TypeError:
            continue
        if l < -0.05 or t < -0.05 or r > W + 0.05 or b > H + 0.05:
            oob.append(f"{sh.name}({l:.2f},{t:.2f},{r:.2f},{b:.2f})")
    head = ""
    for sh in shapes:
        if sh.has_text_frame and sh.text_frame.text.strip():
            head = sh.text_frame.text.strip().split("\n")[0][:70]
            break
    for sh in shapes:
        if sh.has_text_frame:
            texts_all.append(sh.text_frame.text)
    flag = "  OUT-OF-BOUNDS: " + ", ".join(oob) if oob else ""
    print(f"  s{i:02d} shapes={len(shapes):3d} text={ntxt:3d} | {head}{flag}")

joined = "\n".join(texts_all)
for must in ["Kelompok", "CraftAI", "Customer Journey", "Segmentasi", "AMIKOM", "Technopren"]:
    print(f"  contains {must!r}: {must.lower() in joined.lower()}")

print("\n--- DOCX ---")
d = docx.Document(docx_path)
paras = [p for p in d.paragraphs if p.text.strip()]
h1 = [p.text for p in d.paragraphs if p.style.name == "Heading 1"]
h2 = [p.text for p in d.paragraphs if p.style.name == "Heading 2"]
words = sum(len(p.text.split()) for p in paras)
sec = d.sections[0]
print(f"non-empty paras={len(paras)} words={words} tables={len(d.tables)} "
      f"h1={len(h1)} h2={len(h2)} images={len(d.inline_shapes)}")
print(f"page {Emu(sec.page_width).cm:.1f}x{Emu(sec.page_height).cm:.1f}cm margins L{Emu(sec.left_margin).cm:.1f} "
      f"R{Emu(sec.right_margin).cm:.1f} T{Emu(sec.top_margin).cm:.1f} B{Emu(sec.bottom_margin).cm:.1f}")
print("H1:", h1)
assert len(paras) >= 120, "paragraf < 120"
assert len(d.tables) >= 4, "tabel < 4"
assert len(h1) >= 8, "Heading1 < 8"
assert words >= 2500, "kata < 2500"
for must in ["KATA PENGANTAR", "DAFTAR ISI", "BAB I", "BAB V", "DAFTAR PUSTAKA"]:
    print(f"  contains {must!r}: {must in joined or any(must in p.text for p in paras) or any(must in t for t in h1)}")
print("\nALL CHECKS PASSED")