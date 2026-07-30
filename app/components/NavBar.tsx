'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { navItems } from '../data/site'
import BrandLogo from './BrandLogo'

function isCurrentPath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="site-container">
        <nav className="flex h-16 items-center justify-between" aria-label="Primary navigation">
          <BrandLogo className="min-h-11" />

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isCurrentPath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link ${
                    active
                      ? 'nav-link-active'
                      : ''
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <button
            type="button"
            className="nav-menu-button flex md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0.5 h-0.5 w-5 bg-current transition-transform ${
                  menuOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`absolute bottom-0.5 left-0 h-0.5 w-5 bg-current transition-transform ${
                  menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </nav>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="mobile-navigation md:hidden">
          <div className="site-container grid grid-cols-2 gap-2 py-4">
            {navItems.map((item) => {
              const active = isCurrentPath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`mobile-nav-link ${
                    active
                      ? 'mobile-nav-link-active'
                      : ''
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </header>
  )
}
