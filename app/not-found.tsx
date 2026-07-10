import Link from 'next/link'
import PageHeader from './components/PageHeader'

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader
          eyebrow="404"
          title="Page not found."
          description="The page may have moved, or the address may be incomplete."
        />
        <div className="mt-8">
          <Link href="/" className="button-primary">Go home</Link>
        </div>
      </div>
    </section>
  )
}
