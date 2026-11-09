import Image from 'next/image'
import Link from 'next/link'
import PageHeader from './components/PageHeader'
import { site } from './data/site'

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="not-found-content">
          <Image src={site.logo} width={512} height={512} sizes="96px" className="not-found-emblem" alt="baicai.dev continuous triangular loop mark" />
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
