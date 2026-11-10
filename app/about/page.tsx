import Image from 'next/image'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import { site } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata(
  'About',
  'Meet Mark, the stone-fabrication professional exploring CAD/CAM, useful software, design, and AI through baicai.',
  '/about',
)

const principles = [
  {
    title: 'Start with real constraints',
    description: 'A dimension, a cutout, a machine limit, or an awkward on-site measurement is often a better starting point than a feature list.',
  },
  {
    title: 'Make precision understandable',
    description: 'Good tools should show what was measured, what was assumed, and what still needs checking. A confident-looking drawing is not the same as a verified one.',
  },
  {
    title: 'Remove friction, not judgment',
    description: 'Automation should reduce repetition while keeping important decisions, geometry checks, and production responsibility with people.',
  },
  {
    title: 'Stay curious and iterate',
    description: 'AI, 3D, web development, and new workflows are worth exploring when they help turn unfamiliar possibilities into something genuinely useful.',
  },
]

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <div className="about-intro">
          <PageHeader
            eyebrow="Behind baicai"
            title="Hi, I'm Mark."
            description="My background is in stone countertop fabrication, CAD/CAM and CNC production. baicai is my independent creative technology studio — a place where practical engineering experience meets design, software and AI."
          />
          <div className="about-identity">
            <Image src={site.logo} width={512} height={512} sizes="104px" className="about-avatar" alt="baicai continuous triangular ribbon mark" />
            <div>
              <p className="section-copy">
                I build small tools and larger experiments around questions that come up in real work: can this be more precise, easier to understand, or simply less repetitive?
              </p>
              <Link href="/projects" className="text-link">See the current projects <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>

        <section className="workspace-section" aria-labelledby="current-focus">
          <SectionHeader id="current-focus" title="What I'm building" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="content-card">
              <h3 className="text-xl font-semibold">Tools for real workflows</h3>
              <p className="section-copy mt-3">
                From <Link href="/tools/site-measure" className="underline underline-offset-4">Site Measure Studio</Link> to a phone-friendly <Link href="/tools/cad-viewer" className="underline underline-offset-4">Drawing Viewer</Link>, the goal is to make field measurements and drawing review easier without pretending a browser replaces careful verification.
              </p>
            </div>
            <div className="content-card">
              <h3 className="text-xl font-semibold">Deeper workshop experiments</h3>
              <p className="section-copy mt-3">
                <Link href="/projects#zolith-studio" className="underline underline-offset-4">ZOLITH Studio</Link> and <Link href="/projects#true-form-studio" className="underline underline-offset-4">True Form Studio</Link> explore slab layout, manufacturing geometry and DXF preparation; self-hosted AI experiments explore where automation can responsibly help.
              </p>
            </div>
          </div>
        </section>

        <section className="workspace-section" aria-labelledby="principles">
          <SectionHeader id="principles" title="Working principles" />
          <ol className="principle-list">
            {principles.map((principle, index) => (
              <li key={principle.title}>
                <span className="section-index" aria-hidden="true">0{index + 1}</span>
                <div><h3>{principle.title}</h3><p className="section-copy">{principle.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <p className="section-copy quiet-note">
          Many desktop projects are personal working tools or prototypes, not public downloads. What you see here reflects the process, the lessons, and the parts that are ready to share. <Link href="/contact" className="underline underline-offset-4">Get in touch</Link>.
        </p>
      </div>
    </section>
  )
}
