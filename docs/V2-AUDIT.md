# V2 audit and verification

Date: 2026-09-04. Baseline: `fbb8fa2` (Apply baicai.dev brand system).
The working tree was clean before editing. The audit covered every application
source file, configuration, public asset inventory, brand guide, sitemap,
manifest, metadata, README, and recent Git history.

## Baseline architecture

Seven content routes existed: /, /tools, /tools/a5-bridge-saw, /projects,
/notes, /about, /contact. A custom 404 was present. There were no API routes,
database, CMS, authentication, or external data requests in the tools.

Global layout used NavBar, Footer, and PageHeader. Navigation and A5 were the
client components. Tool metadata and navigation were in app/data/site.ts;
projects and notes were embedded in individual pages, contact email in markup.

The supplied request mentioned Scripture Helper, but both the route inventory
and Git history showed it was intentionally removed in commit 89ecb74 at the
owner's request. This is not a metadata omission. It has not been recreated;
the existing 404 behavior is preserved. Clarification was requested.

## Findings and decisions

- Large A1 artwork dominated the old homepage. V2 replaces that composition
  with a short identity block and immediately accessible tools.
- Home and Tools duplicated card markup. Shared ToolCard and StatusBadge now
  render the same central tool records, including category and short label.
- Projects and notes were not featured on Home. They now share central content
  with their directory pages. No fictional projects or recent notes were added.
- The generic planned tool was not a working route. Its intent remains as a
  small note on Tools, rather than being counted as a real tool.
- Navigation prioritized About before Tools. It now follows Home, Tools,
  Projects, Notes, About. Contact remains at its URL and in footer navigation.
- Phone navigation required opening a menu. Five visible links now fit across
  narrow screens with 44px touch targets and current-page indication.
- Old unlayered component CSS overrode Tailwind utilities; overflow clipping
  concealed layout errors. V2 uses CSS layers and minmax grid tracks without
  global overflow clipping.
- The sitemap only contained Home and About. Next.js metadata routes now cover
  navigation, Contact, and all real tool URLs. Canonical and social metadata
  are page-specific through a shared helper.
- Five unreferenced Next.js template SVGs were removed after a repository
  reference search. Brand assets and root favicon compatibility URLs remain.
- Existing favicon/PWA assets were retained. Manifest name/theme were aligned
  with V2, with explicit identity, scope, and a Tools start URL.
- A5 inputs were separated from their results on mobile. Each input now sits
  with its own labelled output. Every calculation, rounding precision, machine
  constant, helper default, and reset behavior is unchanged.
- A5's legacy parser treats blank input as zero through Number(''). This
  behavior is intentionally not altered by a presentation/architecture refactor;
  a future input-validation change should receive separate machine-use review.
- No runtime packages, UI libraries, fonts, CMS, or database were added.

## Resulting structure

- app/data/site.ts: site identity, navigation, contacts, typed tools, projects,
  notes, and date formatting
- app/lib/metadata.ts: common page-specific SEO and social metadata
- app/components/: shared chrome, headings, tool/project cards, notes, status
- app/tools/a5-bridge-saw/: isolated interactive tool and its metadata layout
- app/sitemap.ts and app/robots.ts: generated discovery endpoints
- app/globals.css: shared tokens and responsive layouts

## Verification

- ESLint: passed.
- Next.js production build and its TypeScript checks: passed.
- Production preview: http://127.0.0.1:3010.
- Chromium/Playwright: 35 route/viewport checks passed across 320, 430, 768,
  1440, and 1920px widths. All seven content routes tested at each width.
- Checked headings, canonical and Open Graph URLs, image decoding, document
  and element overflow, and 44px input/navigation touch targets.
- Captured and inspected Home, About, and A5 screenshots at 320px and 1440px.
- A5 defaults: 6.25, 1.25, 126.75, 63.75; outputs 224.915, 383.122, 3219.45,
  1619.25. Helpers: 1mm = 0.0394in; 11/16 = 0.6875.
- Tested all four conversions, negative and invalid input, reset, 25.4mm =
  1.0000in, 2in = 50.800mm, 16/16 = 1.0000, and invalid numerator handling.
- Compared A5's calculation/state/handler source block to baseline: identical.
- Keyboard skip link and tool-card navigation passed. Tools remains active
  in navigation on the nested A5 route.
- Verified favicon, Apple icon, social image, manifest and its three icons,
  sitemap and robots URLs. Custom 404 returns 404 with noindex.
- Scripture URL still returns 404, matching the intentional prior removal.
- No browser runtime errors on working routes.
- Screenshots and verification.json are saved in the workspace's
  outputs/baicai-v2 directory, outside the website repository.
- This pass tests Chromium, not physical iOS Safari or Android devices.

## Optional follow-up

A repository lockfile was already absent at baseline. Add a reviewed lockfile
in a dependency-maintenance change to make clean installs reproducible.
Keep Next.js/React versions and security maintenance separate from this visual
refactor. Consider real-device Safari testing and reviewed A5 input validation
before further changes to tool behavior.
