import Link from 'next/link'

const focusAreas = [
  'Learning in public',
  'Small useful projects',
  'Notes from building',
]

export default function Home() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16 sm:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">baicai.dev</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
          A simple home for what I am learning and building.
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          I am rebuilding this site from a clean base: fewer distractions, clearer pages,
          and a practical place to collect projects, notes, and progress.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="inline-flex rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            View projects
          </Link>
          <Link
            href="/about"
            className="inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
          >
            About me
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {focusAreas.map((item) => (
          <div key={item} className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-gray-950">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              A lightweight section that can grow as the site gets more real content.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
