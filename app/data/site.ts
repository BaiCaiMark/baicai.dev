export const site = {
  name: 'BaiCai',
  url: 'https://baicai.dev',
  description: 'A personal workshop for practical tools, ongoing projects, and notes worth keeping.',
  email: 'baicai.exe@gmail.com',
  github: 'https://github.com/BaiCaiMark/baicai.dev',
  logo: '/brand/logo/logo-mark-primary.svg',
  shareImage: '/brand/social/og-brand-card-1200x630.png',
} as const

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/projects', label: 'Projects' },
  { href: '/notes', label: 'Notes' },
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
} satisfies ToolItem

export const tools: ToolItem[] = [a5Tool]
export const activeTools = tools.filter((tool) => tool.status === 'Active' && tool.href)
export const toolCategories: ToolCategory[] = ['Work', 'Church', 'Personal', 'Utility']

export type ProjectItem = {
  name: string
  status: 'Active' | 'In progress'
  description: string
  detail: string
  href: string
}

export const projects: ProjectItem[] = [
  {
    name: 'baicai.dev',
    status: 'Active',
    description: 'The personal site itself: a dependable home for tools, projects, notes, and contact information.',
    detail: 'Next.js / Vercel',
    href: site.github,
  },
  {
    name: 'Everyday tools',
    status: 'In progress',
    description: 'A growing set of focused browser tools, beginning with the A5 bridge saw converter.',
    detail: 'Client-side utilities',
    href: '/tools',
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
