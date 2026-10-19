export const site = {
  name: 'baicai.dev',
  url: 'https://baicai.dev',
  description: 'A bright, quiet corner for practical tools, notes, projects, and the ideas I want to keep.',
  email: 'baicai.exe@gmail.com',
  github: 'https://github.com/BaiCaiMark/baicai.dev',
  logo: '/theme/logo/eclipse-ring-mark-transparent-1024.png',
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
  description: 'Machine-ready millimeter values for the A5 bridge saw, plus inch, millimeter, and fraction helpers.',
  status: 'Active',
  category: 'Work',
  shortLabel: 'A5',
  icon: '/theme/icons/tools.svg',
} satisfies ToolItem

export const tools: ToolItem[] = [a5Tool]
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
    description: 'A Windows workspace for placing stone parts on slabs, matching natural veining across seams, and reviewing countertop assemblies before fabrication.',
    detail: 'Windows desktop · Stone layout / DXF · In development',
  },
  {
    name: 'Yoru',
    slug: 'yoru',
    status: 'Active',
    description: 'A self-hosted AI agent running around the clock on an fnOS NAS. It delivers system status through Telegram and supports selected, controlled NAS and Docker management tasks.',
    detail: 'fnOS NAS · OpenClaw / Telegram / Docker · Running',
  },
  {
    name: 'PDF Export Studio',
    slug: 'pdf-export-studio',
    status: 'Active',
    description: 'A portable Windows utility for converting DOCX and PPTX files to PDF and high-resolution JPG images in a straightforward workflow.',
    detail: 'Windows desktop · Document conversion · Working preview',
  },
  {
    name: 'Leica Fit Studio',
    slug: 'leica-fit-studio',
    status: 'In progress',
    description: 'An early-stage precision workspace for viewing Leica DXF measurements, fitting lines and corners, and checking dimensions for countertop drafting.',
    detail: 'Windows desktop · DXF / Measurement · Prototype',
  },
  {
    name: 'True Form Studio',
    slug: 'true-form-studio',
    status: 'In progress',
    description: 'A developing drawing-to-production workflow that turns reviewed DWG/DXF geometry into structured DXF parts for cutting and milling preparation.',
    detail: 'Windows desktop · CAD/CAM preparation · Early development',
  },
  {
    name: 'RigForge',
    slug: 'rigforge',
    status: 'In progress',
    description: 'A personal Windows maintenance and diagnostics workflow built around repeatable performance checks, troubleshooting, and careful system changes.',
    detail: 'Windows · Diagnostics / Monitoring · Personal workflow',
  },
  {
    name: 'Offline Scripture Helper',
    slug: 'offline-scripture-helper',
    status: 'Active',
    description: 'An offline scripture lookup and text-preparation utility for church presentation slides, kept local rather than hosted as a public Bible database.',
    detail: 'Local utility · Presentation preparation',
  },
  {
    name: 'baicai.dev',
    slug: 'baicai-dev',
    status: 'Active',
    description: 'This personal website and toolbox: a home for practical browser tools, project updates, notes, and experiments.',
    detail: 'Next.js / Vercel · Public website',
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
