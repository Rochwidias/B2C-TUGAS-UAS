# -*- coding: utf-8 -*-
from pptx import Presentation

p = "D:/Project/B2C-TUGAS-UAS/tugas-uts/Presentasi-CraftAI-Studio-Kelompok-10-UTS-SI134.pptx"
prs = Presentation(p)
print("slide size:", prs.slide_width / 914400, "x", prs.slide_height / 914400)
print("slide count:", len(prs.slides))
total = 0
for i, s in enumerate(prs.slides, 1):
    n = len(s.shapes)
    total += n
    pics = sum(1 for sh in s.shapes if sh.shape_type == 13)
    txt = sum(1 for sh in s.shapes if sh.has_text_frame and sh.text_frame.text.strip())
    first = ""
    for sh in s.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip():
            first = sh.text_frame.text.strip().split("\n")[0][:48]
            break
    print(f"slide {i:2d}: shapes={n:3d} pics={pics} text={txt:3d} | {first}")
print("total shapes:", total)
print("min shapes per slide:", min(len(s.shapes) for s in prs.slides))