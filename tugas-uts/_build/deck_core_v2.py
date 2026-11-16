# -*- coding: utf-8 -*-
"""Deck core helper — Canva Blue & Purple Gradient Pitch Deck style."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

BASE = "D:/Project/B2C-TUGAS-UAS/tugas-uts"
FIG = f"{BASE}/_build/figs"
LOGO = f"{BASE}/assets/amikom-logo-on-dark.png"
GRADIENT_BG = f"{BASE}/_build/gradient_bg.png"
OUT = f"{BASE}/Presentasi-CraftAI-Studio-Kelompok-10-UTS-SI134.pptx"

# Design system: Canva Blue & Purple Gradient Pitch Deck (ui-ux-pro-max)
# Palette: deep navy base + purple tech + blue secondary + gold accent
NAVY = RGBColor(0x0F, 0x17, 0x2A)        # deep dark navy
INK = RGBColor(0x0F, 0x0F, 0x23)          # near-black (text on light)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
OFFWHITE = RGBColor(0xF8, 0xFA, 0xFC)     # light card bg
PURPLE = RGBColor(0x8B, 0x5C, 0xF6)       # primary purple tech
PURPLE_L = RGBColor(0xA7, 0x8B, 0xFA)      # light purple
PURPLE_XL = RGBColor(0xE9, 0xE3, 0xFF)     # very light lavender
BLUE = RGBColor(0x3B, 0x82, 0xF6)          # blue secondary
BLUE_L = RGBColor(0x60, 0xA5, 0xFA)        # light blue
GOLD = RGBColor(0xF5, 0x9E, 0x0B)          # gold accent
GOLD_L = RGBColor(0xFD, 0xE6, 0x8A)        # light gold
CORAL = RGBColor(0xE0, 0x7A, 0x4E)         # coral warm accent
MUTED = RGBColor(0x47, 0x55, 0x69)         # muted text
GRAY = RGBColor(0x94, 0xA3, 0xB8)          # gray secondary
LINE = RGBColor(0x33, 0x41, 0x55)          # border/divider
DIM = RGBColor(0x94, 0xA3, 0xB8)           # dim text on dark
DIM2 = RGBColor(0x64, 0x74, 0x8B)          # dimmer text on dark
CARD = RGBColor(0x1E, 0x1D, 0x35)          # card on dark bg
BORDER = RGBColor(0x4C, 0x1D, 0x95)        # purple border on dark

FONT = "Segoe UI"  # cross-platform sans (safe fallback: Calibri, Arial)
IDENT = "Kelompok 10 · UTS Technopreneur · CraftAI Studio"
TOTAL = 16

prs = Presentation()
prs.slide_width = Inches(13.3333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# --------------------------------------------------------------- helpers
def add_slide(bg=None, gradient=False):
    """Add slide with solid bg or gradient image background."""
    s = prs.slides.add_slide(BLANK)
    if gradient:
        s.shapes.add_picture(GRADIENT_BG, Inches(0), Inches(0),
                            width=Inches(13.3333), height=Inches(7.5))
    else:
        fill = s.background.fill
        fill.solid()
        fill.fore_color.rgb = bg if bg else OFFWHITE
    return s

def tb(s, x, y, w, h, text, size=14, bold=False, color=INK, align=PP_ALIGN.LEFT,
       spacing=1.0, anchor=MSO_ANCHOR.TOP, italic=False, font=FONT, space_after=0,
       tracking=None):
    """Text box. size: float (pt), spacing: float (line-height), tracking: float (pt)."""
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = float(spacing)
        p.space_after = Pt(space_after)
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.name = font
        r.font.color.rgb = color
        # Letter-spacing (tracking) in 100ths of point
        if tracking:
            r.font._rPr.set('spc', str(int(float(tracking) * 100)))
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

def head(s, eyebrow, title, sub=None, dark=False, title_size=32, tw=11.2):
    """Slide header: eyebrow (small caps) + title + optional subtitle."""
    eyebrow_color = PURPLE if not dark else PURPLE_L
    title_color = INK if not dark else WHITE
    sub_color = MUTED if not dark else DIM
    
    # Eyebrow with tracking
    tb(s, 0.85, 0.5, 9.5, 0.3, eyebrow.upper(), size=11, bold=True,
       color=eyebrow_color, spacing=1.0, tracking=3.0)
    
    # Title
    tb(s, 0.85, 0.9, tw, 1.0, title, size=title_size, bold=True,
       color=title_color, spacing=0.95)
    
    if sub:
        tb(s, 0.85, 1.9 if title_size <= 30 else 2.1, 10.6, 0.7, sub, size=13.5,
           color=sub_color, spacing=1.15)

def footer(s, n, dark=False):
    hline(s, 0.85, 6.9, 11.633, color=LINE if not dark else BORDER)
    tb(s, 0.85, 6.98, 9.0, 0.24, IDENT, size=9.5, color=GRAY if not dark else DIM2)
    tb(s, 10.9, 6.98, 1.6, 0.24, f"{n:02d} / {TOTAL}", size=9.5, bold=True,
       color=GRAY if not dark else DIM2, align=PP_ALIGN.RIGHT)

def card(s, x, y, w, h, fill=WHITE, bar=True, bar_color=PURPLE, line_color=LINE, adj=0.06):
    """Card with optional top accent bar."""
    sp = rect(s, x, y, w, h, fill=fill, line_color=line_color, adj=adj)
    if bar:
        b = rect(s, x + 0.0, y, w, 0.06, fill=bar_color, shape=MSO_SHAPE.RECTANGLE)
        b.line.fill.background()
    return sp

def chip(s, x, y, w, h, text, fill=PURPLE, color=WHITE, size=11, bold=True):
    """Pill/chip badge."""
    sp = rect(s, x, y, w, h, fill=fill, shape=MSO_SHAPE.ROUNDED_RECTANGLE, adj=0.5)
    tf = sp.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_right = Inches(0.1)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.name = FONT
    r.font.color.rgb = color
    return sp

def pic(s, path, x, y, w=None, h=None):
    """Insert picture."""
    kw = {}
    if w:
        kw["width"] = Inches(w)
    if h:
        kw["height"] = Inches(h)
    return s.shapes.add_picture(path, Inches(x), Inches(y), **kw)

def num_badge(s, x, y, num, size=0.5, fill=PURPLE, color=WHITE, fontsize=14):
    """Circle with number."""
    sp = rect(s, x, y, size, size, fill=fill, shape=MSO_SHAPE.OVAL)
    tf = sp.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = str(num)
    r.font.size = Pt(fontsize)
    r.font.bold = True
    r.font.name = FONT
    r.font.color.rgb = color
    return sp