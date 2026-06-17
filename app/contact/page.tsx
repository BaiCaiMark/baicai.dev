export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Contact</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Get in touch.</h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        The simplest way to reach me is by email. More links can be added here later
        when the site grows.
      </p>

      <div className="mt-10 rounded-md border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-500">Email</p>
        <a
          href="mailto:baicai.exe@gmail.com"
          className="mt-2 inline-block text-lg font-semibold text-gray-950 hover:text-gray-700"
        >
          baicai.exe@gmail.com
        </a>
      </div>
    </section>
  )
}
