import Image from 'next/image'
import Link from 'next/link'
import PortalCard from './components/PortalCard'
import ProjectCard from './components/ProjectCard'
import ToolCard from './components/ToolCard'
import { activeTools, projects, recentNotes, site, formatNoteDate } from './data/site'
import { pageMetadata } from './lib/metadata'

export const metadata = pageMetadata(site.name, site.description, '/')

const portals = [
  { href: '/tools', title: 'Toolbox', description: 'Small, practical tools built for real work and everyday use.', icon: 'tools', number: '01' },
  { href: '/notes', title: 'Notes', description: 'Ideas, experiments, lessons, and things worth remembering.', icon: 'notes', number: '02' },
  { href: '/projects', title: 'Projects', description: 'Things I am building, testing, improving, and learning from.', icon: 'projects', number: '03' },
  { href: '/about', title: 'About', description: 'Work, technology, life, faith, and the person behind this space.', icon: 'about', number: '04' },
] as const

export default function Home() {
  return (
    <div className="home-page">
      <section className="site-container hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow">Mark · baicai.dev</p>
          <h1 id="hero-heading">Think clearly.<br />Build useful things.</h1>
          <p>A bright, quiet corner for practical tools, notes, projects, and the ideas I want to keep.</p>
          <Link href="#explore" className="button-primary hero-action">Explore <Image src="/theme/icons/arrow-right.svg" width={18} height={18} alt="" aria-hidden="true" /></Link>
        </div>
        <div className="hero-art" aria-hidden="true"><Image src={site.logo} width={1024} height={1024} priority sizes="(max-width: 767px) 216px, (max-width: 900px) 324px, 465px" alt="" /></div>
      </section>

      <section id="explore" className="site-container portal-section" aria-label="Explore baicai.dev">
        <div className="portal-grid">{portals.map((portal) => <PortalCard key={portal.href} {...portal} />)}</div>
      </section>

      <section className="site-container home-section" aria-labelledby="latest-notes">
        <div className="section-header"><div><p className="eyebrow">Journal</p><h2 id="latest-notes" className="section-heading">Latest notes</h2></div><Link href="/notes" className="text-link">View all notes <span aria-hidden="true">→</span></Link></div>
        <div className="latest-grid">
          {recentNotes.slice(0, 3).map((note) => <article className="latest-card" key={note.slug}><div className="latest-art" aria-hidden="true"><span /><span /></div><div className="latest-body"><span className="category-label">Note</span><h3><Link href={`/notes#${note.slug}`}>{note.title}</Link></h3><p>{note.summary}</p><time dateTime={note.date}>{formatNoteDate(note.date)}</time></div></article>)}
        </div>
      </section>

      <section className="site-container home-section home-work" aria-labelledby="current-work">
        <div className="section-header"><div><p className="eyebrow">In use</p><h2 id="current-work" className="section-heading">Current work</h2></div></div>
        <div className="home-work-grid">
          {activeTools.slice(0, 1).map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
          {projects.slice(0, 1).map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </section>

      <section className="site-container closing-statement" aria-label="Closing statement"><blockquote>Keep what matters.<br />Build what helps. Stay curious.</blockquote><div className="closing-signature"><span>Mark</span><span>baicai.dev</span></div></section>
    </div>
  )
}
