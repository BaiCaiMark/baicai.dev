import type { Metadata } from 'next'
import PageHeader from '../components/PageHeader'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Current projects and ongoing work from BaiCai.',
}

const projects = [
  {
    name: 'baicai.dev',
    status: 'Active',
    description: 'The personal site itself: a dependable home for tools, projects, notes, and contact information.',
    detail: 'Next.js / Vercel',
  },
  {
    name: 'Everyday tools',
    status: 'In progress',
    description: 'A growing set of focused browser tools, beginning with the A5 bridge saw converter.',
    detail: 'Client-side utilities',
  },
]

export default function ProjectsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader
          eyebrow="Projects"
          title="Work in progress, kept in one place."
          description="Small projects become more useful when they have a clear home, a visible purpose, and room to improve."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.name} className="content-card flex min-h-64 flex-col">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{project.name}</h2>
                <span className="status-badge" data-status={project.status}>{project.status}</span>
              </div>
              <p className="section-copy mt-5">{project.description}</p>
              <p className="mt-auto border-t border-[var(--border)] pt-5 text-sm font-medium text-[var(--muted)]">
                {project.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
