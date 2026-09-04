import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import NoteList from '../components/NoteList'
import { recentNotes } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Notes', 'Short notes and lessons from building baicai.dev.', '/notes')

export default function NotesPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="Worth keeping" title="Notes" description="Decisions, lessons, and small discoveries collected along the way." />
        <section className="workspace-section" aria-labelledby="all-notes">
          <SectionHeader id="all-notes" title="Notebook" />
          <NoteList notes={recentNotes} />
        </section>
      </div>
    </section>
  )
}
