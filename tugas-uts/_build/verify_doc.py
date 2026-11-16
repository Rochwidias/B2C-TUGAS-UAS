# -*- coding: utf-8 -*-
from docx import Document

p = "D:/Project/B2C-TUGAS-UAS/tugas-uts/Makalah-CraftAI-Studio-Kelompok-10-UTS-SI134.docx"
d = Document(p)
non_empty = [x for x in d.paragraphs if x.text.strip()]
h1 = [x for x in d.paragraphs if x.style.name == "Heading 1"]
h2 = [x for x in d.paragraphs if x.style.name == "Heading 2"]
print("non-empty paragraphs:", len(non_empty))
print("tables:", len(d.tables))
print("Heading 1:", len(h1))
print("Heading 2:", len(h2))
print("H1 list:", [x.text for x in h1])
words = sum(len(x.text.split()) for x in non_empty)
print("words:", words)
print("inline shapes:", len(d.inline_shapes))
sec = d.sections[0]
print("page cm:", sec.page_width.cm, sec.page_height.cm, "margins:", sec.left_margin.cm, sec.top_margin.cm)
print("header runs:", [r.text for r in sec.header.paragraphs[0].runs])
print("footer text:", sec.footer.paragraphs[0].text)