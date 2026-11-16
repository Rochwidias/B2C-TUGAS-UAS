# -*- coding: utf-8 -*-
"""Generate smooth gradient mesh background PNG (Canva Blue & Purple style)."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

W, H = 1600, 900

def radial_gradient(size, center, radius, color, alpha_max=255):
    """Create radial gradient overlay."""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = center
    for r in range(int(radius), 0, -max(1, int(radius/80))):
        ratio = 1 - r/radius
        alpha = int(alpha_max * ratio * ratio)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*color, alpha)
        )
    return img.filter(ImageFilter.GaussianBlur(radius=radius*0.3))

def create_mesh_gradient():
    """Create smooth mesh gradient background."""
    # Render at 120% then center-crop to eliminate edge clipping artifacts
    RW, RH = int(W * 1.2), int(H * 1.2)
    base = Image.new('RGBA', (RW, RH), (15, 5, 30, 255))
    
    # Define color blobs (position, radius, color, alpha)
    # Higher alpha = more vivid/pekat
    blobs = [
        ((0.25, 0.5), 0.48, (107, 33, 168), 0.72),   # purple center-left (more vivid)
        ((0.6, 0.45), 0.52, (29, 78, 216), 0.68),      # blue right-center (more vivid)
        ((0.8, 0.1), 0.32, (124, 58, 237), 0.55),     # violet top-right
        ((0.1, 0.8), 0.32, (224, 122, 78), 0.50),     # coral bottom-left
        ((0.9, 0.8), 0.38, (76, 29, 149), 0.60),      # deep purple bottom-right
    ]
    
    for (fx, fy), fr, color, alpha in blobs:
        cx, cy = int(RW * fx), int(RH * fy)
        radius = int(RW * fr)
        overlay = radial_gradient(
            (RW, RH), (cx, cy), radius, color, int(alpha * 255)
        )
        base = Image.alpha_composite(base, overlay)
    
    # Final smoothing pass (grain must come AFTER this, else blur kills it)
    base_rgb = base.convert('RGB').filter(ImageFilter.GaussianBlur(radius=18))

    # Center-crop back to target size
    left = (RW - W) // 2
    top = (RH - H) // 2
    textured = base_rgb.crop((left, top, left + W, top + H))

    # Grain/aurora texture on top (Canva template has visible film grain)
    grain = np.random.normal(0, 7.5, (H, W, 3))
    arr = np.clip(np.asarray(textured, dtype=np.float64) + grain, 0, 255).astype(np.uint8)
    textured = Image.fromarray(arr, 'RGB')

    # Boost brightness & saturation slightly for vivid aurora pop
    from PIL import ImageEnhance
    textured = ImageEnhance.Brightness(textured).enhance(1.12)
    textured = ImageEnhance.Color(textured).enhance(1.15)

    return textured

if __name__ == "__main__":
    bg = create_mesh_gradient()
    out_path = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/gradient_bg.png"
    bg.save(out_path, "PNG")
    print(f"✓ gradient bg saved: {out_path}")
    print(f"  size: {bg.size}")