import { formatNoteDate, type NoteItem } from '../data/site'

export default function NoteList({ notes }: { notes: NoteItem[] }) {
  return (
    <div className="note-list">
      {notes.map((note) => (
        <article className="note-row" id={note.slug} key={note.slug}>
          <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
          <div>
            <h3>{note.title}</h3>
            <p className="section-copy">{note.summary}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
