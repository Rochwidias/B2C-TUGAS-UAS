# -*- coding: utf-8 -*-
"""Builder: Makalah CraftAI Studio (Kelompok 10, UTS Technopreneur SI134)."""
import os
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts"
FIG = f"{BASE}/_build/figs"
LOGO = f"{BASE}/assets/amikom-logo-primer.png"
OUT = f"{BASE}/Makalah-CraftAI-Studio-Kelompok-10-UTS-SI134.docx"

DARK = RGBColor(0x0C, 0x1B, 0x2A)
TEAL_D = RGBColor(0x0B, 0x6E, 0x66)
TEAL = RGBColor(0x0D, 0x94, 0x88)
MUTED = RGBColor(0x4A, 0x55, 0x4C)

doc = Document()

# ------------------------------------------------------------------ styles
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
normal.font.color.rgb = DARK
normal.paragraph_format.line_spacing = 1.25
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
rpr = normal.element.get_or_add_rPr()
rf = rpr.find(qn("w:rFonts"))
if rf is None:
    rf = OxmlElement("w:rFonts")
    rpr.append(rf)
rf.set(qn("w:ascii"), "Calibri")
rf.set(qn("w:hAnsi"), "Calibri")

h1 = doc.styles["Heading 1"]
h1.font.name = "Calibri"
h1.font.size = Pt(15)
h1.font.bold = True
h1.font.color.rgb = TEAL_D
h1.paragraph_format.space_before = Pt(20)
h1.paragraph_format.space_after = Pt(8)
h1.paragraph_format.keep_with_next = True

h2 = doc.styles["Heading 2"]
h2.font.name = "Calibri"
h2.font.size = Pt(12.5)
h2.font.bold = True
h2.font.color.rgb = DARK
h2.paragraph_format.space_before = Pt(14)
h2.paragraph_format.space_after = Pt(4)
h2.paragraph_format.keep_with_next = True

# ------------------------------------------------------------------ page setup (A4, 2.5 cm)
sec = doc.sections[0]
sec.page_width = Cm(21.0)
sec.page_height = Cm(29.7)
sec.left_margin = sec.right_margin = Cm(2.5)
sec.top_margin = sec.bottom_margin = Cm(2.5)

# header: logo AMIKOM + identitas
hp = sec.header.paragraphs[0]
hp.paragraph_format.tab_stops.add_tab_stop(Cm(16.0), WD_TAB_ALIGNMENT.RIGHT)
run = hp.add_run()
run.add_picture(LOGO, height=Cm(1.0))
r2 = hp.add_run("\tTechnopreneur (SI134) · UTS 2026/2027")
r2.font.size = Pt(8.5)
r2.font.color.rgb = MUTED
r2.font.name = "Calibri"
hp.paragraph_format.space_after = Pt(4)


def add_page_field(paragraph):
    r1 = OxmlElement("w:r")
    fc = OxmlElement("w:fldChar")
    fc.set(qn("w:fldCharType"), "begin")
    r1.append(fc)
    paragraph._p.append(r1)
    r2 = OxmlElement("w:r")
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = " PAGE "
    r2.append(it)
    paragraph._p.append(r2)
    r3 = OxmlElement("w:r")
    fc2 = OxmlElement("w:fldChar")
    fc2.set(qn("w:fldCharType"), "end")
    r3.append(fc2)
    paragraph._p.append(r3)


fp = sec.footer.paragraphs[0]
fp.paragraph_format.tab_stops.add_tab_stop(Cm(16.0), WD_TAB_ALIGNMENT.RIGHT)
fr = fp.add_run("Makalah Technopreneur · CraftAI Studio · Kelompok 10\tHalaman ")
fr.font.size = Pt(8.5)
fr.font.color.rgb = MUTED
fr.font.name = "Calibri"
add_page_field(fp)


