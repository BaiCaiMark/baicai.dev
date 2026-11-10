import Link from 'next/link'
import PortalCard from './components/PortalCard'
import ScrollAtmosphere from './components/ScrollAtmosphere'
import ProjectCard from './components/ProjectCard'
import ToolCard from './components/ToolCard'
import { activeTools, projects, recentNotes, site, formatNoteDate } from './data/site'
import { pageMetadata } from './lib/metadata'

export const metadata = pageMetadata('baicai.dev — Creative Technology Studio', site.description, '/')

const portals = [
  { href: '/tools', title: 'Tools', description: 'Practical software, shaped by the work it needs to do.', icon: 'tools', number: '01' },
  { href: '/projects', title: 'Projects', description: 'Ideas in motion. Systems taking shape.', icon: 'projects', number: '02' },
  { href: '/notes', title: 'Notes', description: 'Observations, experiments, and things worth keeping.', icon: 'notes', number: '03' },
  { href: '/about', title: 'About', description: 'The hands-on experience and curiosity behind baicai.', icon: 'about', number: '04' },
] as const

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero home-hero--ambient home-hero--scroll" aria-labelledby="hero-heading">
        <ScrollAtmosphere />
        <div className="site-container home-hero-grid">
          <div className="hero-copy">
            <p className="home-kicker"><span aria-hidden="true" /> Independent creative technology studio</p>
            <h1 id="hero-heading">Precision.<br /><em>Imagination.</em><br />Made real.</h1>
            <p className="home-hero-description">Software shaped by stone fabrication, field measurements and a curiosity for AI — built for real work, and refined through use.</p>
            <div className="hero-actions">
              <Link href="/projects" className="button-primary">Explore the studio <svg className="hero-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19 19 5M8 5h11v11" /></svg></Link>
              <Link href="/tools" className="home-quiet-link">Discover the tools <span aria-hidden="true">→</span></Link>
            </div>
            <div className="home-hero-footnote"><span>AI / DESIGN / ENGINEERING</span><span>EST. IN CURIOSITY</span></div>
          </div>
        </div>
      </section>

      <div className="site-container">
        <div className="home-manifesto"><span className="manifesto-index">A STUDIO IN PROGRESS</span><p>Built from real-world problems.<br /><i>Open to unexpected possibilities.</i></p><span className="manifesto-line" aria-hidden="true" /></div>
      </div>

      <section id="explore" className="site-container portal-section" aria-labelledby="explore-heading">
        <div className="home-section-heading"><div><p className="eyebrow">The practice</p><h2 id="explore-heading">Explore the space<span className="heading-period">.</span></h2></div><p>Four ways into one evolving workshop.</p></div>
        <div className="portal-grid">{portals.map((portal) => <PortalCard key={portal.href} {...portal} />)}</div>
      </section>

      <section className="site-container home-section home-work" aria-labelledby="current-work">
        <div className="home-section-heading"><div><p className="eyebrow">Made to work</p><h2 id="current-work">Current explorations<span className="heading-period">.</span></h2></div><Link href="/projects" className="text-link">View all projects <span aria-hidden="true">↗</span></Link></div>
        <div className="home-work-grid">
          {activeTools.filter((tool) => tool.slug === 'site-measure' || tool.slug === 'cad-viewer').map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
          {projects.filter((project) => project.slug === 'zolith-studio' || project.slug === 'true-form-studio').map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </section>

      <section className="site-container home-section" aria-labelledby="latest-notes">
        <div className="home-section-heading"><div><p className="eyebrow">The journal</p><h2 id="latest-notes">Notes from the process<span className="heading-period">.</span></h2></div><Link href="/notes" className="text-link">Read the journal <span aria-hidden="true">↗</span></Link></div>
        <div className="latest-grid">
          {recentNotes.slice(0, 3).map((note) => <article className="latest-card" key={note.slug}><div className="latest-art" aria-hidden="true"><span /><span /></div><div className="latest-body"><span className="category-label">FIELD NOTES</span><h3><Link href={`/notes#${note.slug}`}>{note.title}</Link></h3><p>{note.summary}</p><time dateTime={note.date}>{formatNoteDate(note.date)}</time></div></article>)}
        </div>
      </section>

      <section className="site-container closing-statement" aria-label="Closing statement"><blockquote>Keep what matters.<br /><i>Make what is possible.</i></blockquote><div className="closing-signature"><span>MADE WITH CURIOSITY</span><span>baicai.dev</span></div></section>
    </div>
  )
}
