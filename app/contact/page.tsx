import PageHeader from '../components/PageHeader'
import { site } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Contact', 'Contact Mark at BaiCai by email.', '/contact')

export default function ContactPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="Say hello" title="Contact" description="Email is the simplest way to reach me about the site, a tool, or a project." />
        <div className="contact-details">
          <h2 className="eyebrow">Email</h2>
          <a href={`mailto:${site.email}`} className="contact-email">{site.email}</a>
          <p className="section-copy mt-4">Messages can be written in English or Chinese.</p>
        </div>
      </div>
    </section>
  )
}