def set_page_format(section, fmt, start=1):
    sectPr = section._sectPr
    pg = sectPr.find(qn("w:pgNumType"))
    if pg is None:
        pg = OxmlElement("w:pgNumType")
        sectPr.append(pg)
    pg.set(qn("w:fmt"), fmt)
    pg.set(qn("w:start"), str(start))


def new_footer(section, label, fmt="decimal", start=1):
    """Give `section` its own footer (unlinked) with a PAGE field and numbering format."""
    sectPr = section._sectPr
    for ref in sectPr.findall(qn("w:footerReference")):
        sectPr.remove(ref)
    section.footer.is_linked_to_previous = False
    fp = section.footer.paragraphs[0]
    fp.paragraph_format.tab_stops.add_tab_stop(Cm(16.0), WD_TAB_ALIGNMENT.RIGHT)
    r = fp.add_run(label + "\tHalaman ")
    r.font.size = Pt(8.5)
    r.font.color.rgb = MUTED
    r.font.name = "Calibri"
    add_page_field(fp)
    set_page_format(section, fmt, start)
    return section


# ------------------------------------------------------------------ helpers
def para(text, size=11, bold=False, italic=False, color=None, align=None,
         space_after=6, space_before=0, style=None, line=1.25):
    p = doc.add_paragraph(style=style)
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.name = "Calibri"
    if color is not None:
        r.font.color.rgb = color
    if align is not None:
        p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.line_spacing = line
    return p


def body(text):
    return para(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY)


def bullet(text, size=11):
    p = doc.add_paragraph(style="List Bullet")
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.name = "Calibri"
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.2
    return p


def heading(text, level=1):
    p = doc.add_heading(text, level=level)
    p.paragraph_format.line_spacing = 1.15
    return p


def caption(text, kind="Gambar"):
    p = para(f"{kind} {caption.count}. {text}", size=9.5, italic=True, color=MUTED,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12, space_before=2)
    caption.count += 1
    return p


caption.count = 1


def tcaption(text):
    p = para(f"Tabel {tcaption.count}. {text}", size=9.5, italic=True, color=MUTED,
             align=WD_ALIGN_PARAGRAPH.LEFT, space_after=4, space_before=8)
    tcaption.count += 1
    return p


tcaption.count = 1


def figure(name, width_cm, cap):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(f"{FIG}/{name}", width=Cm(width_cm))
    caption(cap)


def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def table(rows, widths=None, header_fill="0D9488", font_size=9.5, align_center_cols=()):
    t = doc.add_table(rows=len(rows), cols=len(rows[0]))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = t.cell(i, j)
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(str(val))
            r.font.size = Pt(font_size)
            r.font.name = "Calibri"
            if i == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                shade(cell, header_fill)
            elif i % 2 == 0:
                shade(cell, "F3F7F6")
            if j in align_center_cols:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if widths:
        for j, w in enumerate(widths):
            for i in range(len(rows)):
                t.cell(i, j).width = Cm(w)
    return t


def toc_field():
    p = doc.add_paragraph()
    r1 = p.add_run()
    fc = OxmlElement("w:fldChar")
    fc.set(qn("w:fldCharType"), "begin")
    r1._r.append(fc)
    r2 = p.add_run()
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = 'TOC \\o "1-2" \\h \\z \\u'
    r2._r.append(it)
    r3 = p.add_run()
    fc2 = OxmlElement("w:fldChar")
    fc2.set(qn("w:fldCharType"), "separate")
    r3._r.append(fc2)
    r4 = p.add_run("Klik kanan lalu “Update Field” untuk membangun daftar isi otomatis.")
    r4.font.size = Pt(10)
    r4.font.italic = True
    r4.font.color.rgb = MUTED
    r5 = p.add_run()
    fc3 = OxmlElement("w:fldChar")
    fc3.set(qn("w:fldCharType"), "end")
    r5._r.append(fc3)
    return p


def list_entry(label, page):
    p = para("", size=11, space_after=2, line=1.15)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(16.0), WD_TAB_ALIGNMENT.RIGHT, 2)  # dotted
    r = p.add_run(f"{label}\t{page}")
    return p