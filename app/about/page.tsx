import type { Metadata } from 'next'
import Image from 'next/image'
import PageHeader from '../components/PageHeader'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Mark and the purpose behind baicai.dev.',
}

const principles = [
  {
    title: 'Keep it maintainable',
    description: 'A small, clear site is easier to use and easier to keep improving.',
  },
  {
    title: 'Build from real needs',
    description: 'Tools begin with repeated tasks, then become simpler through daily use.',
  },
  {
    title: 'Improve in small steps',
    description: 'Useful progress matters more than waiting for everything to feel finished.',
  },
]

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)]">
          <div>
            <PageHeader
              eyebrow="About"
              title="Hi, I am Mark."
              description="BaiCai is my personal workspace for practical tools, small projects, and ideas I want to keep. It is designed to stay useful as it grows."
            />
          </div>
          <Image
            src="/brand/badge/baicai-watcher-a1-1024.webp"
            width={1024}
            height={1024}
            className="feature-image justify-self-center lg:justify-self-end"
            alt="A1 BaiCai Watcher emblem"
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 520px, 100vw"
            priority
          />
        </div>

        <section className="mt-16 border-t border-[var(--border)] pt-10" aria-labelledby="principles-heading">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Working principles</p>
              <h2 id="principles-heading" className="section-heading mt-2">
                Simple enough to return to often.
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-1">
            {principles.map((principle, index) => (
              <div key={principle.title} className="grid gap-3 sm:block lg:grid lg:grid-cols-[48px_1fr]">
                <p className="text-sm font-semibold text-[var(--accent)]">0{index + 1}</p>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{principle.title}</h3>
                  <p className="section-copy mt-2">{principle.description}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
