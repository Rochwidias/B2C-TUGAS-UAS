# -*- coding: utf-8 -*-
"""Build deck v2 — Canva Blue & Purple Gradient style (slides 1-16)."""
import io

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build"
ns = {"__name__": "__deck__"}
for part in ["deck_core_v2.py", "deck_slides_a_v2.py", "deck_slides_b_v2.py"]:
    src = io.open(f"{BASE}/{part}", encoding="utf-8").read()
    exec(compile(src, f"{BASE}/{part}", "exec"), ns)
    print("done:", part)