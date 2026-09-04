import Link from 'next/link'
import SectionHeader from './components/SectionHeader'
import ToolCard from './components/ToolCard'
import ProjectCard from './components/ProjectCard'
import NoteList from './components/NoteList'
import { activeTools, projects, recentNotes, site } from './data/site'
import { pageMetadata } from './lib/metadata'

export const metadata = pageMetadata(site.name, site.description, '/')

export default function Home() {
  return (
    <div className="site-container workspace-home">
      <header className="workspace-intro">
        <p className="eyebrow">Personal workshop</p>
        <h1 className="home-title">BaiCai<span className="title-dot">.</span></h1>
        <p className="intro-copy">Tools I use. Projects I build. Notes I keep.</p>
        <p className="section-copy">A working collection, shaped by everyday use.</p>
      </header>
      <section className="workspace-section" aria-labelledby="home-tools">
        <SectionHeader id="home-tools" index="01" title="Tools" href="/tools" linkLabel="All tools" />
        <div className="tool-grid">
          {activeTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      </section>
      <section className="workspace-section" aria-labelledby="home-projects">
        <SectionHeader id="home-projects" index="02" title="On the workbench" href="/projects" linkLabel="All projects" />
        <div className="project-grid">
          {projects.slice(0, 2).map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </section>
      <section className="workspace-section" aria-labelledby="home-notes">
        <SectionHeader id="home-notes" index="03" title="Recent notes" href="/notes" linkLabel="All notes" />
        <NoteList notes={recentNotes.slice(0, 2)} />
      </section>
      <p className="home-signoff">Built and kept by Mark. <Link href="/about" className="text-link">About this workshop</Link></p>
    </div>
  )
}
