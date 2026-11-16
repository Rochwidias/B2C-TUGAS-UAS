# -*- coding: utf-8 -*-
"""Assemble the deck."""
import io

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build"
ns = {"__name__": "__deck__"}
for part in ["deck_core.py", "deck_slides_a.py", "deck_slides_b.py"]:
    src = io.open(f"{BASE}/{part}", encoding="utf-8").read()
    exec(compile(src, f"{BASE}/{part}", "exec"), ns)
    print("done:", part)