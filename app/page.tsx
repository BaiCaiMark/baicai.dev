import Image from 'next/image'
import Link from 'next/link'
import { tools } from './data/site'

const focusAreas = [
  {
    href: '/tools',
    index: '01',
    title: 'Useful tools',
    description: 'Fast, focused helpers for real tasks on a phone or computer.',
  },
  {
    href: '/projects',
    index: '02',
    title: 'Projects in progress',
    description: 'A clear record of what is being built and improved over time.',
  },
  {
    href: '/notes',
    index: '03',
    title: 'Notes worth keeping',
    description: 'Short observations, decisions, and lessons collected in one place.',
  },
  {
    href: '/about',
    index: '04',
    title: 'About this space',
    description: 'The principles behind a personal workspace designed to grow calmly.',
  },
]

const availableTools = tools.filter((tool) => tool.href)

export default function Home() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-heading">
        <Image
          src="/brand/badge/baicai-watcher-a1-1024.webp"
          width={1024}
          height={1024}
          className="home-hero-image"
          alt="A1 BaiCai Watcher brand emblem"
          sizes="(min-width: 900px) 620px, 100vw"
          priority
        />
        <div className="site-container">
          <div className="home-hero-copy">
            <p className="hero-kicker">Personal workspace</p>
            <h1 id="home-heading" className="hero-title">
              baicai<span>.dev</span>
            </h1>
            <p className="hero-description">
              A calm, practical home for the tools I use, the projects I build, and notes worth keeping.
            </p>
            <div className="hero-actions">
              <Link href="/tools" className="button-primary">Open tools</Link>
              <Link href="/about" className="button-secondary">About this site</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-band home-band-alt" aria-labelledby="available-tools-heading">
        <div className="site-container">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Ready to use</p>
              <h2 id="available-tools-heading" className="section-heading mt-2">Everyday tools</h2>
            </div>
            <Link href="/tools" className="text-sm font-semibold text-[var(--brand-strong)]">
              View all tools
            </Link>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {availableTools.map((tool) => (
              <Link key={tool.name} href={tool.href!} className="block no-underline">
                <article className="tool-card flex min-h-60 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="tool-card-mark">
                      <Image
                        src="/brand/logo/logo-mark-primary.svg"
                        width={28}
                        height={28}
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="status-badge" data-status={tool.status}>{tool.status}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">{tool.name}</h3>
                  <p className="section-copy mt-3">{tool.description}</p>
                  <p className="mt-auto pt-6 text-sm font-semibold text-[var(--brand-strong)]">Open tool</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-band" aria-labelledby="site-focus-heading">
        <div className="site-container">
          <p className="eyebrow">Explore</p>
          <h2 id="site-focus-heading" className="section-heading mt-2">One place, built around real use.</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {focusAreas.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-52 bg-[var(--surface)] p-6 no-underline transition-colors hover:bg-[var(--surface-muted)]"
              >
                <p className="text-sm font-semibold text-[var(--accent)]">{item.index}</p>
                <h3 className="mt-5 text-base font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="section-copy mt-3">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
