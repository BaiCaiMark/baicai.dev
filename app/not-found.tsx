import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">Page not found</h1>
      <p className="mt-4 text-gray-700">Sorry, we couldn’t find what you were looking for.</p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Go Home
        </Link>
      </div>
    </section>
  )
}
