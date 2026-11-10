import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import ToolCard from '../components/ToolCard'
import { tools, toolCategories } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Tools', 'Browser tools for site measurements, DXF/DWG/PDF drawing review, and workshop conversions.', '/tools')

export default function ToolsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="The toolbox" title="Tools" description="Small browser tools built around real tasks: measuring a job, reviewing a drawing, or converting a workshop dimension." />
        {toolCategories.map((category) => {
          const categoryTools = tools.filter((tool) => tool.category === category)
          if (!categoryTools.length) return null
          return (
            <section className="workspace-section" key={category} aria-labelledby={`category-${category.toLowerCase()}`}>
              <SectionHeader id={`category-${category.toLowerCase()}`} title={category} />
              <div className="tool-grid">
                {categoryTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
              </div>
            </section>
          )
        })}
        <aside className="quiet-note">
          <h2>Built for practical use</h2>
          <p>These helpers are designed to support, not replace, field verification and shop-floor checks. Review measurements and machining values before fabrication.</p>
        </aside>
      </div>
    </section>
  )
}
