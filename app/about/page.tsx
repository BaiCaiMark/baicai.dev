const principles = [
  'Keep the site simple enough to maintain.',
  'Publish small updates instead of waiting for perfect work.',
  'Use the site as a record of learning, projects, and experiments.',
]

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">About</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Hi, I am Mark.</h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        This is my personal space for learning in public and building iteratively.
        The goal is not to make a complicated website. The goal is to make a useful
        home base that I can actually keep improving.
      </p>

      <div className="mt-12 space-y-5">
        {principles.map((principle) => (
          <div key={principle} className="border-l-2 border-gray-950 pl-4">
            <p className="text-gray-700">{principle}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
