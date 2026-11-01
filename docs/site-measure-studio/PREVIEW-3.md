# Site Measure Studio — Preview 3

Unified canvas and direct Part interaction, authorized 2026-11-01. Baseline `c518db3`, existing branch `feat/site-measure-v0.2-canvas`. Preview only; no main merge, production release or Vercel protection change.

## Try it

Open `/tools/site-measure` at the **existing branch Preview URL** and select **Try sample Kitchen** (or Project → Open sample worksheet). Kitchen L, Stove Left and Island now live directly on one continuous drawing canvas.

1. Tap inside a Part to select its geometry. The highlighted Part has an immediately accessible toolbar: **Edit, Move, Mirror, Rotate, Duplicate, Delete**. The Part strip also selects Parts when their geometry overlaps.
2. Choose **Move**, drag the selected Part, then **Done moving**. Only its worksheet translation changes. Drag blank space to pan; use two fingers to pan/zoom or the zoom buttons. Moving ends with one undoable action at pointer release; a cancelled pointer or a second touch abandons the uncommitted drag.
3. Tap the actual edge → enter its reading → **Done**. This still identifies the original template edge after moving, mirroring and rotating. The two derived L edges remain reference-only checks, never independent constraints.
4. **Mirror** and **Rotate** use the existing quarter-turn/template transforms. Measurement values, allowances, provenance and reference inputs stay attached to the Part.
5. **Duplicate** creates an independently editable copy nearby, with a unique Part name/ID and new IDs for every reference and field record. The original readings and notes stay intact.
6. **Delete** shows an inline confirmation before removal. **Cancel deletion** keeps the Part. Confirm with **Delete part**, then use the project toolbar **Undo** to restore all readings and notes. Redo is supported.
7. **Fit All** frames all Part outlines together, including moved/rotated Parts. It does not modify measurements or layout data. Save and reopen, or Backup / Import, to verify the independent placements.

Edit opens the existing notes, references and Part settings panel. Direct edge measurement stays the quickest dimension entry path. Field-note/check presence appears with the Part caption; full notes/readings stay in Edit and exports. No W/H/A/B or E1–E6 controls were introduced.

## Geometry, layout and compatibility

- One SVG coordinate system and **one constant scale per Area**. Complete Parts keep their actual relative measurement sizes, unlike Preview 2's independently scaled 640×490 cards. There are no per-Part worksheet card rectangles.
- View-only `worksheetPart` maps the existing calculated geometry through its existing rotation/mirror and normalizes the visual bounds. All Parts use the same 0.2 worksheet-unit/mm display factor. A worksheet unit is not a surveyed room coordinate.
- Existing schema **2** and `shape.layout: {x,y}` are reused unchanged. Saved Preview 2 translations are kept; their old card-based presentation is replaced by the common-scale geometry. No destructive database or backup migration was introduced. Missing layout positions receive deterministic, size-aware display defaults; this does not write measurement data or fill unknown inputs.
- V0.1/schema-1 reads continue through the existing lossless schema-2 parser. IndexedDB names/tables, autosave/recovery, write-conflict protection, backup/import and the model's bounds/limits remain unchanged.
- Only dragging uses `layout`. Neither the solver nor the PDF/DXF adapters read it. This preserves cabinet/finished dimensions, overhangs, references, constraints and exported Part geometry. Rotation/mirror retain their pre-existing export behavior; layout does not become a DXF transform or cross-Part distance.
- Unknown/incompatible dimensions still render a clearly marked dashed template guide and stay excluded from final DXF outlines. A common display does not turn an unknown template into measured geometry.
- Browser pointer capture separates tap, Move and blank-space pan. Two-finger input cancels a pending Part drag. Pinch anchors use the SVG's inverse screen transform, including letterboxing after editor/viewport resizing.
- The compact toolbar occupies its own row above the drawing, avoiding the measured lines and geometry. Touch targets remain at least 44 CSS px. Desktop/tablet/phone layouts were checked without introducing a new UI or CAD dependency.

## Validation

From `C:\BaiCai\Codex\Web For BaiCai\site`:

```powershell
npm run test:site-measure
npx tsc --noEmit
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 3014
$env:SM_BASE_URL = 'http://127.0.0.1:3014'
npm run test:site-measure:browser
```

- **72 core/model/storage/export tests**: all existing 66, plus common-scale geometry through every rotation/reflection, legacy layout preservation, duplicate identity/deep-copy independence, exported DXF contour/PDF-row invariance after moving, action Undo/Redo and IndexedDB/backup round trips.
- **19 Chrome workflows**: all 14 previous workflows adapted only for the explicit Move control, plus direct interior selection and all Part actions, independent copy editing, transformed edge/derived-edge mapping, multiple action Undo/Redo, placement reload, creating/arranging three unknown Parts, touch cancellation, pinch/blank-space pan, stable pinch anchoring after editor resize, and responsive contextual controls.
- Captures at **1366×900, 1024×768, 768×1024 and 390×844**. The unified drawing and selected-Part controls were visually reviewed. No horizontal page overflow was observed.
- The production-compiled local server was used for browser checks. TypeScript, ESLint and the optimized Next.js production build passed. Building locally does not deploy production.
- A moved-layout PDF reopens with independent **pypdf** and renders with **PyMuPDF**: six pages, retaining Kitchen L / Stove Left / Island, the 38.25-inch reference check and wall note. PDF page layout remains the existing structured field report.
- DXF is independently parsed with **dxf-parser**. Native closed millimeter outlines before/after layout movement compare unchanged; the existing browser PDF/DXF download and 1524×571.5 mm vanity checks also pass.
- Existing A5 outputs/reset/navigation, unknown-value rejection, failed-save recovery, stale-tab protection, X-only sink and actual Chrome close/reopen are covered by the retained suite.

Ignored evidence remains under `artifacts/site-measure/`: `browser-results.json`, `preview3-canvas-*.png`, `p3-*.json`, `preview3-layout.pdf`, `preview3-layout.dxf`, `preview3-pdf-validation.json` and `preview3-deployment.json` (deployment handoff).

## Known limitations

- **No actual Android/Huawei hardware validation**. Chrome/CDP touch simulation does not validate stylus, palm rejection, a tablet soft keyboard or on-site speed.
- Fit All can make labels small with many Parts or a phone viewport. Zoom/pan and the Part strip remain available. Operators may overlap Parts and labels manually; advanced collision avoidance, snapping and automatic room recognition are deferred.
- A newly duplicated Part is offset near its original, not automatically nested or collision-resolved. Visual placement retains schema 2's ±10,000 worksheet-unit bounds.
- PDF/DXF retain the existing per-Part/report arrangement; they do not export the new screen layout as surveyed room coordinates. This iteration focuses on canvas interaction and preserves existing export dimensions.
- Only the existing rectangle/L templates and 90° rotations are supported. No new shape types, boolean joining, cross-Part constraints, templates, sink/overhang redesign or CAD snapping were added.
- Real AutoCAD reopen/edit/measure and manufacturing acceptance remain pending.
- Projects remain local to their browser origin. Continue using the existing stable branch URL to keep existing IndexedDB projects; switching to an immutable deployment hostname is a different origin. Back up before changing origins.
- Existing Vercel protection settings are preserved; remote deployment readiness, HTTP/browser verification and hardware acceptance are reported separately.
