# Homepage ambient Logo — optical display derivative (November 2026)

The website's **source-of-truth logo** is the approved mother-form raster at:
`public/brand/identity-2026/solid-form-mark.webp` (384 × 384).

The scroll-responsive hero **uses a display-only derivative**:
`public/brand/identity-2026/hero-solid-form-optical-v1.svg`.

## Why
At up to ~985 CSS pixels, the 384px raster appears visibly soft and its thin
front/back ribbon separations become irregular, especially when the hero
rotates and scales with the visitor's scroll.

The optical SVG traces the large silhouette and inner opening with smoothed
curves, then restores the three ribbon separation hairlines via explicit
transparent mask strokes. The website still uses the original raster for
normal-sized brand uses. This SVG is **not an exact CAD construction**, and
must not be used as a replacement for the master logo or as a fabrication
template.

## Usage
`app/hero-ambient.css` uses the SVG as an ambient background only.
`app/components/ScrollAtmosphere.tsx` handles scroll-position transforms.
Keep the **original Logo**, its proportion, and production assets unchanged
while experimenting with hero motion. If the SVG is further edited, compare
against the original mother-form image and verify the three overlap lines
retain their intended continuity.

The SVG is decorative (aria-hidden), and the effect must be static when
`prefers-reduced-motion: reduce` is enabled.
