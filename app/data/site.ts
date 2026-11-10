export const site = {
  name: 'baicai.dev',
  brandName: 'baicai',
  url: 'https://baicai.dev',
  description: 'An independent creative technology studio bringing fabrication experience, thoughtful design, software, and AI experimentation together.',
  email: 'baicai.exe@gmail.com',
  github: 'https://github.com/BaiCaiMark/baicai.dev',
  logo: '/brand/identity-2026/solid-form-mark.webp',
  shareImage: '/opengraph-image',
} as const

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/notes', label: 'Notes' },
  { href: '/tools', label: 'Tools' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
] as const

export const footerLinks = [
  { href: '/contact', label: 'Contact' },
  { href: site.github, label: 'GitHub' },
] as const

export type ToolStatus = 'Active' | 'Draft' | 'Planned'
export type ToolCategory = 'Work' | 'Church' | 'Personal' | 'Utility'

export type ToolItem = {
  name: string
  slug: string
  href: `/tools/${string}` | null
  description: string
  status: ToolStatus
  category: ToolCategory
  shortLabel?: string
  icon?: string
}

export const a5Tool = {
  name: 'A5 Bridge Saw Converter',
  slug: 'a5-bridge-saw',
  href: '/tools/a5-bridge-saw',
  description: 'A quick reference for inch, fraction, and millimetre conversions used around A5 bridge-saw work. Verify values against the job before cutting.',
  status: 'Active',
  category: 'Work',
  shortLabel: 'A5',
  icon: '/theme/icons/tools.svg',
} satisfies ToolItem

export const siteMeasureTool = {
  name: 'Site Measure Studio',
  slug: 'site-measure',
  href: '/tools/site-measure',
  description: 'A mobile-first countertop measurement workspace (beta) with local projects, dimension and edge inputs, and reviewable PDF/DXF output. Confirm all field measurements before fabrication.',
  status: 'Active',
  category: 'Work',
  shortLabel: 'SM',
  icon: '/theme/icons/tools.svg',
} satisfies ToolItem

export const cadViewerTool = {
  name: 'Drawing Viewer',
  slug: 'cad-viewer',
  href: '/tools/cad-viewer',
  description: 'A lightweight, read-only viewer for DXF, DWG and PDF drawings on phones and desktops, with touch-friendly navigation.',
  status: 'Active',
  category: 'Work',
  shortLabel: 'CAD',
  icon: '/theme/icons/tools.svg',
} satisfies ToolItem

export const tools: ToolItem[] = [a5Tool, siteMeasureTool, cadViewerTool]
export const activeTools = tools.filter((tool) => tool.status === 'Active' && tool.href)
export const toolCategories: ToolCategory[] = ['Work', 'Church', 'Personal', 'Utility']

export type ProjectItem = {
  name: string
  slug: string
  status: 'Active' | 'In progress'
  description: string
  detail: string
  href?: string
}

export const projects: ProjectItem[] = [
  {
    name: 'ZOLITH Studio',
    slug: 'zolith-studio',
    status: 'In progress',
    description: 'A Windows CAD/CAM workspace for laying out countertop parts on slab images, exploring vein matching, and reviewing assemblies. DXF workflows and dual-screen review are being refined through real fabrication jobs.',
    detail: 'Windows / .NET · Slab layout · DXF · Dual-screen workspace',
  },
  {
    name: 'True Form Studio',
    slug: 'true-form-studio',
    status: 'In progress',
    description: 'Drawing-to-manufacturing preparation for stone countertops: review geometry, organise parts, and develop reliable edge, seam, backsplash and DXF export workflows. Validated step by step against real drawings.',
    detail: 'Windows · CAD geometry / DXF · Manufacturing preparation · Testing',
  },
  {
    name: 'Yoru',
    slug: 'yoru',
    status: 'Active',
    description: 'A self-hosted AI agent experiment for recurring monitoring, selective automation, and carefully scoped tasks. Designed around understandable actions and human control, not unrestricted autonomy.',
    detail: 'AI agents · Self-hosted NAS · Automation · Ongoing',
  },
  {
    name: 'Stone Image Studio',
    slug: 'stone-image-studio',
    status: 'In progress',
    description: 'Research into more consistent lighting and colour in industrial slab photography. The aim is to preserve image geometry and original files while making material photos easier to compare and use.',
    detail: 'Research / planning · Image correction · Measurement-aware workflow',
  },
  {
    name: 'Leica Fit Studio',
    slug: 'leica-fit-studio',
    status: 'In progress',
    description: 'An exploratory tool for understanding Leica measurement drawings, checking lines and corners, and turning field geometry into a clearer starting point for countertop drafting.',
    detail: 'Windows · 2DG / DXF · Measurement interpretation · Prototype',
  },
  {
    name: 'PDF Export Studio',
    slug: 'pdf-export-studio',
    status: 'Active',
    description: 'A practical Windows utility for turning DOCX and PPTX documents into PDFs and high-resolution images, built to make recurring document preparation less repetitive.',
    detail: 'Windows · Document conversion · Working utility',
  },
  {
    name: 'RigForge',
    slug: 'rigforge',
    status: 'In progress',
    description: 'A personal collection of repeatable Windows maintenance and diagnostic routines, focused on understanding a problem before changing the system.',
    detail: 'Windows · Diagnostics · Maintenance workflow',
  },
  {
    name: 'Offline Scripture Helper',
    slug: 'offline-scripture-helper',
    status: 'Active',
    description: 'A local-only reference and text-preparation helper for presentation work. It stays off the public site as an application, while its approach to practical tooling informs this workshop.',
    detail: 'Local utility · Presentation preparation',
  },
  {
    name: 'baicai',
    slug: 'baicai-dev',
    status: 'Active',
    description: 'The public home for this evolving creative-technology practice: browser tools, honest project updates, and notes from building software around real work.',
    detail: 'Next.js / React · GitHub / Vercel · Public website',
    href: site.github,
  },
]

export type NoteItem = {
  slug: string
  title: string
  date: string
  summary: string
}

export const notes: NoteItem[] = [
  {
    slug: 'a-form-that-can-change-colour',
    title: 'One form, different light',
    date: '2026-11-09',
    summary: 'The baicai identity keeps its continuous, turning triangular form while exploring warmer colours and clearer small-size applications.',
  },
  {
    slug: 'tools-shaped-by-field-work',
    title: 'Tools shaped by field work',
    date: '2026-11-08',
    summary: 'Site Measure Studio is growing from real countertop measuring habits: dimensions first, clear allowances, imperfect walls, and drawings that explain what was measured.',
  },
  {
    slug: 'drawing-viewer-on-the-phone',
    title: 'A drawing viewer that travels',
    date: '2026-11-04',
    summary: 'Bringing DXF, DWG and PDF viewing to a lightweight browser tool, with special attention to the way people pan and zoom on a phone.',
  },
  {
    slug: 'geometry-before-automation',
    title: 'Geometry before automation',
    date: '2026-11-02',
    summary: 'ZOLITH and True Form Studio keep returning to the same lesson: reliable CAD/CAM starts with correct geometry, explicit assumptions, and careful validation.',
  },
  {
    slug: 'rebuilding-the-site',
    title: 'Rebuilding the site',
    date: '2026-06-17',
    summary: 'Starting from a clean structure that stays easy to understand, maintain, and improve.',
  },
]

export const recentNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date))

export function formatNoteDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
