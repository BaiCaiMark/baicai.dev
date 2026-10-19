import Link from 'next/link'
import type { ProjectItem } from '../data/site'
import StatusBadge from './StatusBadge'

export default function ProjectCard({ project }: { project: ProjectItem }) {
  return (
    <article id={project.slug} className="project-card">
      <div className="project-card-top">
        <h3>{project.href ? <Link href={project.href}>{project.name}</Link> : project.name}</h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="section-copy">{project.description}</p>
      <p className="project-detail">{project.detail}</p>
    </article>
  )
}
