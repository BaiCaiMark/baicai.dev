export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/tools', label: 'Tools' },
  { href: '/notes', label: 'Notes' },
  { href: '/contact', label: 'Contact' },
]

export type ToolStatus = 'Active' | 'Draft' | 'Planned'

export type ToolItem = {
  name: string
  status: ToolStatus
  href: string | null
  description: string
}

export const tools: ToolItem[] = [
  {
    name: 'A5 Bridge Saw Converter',
    status: 'Active',
    href: '/tools/a5-bridge-saw',
    description:
      'Machine-ready millimeter values for the A5 bridge saw, plus inch, millimeter, and fraction helpers.',
  },
  {
    name: 'More everyday tools',
    status: 'Planned',
    href: null,
    description: 'A reserved space for the next small browser tool that earns a regular place in the workflow.',
  },
]
