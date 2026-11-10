#!/usr/bin/env python3
"""Reconstruct a large-screen 2D baicai display mark from the approved artwork.

This is NOT 3D reconstruction. Five separate negative-space boundaries are
traced directly from the reference image: one outer silhouette, one opening,
and three physical front/back transition slits. No decorative lines are drawn.

Build-time only: pip install numpy scipy opencv-python-headless Pillow
Run: python scripts/reconstruct-hero-logo.py
"""
from pathlib import Path
import xml.etree.ElementTree as ET

import cv2
import numpy as np
from scipy.interpolate import splprep, splev

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "baicai-brand-kit/reference/identity-2026-11-10/source/approved-motherform-crop-401x438.png"
OUT = ROOT / "public/brand/identity-2026"
THRESHOLD = 110
CLOSURE_PX = 5

def spline_path(contour, smoothness, segments):
    points = contour[:, 0, :].astype(float)
    steps = np.sqrt(np.sum(np.diff(np.vstack((points, points[:1])), axis=0) ** 2, axis=1))
    parameters = np.r_[0, np.cumsum(steps[:-1])] / steps.sum()
    spline, _ = splprep(points.T, u=parameters, s=smoothness, per=True, k=3)
    breaks = np.linspace(0, 1, segments + 1)
    samples = np.array(splev(breaks, spline)).T
    tangents = np.array(splev(breaks, spline, der=1)).T
    delta = 1 / segments
    result = [f"M{samples[0, 0]:.3f} {samples[0, 1]:.3f}"]
    for i in range(segments):
        a = samples[i] + tangents[i] * (delta / 3)
        b = samples[i + 1] - tangents[i + 1] * (delta / 3)
        end = samples[i + 1]
        result.append(
            f"C{a[0]:.3f} {a[1]:.3f} {b[0]:.3f} {b[1]:.3f} {end[0]:.3f} {end[1]:.3f}"
        )
    return " ".join(result + ["Z"])

def main():
    rgb = cv2.imread(str(SOURCE))
    if rgb is None or rgb.shape[:2] != (438, 401):
        raise ValueError(f"Expected the exact 401x438 approved raster: {SOURCE}")
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
    original = np.where(gray < THRESHOLD, 255, 0).astype(np.uint8)

    # Optical closing is ONLY used to identify five distinct contours.
    # The removed area is then reconstructed explicitly as three slits.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSURE_PX, CLOSURE_PX))
    solid = cv2.morphologyEx(original, cv2.MORPH_CLOSE, kernel)
    gaps = np.where((solid > 127) & (original < 127), 255, 0).astype(np.uint8)

    boundaries, hierarchy = cv2.findContours(solid, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    ring = max(boundaries, key=cv2.contourArea)
    inner_candidates = [c for c in boundaries if cv2.contourArea(c) > 2000 and cv2.contourArea(c) < cv2.contourArea(ring)]
    if len(inner_candidates) != 1:
        raise ValueError(f"Expected exactly one triangular opening; found {len(inner_candidates)}")
    interior = inner_candidates[0]

    small_contours = cv2.findContours(gaps, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]
    seams = sorted(
        [c for c in small_contours if cv2.contourArea(c) > 20],
        key=lambda c: cv2.boundingRect(c)[1]
    )
    if len(seams) != 3:
        raise ValueError(f"Expected exactly three structural overlap gaps; found {len(seams)}")

    subpaths = [
        spline_path(ring, smoothness=500, segments=65),
        spline_path(interior, smoothness=200, segments=40),
        *(spline_path(c, smoothness=180, segments=36) for c in seams)
    ]
    topology_path = " ".join(subpaths)
    OUT.mkdir(parents=True, exist_ok=True)

    # No painted stroke: SVG evenodd treats the three captured gap regions
    # as actual transparent negative space, preserving source front/back cues.
    mono = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 401 438" width="401" height="438">
  <!-- Source-traced: outer contour, central opening, three structural gap contours. -->
  <path fill="#151515" fill-rule="evenodd" d="{topology_path}"/>
</svg>"""
    satin = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 401 438" width="401" height="438">
  <defs>
    <linearGradient id="satin" x1="10%" y1="15%" x2="90%" y2="90%">
      <stop stop-color="#877768"/>
      <stop offset=".38" stop-color="#75675b"/>
      <stop offset=".63" stop-color="#726255"/>
      <stop offset="1" stop-color="#97846f"/>
    </linearGradient>
  </defs>
  <!-- Optical 2D vector derivative. Three slits remain true transparent gaps. -->
  <path fill="url(#satin)" fill-rule="evenodd" d="{topology_path}"/>
</svg>"""
    outputs = {
        "hero-solid-form-structural-mono-v1.svg": mono,
        "hero-solid-form-structural-satin-v1.svg": satin,
    }
    for name, svg in outputs.items():
        ET.fromstring(svg)
        target = OUT / name
        target.write_text(svg, encoding="utf-8")
        print(f"{target.relative_to(ROOT)} ({target.stat().st_size} bytes)")
    print("Structural contours: 1 outer + 1 opening + 3 gap regions (5 total)")
    print("Approved source raster untouched; no full 3D claims")

if __name__ == "__main__":
    main()
