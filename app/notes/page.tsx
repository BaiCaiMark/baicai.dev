import type { Metadata } from 'next'
import PageHeader from '../components/PageHeader'

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Short notes and lessons from building baicai.dev.',
}

const notes = [
  {
    title: 'Rebuilding the site',
    date: '2026-06-17',
    displayDate: 'June 17, 2026',
    summary: 'Starting from a clean structure that stays easy to understand, maintain, and improve.',
  },
]

export default function NotesPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader
          eyebrow="Notes"
          title="Short notes from the process."
          description="Decisions, lessons, and small discoveries that are useful enough to keep."
        />

        <div className="mt-12 max-w-3xl border-t border-[var(--border)]">
          {notes.map((note) => (
            <article key={note.title} className="grid gap-4 border-b border-[var(--border)] py-8 sm:grid-cols-[150px_1fr]">
              <time dateTime={note.date} className="text-sm font-medium text-[var(--muted)]">{note.displayDate}</time>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{note.title}</h2>
                <p className="section-copy mt-3">{note.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
