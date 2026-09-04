import Image from 'next/image'
import Link from 'next/link'
import PageHeader from './components/PageHeader'

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="not-found-content">
          <Image src="/brand/badge/baicai-watcher-a1-256.png" width={256} height={256} sizes="96px" className="not-found-emblem" alt="BaiCai Watcher brand emblem" />
          <PageHeader eyebrow="404" title="Page not found." description="The page may have moved, or the address may be incomplete." />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="button-secondary">Go home</Link>
            <Link href="/tools" className="button-primary">Open tools</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
