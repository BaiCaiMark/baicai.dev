import Image from 'next/image'
import Link from 'next/link'
import type { ToolItem } from '../data/site'
import StatusBadge from './StatusBadge'

export default function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <article className="tool-card">
      <div className="tool-card-top">
        <span className="tool-mark" aria-hidden="true">
          {tool.icon ? <Image src={tool.icon} width={32} height={32} alt="" /> : tool.shortLabel || tool.category.slice(0, 1)}
        </span>
        <span className="category-label">{tool.category}</span>
        <StatusBadge status={tool.status} />
      </div>
      <h3 className="tool-title">
        {tool.href ? <Link href={tool.href} className="tool-card-link">{tool.name}</Link> : tool.name}
      </h3>
      <p className="section-copy">{tool.description}</p>
      <div className="tool-card-bottom" aria-hidden="true">
        <span>{tool.href ? 'Open tool' : 'Planned'}</span>
        <span className="tool-route">{tool.shortLabel || tool.category}</span>
      </div>
    </article>
  )
}
