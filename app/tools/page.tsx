const toolIdeas = [
  {
    name: 'Quick HTML tool',
    status: 'Ready for first tool',
    description: 'A place to add small single-page HTML and JavaScript utilities you use often.',
  },
  {
    name: 'Converters',
    status: 'Planned',
    description: 'Small helpers for formatting, converting, cleaning, or generating everyday text and data.',
  },
  {
    name: 'Work shortcuts',
    status: 'Planned',
    description: 'Fast browser-based tools for repeat tasks that should not need a full app.',
  },
]

export default function ToolsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Tools</p>
      <div className="mt-4 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-950">Small tools I use often.</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          This page is for lightweight web tools built with HTML and JavaScript. Keep them simple,
          fast, and easy to open from a phone or desktop browser.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {toolIdeas.map((tool) => (
          <article key={tool.name} className="rounded-md border border-gray-200 p-6">
            <div className="flex flex-col gap-3">
              <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {tool.status}
              </span>
              <h2 className="text-xl font-semibold text-gray-950">{tool.name}</h2>
              <p className="text-sm leading-6 text-gray-600">{tool.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-md border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-950">How this section can grow</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Each tool can become its own page under <code className="rounded bg-white px-1.5 py-0.5">/tools</code>,
          for example <code className="rounded bg-white px-1.5 py-0.5">/tools/text-cleaner</code> or
          <code className="rounded bg-white px-1.5 py-0.5"> /tools/calculator</code>.
        </p>
      </div>
    </section>
  )
}
