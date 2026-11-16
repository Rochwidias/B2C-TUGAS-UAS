# -*- coding: utf-8 -*-
"""Gradient mesh background (Canva Blue & Purple style) for CraftAI Studio."""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
import math

# Gradient blobs config: (cx_in, cy_in, radius_in, color_rgb, opacity 0-1)
BLOBS = [
    # purple center-left
    (4.0, 3.5, 4.2, (0x6B, 0x21, 0xA8), 0.55),
    # blue right side
    (9.5, 3.8, 4.8, (0x1D, 0x4E, 0xD8), 0.50),
    # violet accent top-right
    (11.5, 1.5, 2.8, (0x7C, 0x3A, 0xED), 0.40),
    # warm coral accent bottom-left (subtle)
    (1.5, 6.0, 2.5, (0xE0, 0x7A, 0x4E), 0.35),
]

def add_gradient_mesh(slide, width_in=13.3333, height_in=7.5):
    """Add gradient mesh background to slide."""
    # Dark base background
    bg = slide.background.fill
    bg.solid()
    bg.fore_color.rgb = RGBColor(0x0F, 0x05, 0x1E)
    
    # Add radial gradient blobs (concentric circles with transparency)
    for cx, cy, radius, color, opacity in BLOBS:
        num_layers = 10
        for layer in range(num_layers, 0, -1):
            r = radius * (layer / num_layers)
            # Transparency increases toward center (simulates radial falloff)
            layer_opacity = opacity * (1 - (layer - 1) / num_layers * 0.7)
            alpha = int(layer_opacity * 100000)
            
            circle = slide.shapes.add_shape(
                MSO_SHAPE.OVAL,
                Inches(cx - r), Inches(cy - r),
                Inches(r * 2), Inches(r * 2)
            )
            circle.fill.solid()
            circle.fill.fore_color.rgb = RGBColor(*color)
            circle.line.fill.background()
            
            # Set transparency
            sp = circle.fill.fore_color._xFill
            srgb = sp.find(qn('a:srgbClr'))
            if srgb is not None:
                alpha_elem = srgb.find(qn('a:alpha'))
                if alpha_elem is None:
                    from lxml import etree
                    alpha_elem = etree.SubElement(srgb, qn('a:alpha'))
                alpha_elem.set('val', str(alpha))
    
    return slide

# Test gradient background
if __name__ == "__main__":
    prs = Presentation()
    prs.slide_width = Inches(13.3333)
    prs.slide_height = Inches(7.5)
    s = prs.slides.add_slide(prs.slide_layouts[6])
    
    add_gradient_mesh(s)
    
    # Add test text
    from pptx.util import Inches
    box = s.shapes.add_textbox(Inches(1), Inches(1), Inches(8), Inches(1))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Gradient Background Test"
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    
    prs.save("D:/hermes/cache/scratch/gradient_mesh_test.pptx")
    print("✓ gradient mesh test saved")