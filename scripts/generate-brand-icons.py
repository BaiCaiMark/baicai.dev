#!/usr/bin/env python3
"""Regenerate baicai's browser and installed-app icons from the approved mother form.

Requires Pillow. The original black/transparent brand mark stays unchanged.
The colour treatment parallels app/brand-refresh.css (.brand-mark-warm).
Small favicons and browser-installable PWA icons use transparency to avoid
a square badge in Chrome. Apple touch icons retain an opaque ivory canvas.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "brand/identity-2026/solid-form-mark.webp"
VERSION = "warm-v1"
PWA_VERSION = "warm-v2"
BACKGROUND = (248, 246, 242, 255)  # --background / PWA theme colour
STOPS = (
    (0.00, (203, 177, 140)),  # champagne highlight
    (0.25, (161, 135, 109)),
    (0.51, (96, 87, 80)),    # structural contrast
    (0.70, (119, 104, 90)),
    (1.00, (194, 161, 126)),
)

def interpolate(t):
    t = min(1.0, max(0.0, t))
    for (left, a), (right, b) in zip(STOPS, STOPS[1:]):
        if t <= right:
            f = (t-left) / (right-left)
            return tuple(round(c1 + (c2-c1)*f) for c1, c2 in zip(a, b))
    return STOPS[-1][1]

def gradient(size):
    # A gentle upper-left to lower-right variation, sampled at high resolution
    # before producing small icons; stable and intentionally restrained.
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        fy = y/(size-1)
        for x in range(size):
            fx = x/(size-1)
            t = (0.6*fx+0.8*fy)/1.4
            px[x,y] = interpolate(t)
    return img

def create_mark(size=768, micro=False):
    source = Image.open(SOURCE).convert("RGBA")
    alpha = source.getchannel("A")
    if micro:
        # Micro optical correction: lightly open hairline gaps at native 384px.
        # No new silhouette or independently drawn curves are introduced.
        alpha = Image.blend(alpha, alpha.filter(ImageFilter.MinFilter(9)), 0.48)
    alpha = alpha.resize((size, size), Image.Resampling.LANCZOS)
    coloured = gradient(size).convert("RGBA")
    coloured.putalpha(alpha)
    return coloured

def save_png(img, name):
    img.save(PUBLIC / name, format="PNG", optimize=True)

def installed_icon(size, mark):
    canvas = Image.new("RGBA", (size, size), BACKGROUND)
    # ~65% visible width; room for taskbar/OS mask rounding.
    inner = round(size * 0.74)
    glyph = mark.resize((inner,inner), Image.Resampling.LANCZOS)
    at = ((size-inner)//2, (size-inner)//2)
    canvas.alpha_composite(glyph, at)
    return canvas

def pwa_transparent_icon(size, mark):
    """Transparent canvas for Chrome install / open-in-app badges.

    The approved logo silhouette is preserved. Slight outer padding keeps
    the glyph legible when Chrome scales it down to toolbar size.
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = round(size * 0.88)
    glyph = mark.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.alpha_composite(glyph, ((size-inner)//2, (size-inner)//2))
    return canvas

def generate():
    mark = create_mark()
    micro = create_mark(micro=True)

    for size in (16, 32, 48, 64):
        icon = (micro if size <= 32 else mark).resize((size,size), Image.Resampling.LANCZOS)
        save_png(icon, f"favicon-{size}.png")
        if size in (16,32):
            save_png(icon, f"favicon-{VERSION}-{size}.png")

    save_png(mark.resize((512,512), Image.Resampling.LANCZOS), "favicon.png")
    ico = mark.resize((256,256), Image.Resampling.LANCZOS)
    ico.save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])
    ico.save(PUBLIC / f"favicon-{VERSION}.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])

    # Apple touch icons generally need a solid background; keep that variant.
    apple = installed_icon(180, mark)
    save_png(apple, "apple-touch-icon.png")
    save_png(apple, f"apple-touch-icon-{VERSION}.png")

    # Chrome / Windows app icon: no ivory square behind the actual mark.
    for size in (192, 512):
        image = pwa_transparent_icon(size, mark)
        save_png(image, f"pwa-{size}.png")
        save_png(image, f"pwa-{PWA_VERSION}-{size}.png")

    # Review image, local only (ignored by Git).
    board = Image.new("RGBA",(830,390),(248,246,242,255))
    from PIL import ImageDraw, ImageFont
    d = ImageDraw.Draw(board)
    d.text((28,12),"baicai | warm icon family  -  preview", fill=(52,43,35))
    x=28
    for size in (16,32,48,64):
        i=Image.open(PUBLIC/f"favicon-{size}.png").convert("RGBA")
        board.alpha_composite(i,(x,70))
        d.text((x,140),f"{size}px",fill=(72,63,54))
        x+=93
    d.text((28,200),"Transparent PWA / Chrome toolbar icon",fill=(52,43,35))
    x=28
    for size, name in [(80,"pwa-192.png"), (120,"pwa-512.png")]:
        icon=Image.open(PUBLIC/name).convert("RGBA").resize((size,size), Image.Resampling.LANCZOS)
        board.alpha_composite(icon,(x,242))
        x+=size+36
    board.convert("RGB").save(ROOT / "_brand-icon-review.png")

if __name__ == "__main__":
    generate()
