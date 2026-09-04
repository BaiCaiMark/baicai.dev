# BaiCai

A personal workshop for practical tools, ongoing projects, and notes worth keeping.
Next.js 16, React 19, TypeScript, Tailwind CSS 4, deployed through Vercel.

## Routes

- `/`: short introduction, active tools, current projects, recent notes
- `/tools`: tools grouped by category
- `/tools/a5-bridge-saw`: A5 machine conversion, unit conversion, sixteenths
- `/projects`: current project collection
- `/notes`: notes, newest first
- `/about`: introduction and working principles
- `/contact`: email contact (linked from the footer)
- `/sitemap.xml`, `/robots.txt`: generated from current site data

Scripture Helper was deliberately removed in commit `89ecb74`.
It is not an existing V2 tool; `/tools/scripture` continues to return 404.

## Editing content

`app/data/site.ts` contains site identity, navigation, contact links, tools,
projects, and notes. Home and directory pages use these same records.

To add a tool:
1. Create `app/tools/<slug>/page.tsx`.
2. Add one object to `tools` in `app/data/site.ts`.

Tool fields: `name`, `slug`, `href`, `description`, `status`, `category`,
optional `shortLabel` and `icon`. Categories: Work, Church, Personal, Utility.
Statuses: Active, Draft, Planned. Use `href: null` for a planned tool without a
page. Only active tools with a URL appear on Home. All categorized entries
appear in Tools; all defined tool URLs enter the sitemap automatically.

For an interactive tool, export page metadata from its route layout, as A5 does.
Use `pageMetadata` from `app/lib/metadata.ts` for title, description, canonical,
Open Graph, and Twitter metadata. Tool metadata can reference its central record.

Projects and notes are plain data. Notes use ISO dates and are sorted newest
first; dates display in UTC consistently. There is no CMS or database.

## Components and styles

- `NavBar` and `Footer`: site navigation, brand, and footer links
- `PageHeader`: page heading and optional actions
- `SectionHeader`: repeated section heading and optional directory link
- `ToolCard`, `ProjectCard`, `NoteList`, `StatusBadge`: shared content views
- `BrandLogo`: existing Future B mark
- `app/globals.css`: neutral dark theme, green brand accent, responsive layout

Only navigation's current-route detection and A5's interactive page require
client components. A5 calculation logic stays inside its own route.

Brand source files remain in `baicai-brand-kit/`; deployed assets are in
`public/brand/`. Future B remains the navigation/favicon/PWA identity.
A1 is a supporting emblem on About and 404, not a large homepage hero.

## Local development and validation

```sh
npm install
npm run dev
npm run lint
npm run build
npm run start
```

The default preview is `http://localhost:3000`. To use a different port:

```sh
npm run start -- -H 127.0.0.1 -p 3010
```

Before publishing, check the routes above at phone, tablet, and desktop widths.
Verify all A5 defaults, four outputs, reset, both unit-conversion directions,
and fraction limits. Keep formulas and machine constants under explicit review.

See `docs/V2-AUDIT.md` for the baseline audit, changes, and verification record.
