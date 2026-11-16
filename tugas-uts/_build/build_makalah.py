# -*- coding: utf-8 -*-
"""Assemble the makalah: run core + content parts in one shared namespace."""
import io, runpy, sys

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build"
ns = {"__name__": "__makalah__"}
for part in ["makalah_core.py", "makalah_content1.py", "makalah_content2.py", "makalah_content3.py"]:
    src = io.open(f"{BASE}/{part}", encoding="utf-8").read()
    code = compile(src, f"{BASE}/{part}", "exec")
    exec(code, ns)
    print("done:", part)