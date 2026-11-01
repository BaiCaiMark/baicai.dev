# Site Measure Studio — Preview 3.1

Touch Interaction Polish · 2026-11-01

Branch: `feat/site-measure-v0.2-canvas`  
Baseline: `8698ba9` (Preview 3)

Stable preview: https://baicai-dev-git-feat-site-measure-2d66cb-marks-projects-ee37207f.vercel.app/tools/site-measure

## Delivered workflow

- Tap a Part interior, then drag its visible four-arrow handle. No Move mode or completion button is needed. The handle has a 44 × 44 CSS-pixel hit rectangle, independent of zoom. Release commits one history action; pointer cancellation, lost capture, or a second finger abandons the temporary placement.
- The selected handle accepts arrow keys (10 screen pixels) and Shift + arrow (40). The existing explicit Move action remains available. Placement only changes worksheet layout.
- Edge hit corridors are 44 CSS pixels wide. Selection compares distances to all transformed screen-space segments instead of relying on SVG paint order. Explicit dimension labels select their semantic edge. Equal-distance vertex ties use template/Part order consistently; choose a point farther along the edge or its label when intent is ambiguous.
- Inch input offers 1/2, 1/4, 3/4, 1/8 and 1/16 shortcuts alongside existing Space, slash and expression entry. A shortcut replaces the selected text or inserts a fraction token at the caret; touch activation keeps input focus. The native keyboard and direct text parser remain in use.
- Cabinet edge editing shows the selected edge's Overhang input directly below the cabinet measurement. Explicit zero and project defaults are visible actions. The other allowances remain available in one disclosure. Finished mode has no overhang controls.
- Finished edge values still come from the existing solver. For the sample vanity, changing Right end allowance from 1″ to 2″ changes the Back run from 60″ to 61″, while Right end length stays 22.5″. A blank allowance remains unknown and suppresses the complete outline.
- The editor floats beside the canvas, or above the lower portion on a narrow screen. Opening it preserves canvas scale. Only the minimum pan needed to expose the selected midpoint is applied. Done and the solver-derived Finished result stay outside the scrolling form.
- VisualViewport resize/scroll events position the editor within the visible region. When keyboard occlusion leaves the canvas below the visible area, temporary scroll space allows the canvas to be brought above it without changing geometric scale. The focused input is scrolled into the form’s visible region after viewport changes.

## Protected behavior

No measurement, geometry, validation, persistence, import schema, PDF/DXF adapter, font or dependency changes. Schema 2 and the existing schema 1 migration are unchanged.

Unified Area canvas, Part transformations/actions, references, notes, local autosave, history, backups/imports and existing A5/site navigation remain covered by regressions. No server customer-data storage or new automation was added.

## Validation

- 77 core tests passed, including screen-distance selection around corners, short/adjacent edges, transforms and zoom; caret insertion; existing measurements, geometry, storage, migration and export tests.
- 26 Chrome browser flows passed against the optimized local production build, with touch emulation. Seven new flows cover direct-handle drag/undo/reopen, cancellation/second-finger takeover, pan/pinch, L corners and transformed edges, fraction focus/caret, direct overhang/unknown/perpendicular effects, keyboard accessibility, and reduced visual viewport layouts at 1024 × 768, 768 × 1024 and 390 × 844.
- `npx tsc --noEmit`, `npm run lint` and `npm run build` passed.
- Independent DXF parsing checks editable closed LWPOLYLINE geometry and millimeter units. Layout changes leave exported native contours unchanged.
- PDFs generated before/after moving all sample Parts: all six pages have identical extracted text, vector drawing commands and rendered pixels (PyMuPDF comparison). Embedded Chinese text and field-review information remain present.
- Evidence is generated locally under ignored `artifacts/site-measure/`, including browser results, keyboard/overhang screenshots and `preview31-pdf-comparison.json`.

## Preview and boundaries

Only the existing feature branch is pushed. Verify the matching commit is READY with a Preview environment and the stable branch alias above. Deployment verification is recorded locally in `preview31-deployment.json`.

Do not merge main, publish production, change aliases manually, disable protection, or create sharing/bypass credentials. A protected preview may require the owner's existing Vercel sign-in. A READY build alone is not a remote interaction test.

## Remaining acceptance / limitations

- Physical Huawei/Android finger, stylus, native keyboard composition, OS gesture cancellation and download behavior require device testing. VisualViewport simulation is not a hardware test.
- Real AutoCAD opening/editing and manufacturing review remain pending.
- Overlapping Parts or exactly coincident edges cannot communicate which hidden edge was intended. Separate Parts with the handle, use dimension labels, or use keyboard edge selection. No snapping/collision engine was introduced.
- At very small Fit All scales, labels can overlap and a zoomed/panned handle may be off-screen; use Fit All or zoom in. The editor scrolls on small screens; not every allowance and result fits above a native keyboard at once.
- No Next Edge flow, custom keyboard, schema migration or geometry expansion was added.

First trial: open the sample worksheet, tap Kitchen L's interior and drag the arrow handle. Then open Bathroom 1, tap Right end, change its Overhang, and check Back run. Try a fraction shortcut, Undo, reopen the project and export a backup. Repeat on the actual tablet before field use.

