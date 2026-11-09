# baicai.dev — 2026 Marble Identity / Homepage V1

## Status
**Development preview only.** Brand design direction confirmed; artwork geometry is still exploratory.
Do not merge this branch into `main` or promote to Production without Mark's acceptance.

## Decisions and provenance
- **Fixed visual mother form:** the user's uploaded geometry sheet titled
  `LOGO GEOMETRY / CORRECTED CONSTRUCTION NOTES`, specifically the black
  `01 SOLID FORM / THE EXACT LOGO (MOTHER FORM)` image at upper-left.
- It is **not** a letter D or a directive to construct an A or a canonical Möbius band.
- The supplied geometry annotations are conceptual, not CAD-verified. No SVG or 3D engineering geometry is asserted.
- `public/brand/identity-2026/solid-form-mark.webp` is an alpha-masked visual
  extraction of this supplied black mother-form graphic, intended for on-screen use.
  The transparent bitmap remains a visual asset rather than precision parametric geometry.
- `public/brand/identity-2026/marble-sculpture-concept-v1.webp` is an optimized,
  downscaled version of the user's supplied **white marble artwork reference**
  (grey veining, subtle gold, rounded continuous form). It defines atmosphere
  and material direction; the final sculpture is **not** approved or proved physically manufacturable.
- The previous Future B / A1 / eclipse assets remain in the repository as
  historical material, but are no longer the current homepage brand identity.
  Older `baicai-brand-kit/BRAND_GUIDE.md` documents an earlier identity.

## Asset roles
| Role | Asset | Status |
| --- | --- | --- |
| Navigation / About mark | `/brand/identity-2026/solid-form-mark.webp` | Visual extract of approved mother form |
| Browser / PWA icons | `/favicon-*.png`, `/favicon.ico`, `/apple-touch-icon.png`, `/pwa-*.png` | Derivatives from extracted mark |
| Homepage Hero | `/brand/identity-2026/marble-sculpture-concept-v1.webp` | Provisional art reference |
| Site theme | `app/brand-refresh.css` | Warm white, marble, architectural minimalism |

## Maintenance
- Regenerate site icons on Kairo with `python scripts/generate-brand-icons.py`
  after replacing the source mark bitmap; requires Pillow.
- Theme tokens are appended in `app/brand-refresh.css` after `globals.css`.
  The theme intentionally affects existing public pages while leaving all
  CAD, measurement and conversion tool logic untouched.
- The Hero uses static optimized artwork, not Three.js, WebGL or real-time 3D.
- Original authoritative design images remain the images provided by the user
  in the brand review conversation; do not treat the derivative bitmap as a CAD master.
- Review at desktop (1440px), tablet (768px), and mobile (390px), including dark mode.
- On acceptance only, merge the reviewed branch to `main`.

## Branch
`redesign/marble-identity-v1` created from `main` at
`02297e7d31a6bb033dccbb7f86f93a3f037cf766`.

## Guardrails
- Never delete or migrate `/tools`, `/tools/site-measure` or `/tools/cad-viewer` data.
- Never rename the brand mark to D/A or invent measured curve radii.
- A polished rendering is not a watertight, fabricable 3D mesh.
