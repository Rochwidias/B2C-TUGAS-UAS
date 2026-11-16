# -*- coding: utf-8 -*-
"""Deck: CraftAI Studio pitch (Kelompok 10, UTS SI134). 16:9 13.333x7.5in."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import copy

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts"
FIG = f"{BASE}/_build/figs"
LOGO = f"{BASE}/assets/amikom-logo-primer.png"
OUT = f"{BASE}/Presentasi-CraftAI-Studio-Kelompok-10-UTS-SI134.pptx"

DARK = RGBColor(0x0C, 0x1B, 0x2A)
INK = RGBColor(0x10, 0x1A, 0x14)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
OFFWHITE = RGBColor(0xF7, 0xF8, 0xF6)
TEAL = RGBColor(0x0D, 0x94, 0x88)
TEAL_D = RGBColor(0x0B, 0x6E, 0x66)
TEAL_L = RGBColor(0xE6, 0xF4, 0xF2)
MUTED = RGBColor(0x4A, 0x55, 0x4C)
GRAY = RGBColor(0x7A, 0x86, 0x7C)
LINE = RGBColor(0xC9, 0xD4, 0xCB)
AMBER = RGBColor(0xF5, 0x9E, 0x0B)
DIM = RGBColor(0xA8, 0xB8, 0xAC)
DIM2 = RGBColor(0x8E, 0x9E, 0x92)

FONT = "Calibri"
IDENT = "Kelompok 10 · UTS Technopreneur · CraftAI Studio"
TOTAL = 16

prs = Presentation()
prs.slide_width = Inches(13.3333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]


# ------------------------------------------------------------------ helpers
def add_slide(bg=WHITE):
    s = prs.slides.add_slide(BLANK)
    fill = s.background.fill
    fill.solid()
    fill.fore_color.rgb = bg
    return s


def tb(s, x, y, w, h, text, size=14, bold=False, color=INK, align=PP_ALIGN.LEFT,
       spacing=1.0, anchor=MSO_ANCHOR.TOP, italic=False, font=FONT, space_after=0):
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        p.space_after = Pt(space_after)
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.name = font
        r.font.color.rgb = color
    return box


def rect(s, x, y, w, h, fill=WHITE, line_color=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
         adj=0.08, line_w=1.0):
    sp = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
    if line_color is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line_color
        sp.line.width = Pt(line_w)
    sp.shadow.inherit = False
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            sp.adjustments[0] = adj
        except Exception:
            pass
    sp.text_frame.word_wrap = True
    return sp


def hline(s, x, y, w, color=LINE, width=0.75):
    ln = s.shapes.add_connector(1, Inches(x), Inches(y), Inches(x + w), Inches(y))
    ln.line.color.rgb = color
    ln.line.width = Pt(width)
    return ln


def head(s, eyebrow, title, sub=None, dark=False, title_size=30, tw=11.2):
    tb(s, 0.85, 0.6, 9.0, 0.3, eyebrow.upper(), size=11, bold=True,
       color=TEAL, spacing=1.0)
    tb(s, 0.85, 0.95, tw, 0.9, title, size=title_size, bold=True,
       color=WHITE if dark else INK, spacing=0.95)
    if sub:
        tb(s, 0.85, 1.86 if title_size <= 30 else 2.0, 10.6, 0.6, sub, size=13.5,
           color=DIM if dark else MUTED, spacing=1.15)


def footer(s, n, dark=False):
    hline(s, 0.85, 6.92, 11.633, color=RGBColor(0x2A, 0x3A, 0x30) if dark else LINE)
    tb(s, 0.85, 7.0, 9.0, 0.24, IDENT, size=9.5,
       color=DIM2 if dark else GRAY)
    tb(s, 10.9, 7.0, 1.6, 0.24, f"{n:02d} / {TOTAL}", size=9.5, bold=True,
       color=DIM2 if dark else GRAY, align=PP_ALIGN.RIGHT)


def card(s, x, y, w, h, fill=WHITE, bar=True, bar_color=TEAL, line_color=LINE, adj=0.06):
    sp = rect(s, x, y, w, h, fill=fill, line_color=line_color, adj=adj)
    if bar:
        b = rect(s, x + 0.0, y, w, 0.06, fill=bar_color, shape=MSO_SHAPE.RECTANGLE)
        b.line.fill.background()
    return sp


def pic(s, path, x, y, w=None, h=None):
    kw = {}
    if w:
        kw["width"] = Inches(w)
    if h:
        kw["height"] = Inches(h)
    return s.shapes.add_picture(path, Inches(x), Inches(y), **kw)