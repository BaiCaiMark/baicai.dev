import type { Metadata } from 'next'
import PageHeader from '../components/PageHeader'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Mark at BaiCai.',
}

export default function ContactPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader
          eyebrow="Contact"
          title="Get in touch."
          description="Email is the simplest way to reach me about the site, a tool, or a project."
        />

        <div className="content-card mt-12 max-w-2xl">
          <p className="eyebrow">Email</p>
          <a
            href="mailto:baicai.exe@gmail.com"
            className="mt-4 block text-xl font-semibold text-[var(--brand-strong)] sm:text-2xl"
          >
            baicai.exe@gmail.com
          </a>
          <p className="section-copy mt-4">Messages can be written in English or Chinese.</p>
        </div>
      </div>
    </section>
  )
}
