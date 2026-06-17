const projects = [
  {
    name: 'baicai.dev',
    status: 'In progress',
    description: 'A clean personal site rebuilt from a simple Next.js foundation.',
  },
  {
    name: 'Next project',
    status: 'Planning',
    description: 'A place reserved for the next useful tool, experiment, or public build.',
  },
]

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Projects</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Things I am building.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
        This page will collect small projects, experiments, and useful tools as they become ready to share.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article key={project.name} className="rounded-md border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-950">{project.name}</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {project.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">{project.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
