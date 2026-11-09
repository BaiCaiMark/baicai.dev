"""Derive public favicons from the approved 01 SOLID FORM raster mark.

Source is a visual crop of the user-approved brand geometry review,
not an independent CAD reconstruction. Requires Pillow.
"""
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parents[1] / "public"
MARK = PUBLIC / "brand" / "identity-2026" / "solid-form-mark.webp"
CREAM = (248, 246, 242, 255)

def icon(size: int, filled: bool = False) -> Image.Image:
    original = Image.open(MARK).convert("RGBA")
    margin = int(size * (0.14 if filled else 0.06))
    emblem = original.resize((size - margin * 2, size - margin * 2), Image.Resampling.LANCZOS)
    background = Image.new("RGBA", (size, size), CREAM if filled else (0, 0, 0, 0))
    background.alpha_composite(emblem, (margin, margin))
    return background

def main() -> None:
    for size in [16, 32, 48, 64]:
        icon(size).save(PUBLIC / f"favicon-{size}.png", optimize=True)
    icon(512).save(PUBLIC / "favicon.png", optimize=True)
    icon(180, filled=True).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
    for size in [192, 512]:
        icon(size, filled=True).convert("RGB").save(PUBLIC / f"pwa-{size}.png", optimize=True)
    icon(256).save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Brand icons exported from", MARK)

if __name__ == "__main__":
    main()
