import Link from 'next/link'
import BrandLogo from './BrandLogo'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandLogo />
            <p className="mt-3 text-sm text-[var(--muted)]">&copy; 2026 baicai.dev</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--muted)]">
            <Link href="/tools" className="footer-link">Tools</Link>
            <Link href="/projects" className="footer-link">Projects</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
