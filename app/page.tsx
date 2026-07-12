import Image from 'next/image'
import Link from 'next/link'
import { tools } from './data/site'

const focusAreas = [
  {
    title: 'Useful tools',
    description: 'Fast, focused helpers for real tasks on a phone or computer.',
  },
  {
    title: 'Projects in progress',
    description: 'A clear record of what is being built and improved over time.',
  },
  {
    title: 'Notes worth keeping',
    description: 'Short observations, decisions, and lessons collected in one place.',
  },
]

const availableTools = tools.filter((tool) => tool.href)

export default function Home() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-white shadow-sm">
              <Image src="/favicon.svg" width={54} height={54} alt="Mark personal logo" priority />
            </span>
            <p className="eyebrow">Personal workspace</p>
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-none text-[var(--foreground)] sm:text-6xl">BaiCai</h1>
          <p className="page-description max-w-2xl">
            A calm, practical home for the tools I use, the projects I build, and notes worth keeping.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tools" className="button-primary">Open tools</Link>
            <Link href="/about" className="button-secondary">About this site</Link>
          </div>
        </div>

        <section className="mt-16" aria-labelledby="available-tools-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Ready to use</p>
              <h2 id="available-tools-heading" className="section-heading mt-2">Everyday tools</h2>
            </div>
            <Link href="/tools" className="text-sm font-semibold text-[var(--brand-strong)]">View all tools</Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {availableTools.map((tool) => (
              <Link key={tool.name} href={tool.href!} className="block no-underline">
                <article className="tool-card flex flex-col">
                  <span className="status-badge" data-status={tool.status}>{tool.status}</span>
                  <h3 className="mt-5 text-xl font-semibold text-[var(--foreground)]">{tool.name}</h3>
                  <p className="section-copy mt-3">{tool.description}</p>
                  <p className="mt-6 text-sm font-semibold text-[var(--brand-strong)]">Open tool -&gt;</p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20 border-t border-[var(--border)] pt-10" aria-labelledby="site-focus-heading">
          <h2 id="site-focus-heading" className="section-heading">One place, three clear purposes</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {focusAreas.map((item, index) => (
              <div key={item.title}>
                <p className="text-sm font-semibold text-[var(--brand)]">0{index + 1}</p>
                <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="section-copy mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
