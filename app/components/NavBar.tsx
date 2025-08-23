'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white/80 backdrop-blur shadow-sm' : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold text-gray-900 hover:text-gray-700">
            baicai.dev
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/about" className="text-sm text-gray-700 hover:text-gray-900">
              About
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
