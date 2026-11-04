# Vanity Step · DXF-based bathroom template

Source reference: user-supplied `111401(1).dxf` (AutoCAD 2018, `$INSUNITS=1` / inches). The DXF contained two mirrored, closed **six-edge stepped contours**, each made of six `PART_CONTOUR` LINE entities; no marked sink cutout, faucet hole, or polished edge. The drawing also contains a print frame/title block. The DXF source binary is **not** copied to this repository.

## Reference geometry

Each profile is an orthogonal stepped vanity. The two shown variants are mirror images:

- overall run: **70″**
- maximum depth (deep portion): **22.5″**
- shallow-end depth: **7″**
- full-depth section run: **40″**
- shallow-end run: **30″** = 70 - 40

The source DXF is a *contour drawing*. It does not establish whether these are Cabinet or Finished Top readings. **Do not automatically copy the sample lengths into any measurement input**, or infer sink/edge treatments from absent geometry.

## Site Measure implementation

- One menu: **+ Vanity Step**, with **Deep Left** and **Deep Right**.
- Both reuse the existing `l` 6-edge geometry solver. `profile='vanity-step'` provides contextual labels and a recognisable dashed example silhouette; `mirrored=true` flips to Deep Right.
- New templates start with **all 4 controlling lengths blank**, in `Cabinet + Overhang` mode, so they cannot become fabricated geometry until real measurements are entered.
- Allowances start at explicit, editable **0″ Project Defaults / unconfirmed**. Treatment has **no inferred value** from the DXF. User selects No Polish / Polish / Miter per edge. Horizontal shallow-end edge `innerX` uses front-overhang defaults when polished.
- Quick Measure prompts: **Total length**, **Max depth**, **Shallow depth**, **Deep section width**. User can swap deep side without editing geometry or re-entering dimensions.
- Missing dimensions display dashed guide only. Incomplete parts remain excluded from valid DXF output. PDF retains status/provenance; confirmed measurements still require shop review before manufacturing.
- Existing schema-v2 projects remain supported because `profile` is optional; backups retain the tag and all dimensions.

## Regression cases

- 70″ × 22.5″ / 7″ shallow / 40″ deep resolves a 70″ × 22.5″ 6-edge polygon on either side, with no arbitrary seam/sink.
- All untouched controls are Unknown; visible sample silhouette must not be exported as manufactured DXF geometry.
- Both mirror presets save/reopen and survive project backups.
- Changing individual treatments or custom 0″ / 1⁄8″ overhang must never silently invent a polished edge from the uploaded DXF.
