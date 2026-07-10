import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="site-container py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">BaiCai</p>
            <p className="mt-1 text-sm text-[var(--muted)]">&copy; 2026 baicai.dev</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--muted)]">
            <Link href="/tools" className="hover:text-[var(--brand-strong)]">Tools</Link>
            <Link href="/projects" className="hover:text-[var(--brand-strong)]">Projects</Link>
            <Link href="/contact" className="hover:text-[var(--brand-strong)]">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
