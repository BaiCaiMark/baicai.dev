# Site Measure Studio — Preview 2

Canvas-first worksheet redesign, authorized 2026-10-31. Branch: feat/site-measure-v0.2-canvas. V0.1 baseline: f43c47b. No main merge, production deployment/configuration change, or maintenance automation is authorized.

## Try it

Open /tools/site-measure and choose **Try sample Kitchen**. Kitchen contains **Kitchen L**, **Stove Left**, and **Island** on one worksheet.

1. Tap the actual back line of Kitchen L: enter the finished run measurement and choose Done.
2. Tap its right end: this controls the right end depth, not the overall height.
3. Tap the inside horizontal run: it is derived. Its relationship is explained; add a **Reference measurement** instead of changing other dimensions.
4. Enter **12 + 24 3/4 + 1 1/2** and a description. The result is 38.25 inch, marked reference-only; it never constrains the part.
5. Add an edge note or select the part name for part notes, Sink Center/Cooktop and settings.
6. **Arrange parts** explicitly enables visual dragging; use Fit All afterward. Layout is not a site survey.
7. Download a Backup and use Export PDF / Export DXF.

New parts start with unknown measurements and allowances. Dashed template guides are clearly incomplete / not to scale. Tap an edge to enter its reading. Cabinet mode offers named-edge allowances and an explicit action to set remaining blank allowances to zero. No door thickness is added. Direct finished mode remains available in Part settings.

## Changes and preserved behavior

- English application controls and messages; user-entered Chinese names/notes remain intact.
- Actual edge hit targets and visible selection, compact contextual editor, immediate updates, Done.
- No W/H/A/B or E1–E6 in the normal worksheet. Edge identities remain internal.
- Metadata uses progressive disclosure: Details, Mark estimate, Needs Check, Field checked, Set unknown. Field checked is not manufacturing approval.
- No fraction dropdown. Decimal/fraction/mixed-fraction typing remains; Space and / keys assist decimal tablet keyboards. Their reserved space avoids button movement when focus changes.
- Side-by-side worksheet cards with dimension lines, stable two-column layout, three-part sample, optional visual placement.
- Independent part/edge measurements and notes persist, undo/redo, reopen, import/export and appear in PDF / DXF annotation rows.
- The existing geometry solver, measurement origins, unknown values, unit conversion, default snapshots, direct-vs-cabinet conflict checks, autosave/recovery and PDF/DXF adapters remain in use. There is no new rendering/CAD dependency.
- Sink Center/Cooktop references still distinguish an X-only line from a fully measured point; never a cutout.
- Part settings preserve rotation/mirroring, alternate dimension sets and part removal with Undo.

## Edge mapping and safety

Rectangle back/front lines control length; left/right lines control depth.

L-shape:
- Back run → overall width.
- Left back run → overall height.
- Right end → horizontal leg depth.
- Lower end → vertical leg width.
- Inside horizontal/vertical runs are derived, not independently editable constraints.

Mappings stay attached to original template edges through rotation/reflection. The editor shows the selected run and explains derived relationships. Overhangs move a specified edge outward and can change neighboring run lengths; the finished length comes from the existing solver. Cabinet composition lists the actual end allowances; it never silently picks an end.

A reference measurement is a Quantity plus an optional description and edge association. Addition expressions use the existing length parser for each term (maximum 12); no evaluation of arbitrary expressions. Entered values and source/status remain distinct from the calculated total. Invalid reference expressions stay recoverable but have no valid total; they never invalidate or alter the independently defined outline.

Part and edge notes use a small discriminated record union, not a CAD constraint graph. Free-position annotations and cross-part geometric constraints are deferred.

Canvas template guide geometry is isolated from exports. Unknown/incompatible input never becomes a final outline in DXF. PDF may retain incomplete information with warnings.

## Schema compatibility

The portable project schema is now **2**, adding fieldRecords and optional worksheet layout positions. Existing **schema 1** files and IndexedDB projects are parsed into a new schema-2 object, preserving all original dimensions, input units, origins, statuses, allowances, references and notes.

The database name/tables remain unchanged; there is no destructive migration. Reading does not rewrite the old record. The next successful save atomically stores schema 2 and retains the previous saved record for recovery. Imports still create a new project ID.

New schema-2 backups are not intended for the old V0.1 application. Unknown future schema versions fail visibly instead of stripping fields. A real sample backup from V0.1 is checked into tests/site-measure/fixtures/v01-project.json; it contains sample data only.

## Validation

Commands from C:\BaiCai\Codex\Web For BaiCai\site:

```powershell
npm run test:site-measure
npx tsc --noEmit
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 3013
$env:SM_BASE_URL = 'http://127.0.0.1:3013'
npm run test:site-measure:browser
```

Verified locally:
- **66** core/model/storage/export tests pass, including the original geometry regressions and focused mapping, reference-expression independence, visual-layout separation, v1 backup migration, existing IndexedDB upgrade, annotation export and duplicate-ID tests.
- **14** Chrome workflows pass against the compiled server: actual touch-line selection and focus, cabinet/allowance composition, exports/backup/import, L mapping and fractions, independent derived-edge checks, metadata disclosure, presets/basis/incomplete protection, arrangement/zoom, two-finger input, v1 reopen, failed save/retry, stale-tab prevention, X-only sink, complete browser close/reopen, responsive worksheets and A5/navigation.
- Responsive browser captures: 1366×900, 1024×768, 768×1024 and 390×844.
- PDF reopens with independent pypdf; rendered pages inspected with PyMuPDF. Reference equation, descriptive edge association, field note and Chinese content retained.
- DXF independently parsed with dxf-parser, including editable closed millimeter outlines and the 1524 × 571.5 mm vanity; independent readings stay on annotation layers.
- No sample measurement sentinel observed in outgoing local request bodies.
- TypeScript, ESLint and optimized Next.js build pass.

Evidence stays in ignored artifacts/site-measure/. No new scheduled automation or workflow was added. ESLint now explicitly ignores local validation artifacts and the local Python QA environment.

## Known limits and next acceptance

- Real Android/Huawei, stylus/palm rejection, soft keyboard behavior and on-site speed remain pending. Desktop Chrome/CDP is not hardware acceptance.
- AutoCAD reopen/edit/measure/Unicode and any manufacturing/CNC acceptance remain pending.
- Vercel previews retain existing login protection. Build/HTTP verification and actual remote browser verification must be reported separately.
- PDF still includes bilingual standard explanatory text and supports Chinese notes; the application UI is English.
- Very long notes paginate. Worksheet summaries show an excerpt; the contextual editor and exports preserve full text.
- Free-position notes, all-area overview, non-orthogonal geometry, arbitrary DXF import, PWA/offline caching and cloud sync remain deferred.
- Portable imports remain bounded to 5 MB, 200 parts per project, 60 per area; field records are capped at 80 per part.
- The same origin is required for local projects. Back up explicitly when moving from one Preview domain to another.

Next: owner tries actual edge entry, two derived-edge checks and a three-part Kitchen on the Huawei tablet, then verifies PDF-only factory handoff and the DXF in AutoCAD. Iterate from observed tap/keyboard friction.
