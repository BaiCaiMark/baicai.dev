const notes = [
  {
    title: 'Rebuilding the site',
    date: '2026-06-17',
    summary: 'Starting again from a clean, simple structure that is easy to maintain.',
  },
]

export default function NotesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Notes</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Short notes from the process.</h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        This section is for lightweight updates, lessons, and ideas worth keeping.
      </p>

      <div className="mt-12 space-y-6">
        {notes.map((note) => (
          <article key={note.title} className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">{note.date}</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-950">{note.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">{note.summary}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
