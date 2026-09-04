'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from '../data/site'
import BrandLogo from './BrandLogo'

export default function NavBar() {
  const pathname = usePathname()
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <BrandLogo />
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className="nav-link">
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
