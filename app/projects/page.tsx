import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import ProjectCard from '../components/ProjectCard'
import { projects } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Projects', 'Current projects and ongoing work from BaiCai.', '/projects')

export default function ProjectsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="On the workbench" title="Projects" description="A mix of Windows tools, stone-industry experiments, and web projects. Some run locally and are shared here as project notes, not public downloads." />
        <section className="workspace-section" aria-labelledby="current-projects">
          <SectionHeader id="current-projects" title="Current work" />
          <div className="project-grid">
            {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
          </div>
        </section>
      </div>
    </section>
  )
}
