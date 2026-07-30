import Image from 'next/image'
import Link from 'next/link'
import PageHeader from './components/PageHeader'

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="not-found-grid">
          <div>
            <PageHeader
              eyebrow="404"
              title="Page not found."
              description="The page may have moved, or the address may be incomplete."
            />
            <div className="mt-8">
              <Link href="/" className="button-primary">Go home</Link>
            </div>
          </div>
          <Image
            src="/brand/badge/baicai-watcher-a1-512.png"
            width={512}
            height={512}
            className="feature-image justify-self-center"
            alt="A1 BaiCai Watcher emblem"
            sizes="(min-width: 900px) 440px, 80vw"
          />
        </div>
      </div>
    </section>
  )
}
