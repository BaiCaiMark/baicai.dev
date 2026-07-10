'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { navItems } from '../data/site'

function isCurrentPath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgb(248_250_249_/_94%)] backdrop-blur-md">
      <div className="site-container">
        <nav className="flex h-16 items-center justify-between" aria-label="Primary navigation">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 font-semibold text-[var(--foreground)] no-underline"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-white">
              <Image src="/favicon.svg" width={34} height={34} alt="" priority />
            </span>
            <span>BaiCai</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isCurrentPath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors ${
                    active
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                      : 'text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md border border-[var(--border-strong)] bg-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0.5 h-0.5 w-5 bg-[var(--foreground)] transition-transform ${
                  menuOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 bg-[var(--foreground)] transition-opacity ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`absolute bottom-0.5 left-0 h-0.5 w-5 bg-[var(--foreground)] transition-transform ${
                  menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </nav>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <div className="site-container grid grid-cols-2 gap-2 py-4">
            {navItems.map((item) => {
              const active = isCurrentPath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-11 items-center rounded-md px-3 text-sm font-semibold no-underline ${
                    active
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                      : 'bg-white text-[var(--muted)]'
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
