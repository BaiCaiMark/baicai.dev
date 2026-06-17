'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/tools', label: 'Tools' },
  { href: '/notes', label: 'Notes' },
  { href: '/contact', label: 'Contact' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-100 transition-all duration-200 ${
        scrolled ? 'bg-white/85 backdrop-blur shadow-sm' : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex min-h-14 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-semibold text-gray-950 hover:text-gray-700">
            baicai.dev
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-gray-950">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}
