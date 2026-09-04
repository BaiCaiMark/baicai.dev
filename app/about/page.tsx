import Image from 'next/image'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('About', 'About Mark and the personal workshop behind BaiCai.', '/about')

const principles = [
  { title: 'Keep it maintainable', description: 'A small, clear site is easier to use and easier to keep improving.' },
  { title: 'Build from real needs', description: 'Tools begin with repeated tasks, then become simpler through daily use.' },
  { title: 'Improve in small steps', description: 'Useful progress matters more than waiting for everything to feel finished.' },
]

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="about-intro">
          <PageHeader eyebrow="Behind the workshop" title="Hi, I am Mark." description="BaiCai is my personal workspace for practical tools, small projects, and ideas I want to keep. It is designed to stay useful as it grows." />
          <div className="about-identity">
            <Image src="/brand/badge/baicai-watcher-a1-256.png" width={256} height={256} sizes="104px" className="about-avatar" alt="BaiCai Watcher brand emblem" />
            <div>
              <p className="section-copy">Work, experiments, and everyday learning, collected in one place.</p>
              <Link href="/contact" className="text-link">Get in touch</Link>
            </div>
          </div>
        </div>
        <section className="workspace-section" aria-labelledby="principles">
          <SectionHeader id="principles" title="Working principles" />
          <ol className="principle-list">
            {principles.map((principle, index) => (
              <li key={principle.title}>
                <span className="section-index" aria-hidden="true">0{index + 1}</span>
                <div><h3>{principle.title}</h3><p className="section-copy">{principle.description}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
