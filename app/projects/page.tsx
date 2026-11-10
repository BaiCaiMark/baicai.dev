import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import ProjectCard from '../components/ProjectCard'
import { projects } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Projects', 'Independent software, CAD/CAM, automation, and research projects from baicai.', '/projects')

export default function ProjectsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="On the workbench" title="Projects" description="An evolving collection of CAD/CAM tools, fabrication software, AI automation, and research. These are real working projects at different stages — not all are public downloads or production-ready products." />
        <section className="workspace-section" aria-labelledby="current-projects">
          <SectionHeader id="current-projects" title="Work in progress & in use" />
          <div className="project-grid">
            {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
          </div>
        </section>
      </div>
    </section>
  )
}
