'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { activeTools, navItems, notes, projects } from '../data/site'
import BrandLogo from './BrandLogo'

const searchable = [
  ...navItems.map((item) => ({ title: item.label, description: `${item.label} on baicai.dev`, href: item.href, type: 'Page' })),
  ...activeTools.flatMap((tool) => tool.href ? [{ title: tool.name, description: tool.description, href: tool.href, type: 'Tool' }] : []),
  ...projects.map((project) => ({ title: project.name, description: project.description, href: project.href, type: 'Project' })),
  ...notes.map((note) => ({ title: note.title, description: note.summary, href: `/notes#${note.slug}`, type: 'Note' })),
]

function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('baicai-theme-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('baicai-theme-change', callback)
  }
}

function getThemeSnapshot() {
  return localStorage.getItem('baicai-theme') === 'dark'
}

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false)
  const searchInput = useRef<HTMLInputElement>(null)
  const searchDialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    const dialog = searchDialog.current
    if (!dialog) return
    if (searchOpen && !dialog.open) {
      dialog.showModal()
      searchInput.current?.focus()
    } else if (!searchOpen && dialog.open) {
      dialog.close()
    }
  }, [searchOpen])

  const results = searchable.filter((item) => `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(query.trim().toLowerCase()))

  function toggleTheme() {
    const next = !dark
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    localStorage.setItem('baicai-theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event('baicai-theme-change'))
  }

  return (
    <>
      <header className="site-header">
        <div className="site-container header-inner">
          <BrandLogo />
          <nav id="mobile-navigation" className="primary-nav" aria-label="Primary navigation" data-open={menuOpen}>
            {navItems.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)
              return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className="nav-link" onClick={() => setMenuOpen(false)}>{item.label}</Link>
            })}
          </nav>
          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="Search the site" onClick={() => { setQuery(''); setSearchOpen(true); setMenuOpen(false) }}>
              <Image src="/theme/icons/search.svg" width={20} height={20} alt="" aria-hidden="true" />
            </button>
            <button type="button" className="icon-button theme-button" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
              <Image src="/theme/icons/moon.svg" width={20} height={20} alt="" aria-hidden="true" />
            </button>
            <button type="button" className="menu-button" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
              <span className="menu-lines" aria-hidden="true"><span /><span /><span /></span>
              <span>{menuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>
      <dialog ref={searchDialog} className="search-panel" aria-label="Search baicai.dev" onClose={() => setSearchOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
            <div className="search-heading"><h2>Search</h2><button type="button" className="search-close" onClick={() => setSearchOpen(false)}>Close</button></div>
            <label htmlFor="site-search" className="sr-only">Search tools, notes, projects, and pages</label>
            <input ref={searchInput} id="site-search" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setSearchOpen(false) } }} placeholder="Search tools, notes, projects…" className="search-input" />
            <div className="search-results" aria-live="polite">
              {results.length ? results.map((item) => <Link key={`${item.type}-${item.href}`} href={item.href} className="search-result" onClick={() => setSearchOpen(false)}><span className="search-result-type">{item.type}</span><strong>{item.title}</strong><span>{item.description}</span></Link>) : <p className="section-copy">No results found.</p>}
            </div>
      </dialog>
    </>
  )
}
