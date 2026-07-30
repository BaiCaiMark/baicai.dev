import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import { tools } from '../data/site'

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Small, focused browser tools from BaiCai.',
}

export default function ToolsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader
          eyebrow="Tools"
          title="Small tools for repeated tasks."
          description="Focused browser utilities that are quick to open, comfortable on a phone, and useful without extra setup."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const card = (
              <article className="tool-card flex min-h-64 flex-col">
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
                <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">{tool.name}</h2>
                <p className="section-copy mt-3">{tool.description}</p>
                {tool.href ? (
                  <p className="mt-auto pt-6 text-sm font-semibold text-[var(--brand-strong)]">Open tool</p>
                ) : (
                  <p className="mt-auto pt-6 text-sm font-medium text-[var(--muted)]">Planned</p>
                )}
              </article>
            )

            return tool.href ? (
              <Link key={tool.name} href={tool.href} className="block no-underline">
                {card}
              </Link>
            ) : (
              <div key={tool.name}>{card}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
