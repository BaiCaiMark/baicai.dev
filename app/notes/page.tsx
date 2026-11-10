import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import NoteList from '../components/NoteList'
import { recentNotes } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Notes', 'Field notes on building baicai tools, CAD/CAM workflows, and a creative technology studio.', '/notes')

export default function NotesPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="Worth keeping" title="Notes" description="A running record of design choices, field-tested ideas, and lessons from turning practical work into software." />
        <section className="workspace-section" aria-labelledby="all-notes">
          <SectionHeader id="all-notes" title="Notebook" />
          <NoteList notes={recentNotes} />
        </section>
      </div>
    </section>
  )
}
