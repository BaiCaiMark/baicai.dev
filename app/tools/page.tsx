import PageHeader from '../components/PageHeader'
import SectionHeader from '../components/SectionHeader'
import ToolCard from '../components/ToolCard'
import { tools, toolCategories } from '../data/site'
import { pageMetadata } from '../lib/metadata'

export const metadata = pageMetadata('Tools', 'Practical browser tools for work and everyday tasks, including the A5 Bridge Saw Converter.', '/tools')

export default function ToolsPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <PageHeader eyebrow="The toolbox" title="Tools" description="Practical helpers for the tasks I return to." />
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
          <h2>More everyday tools</h2>
          <p>The next addition starts with a task worth making simpler.</p>
        </aside>
      </div>
    </section>
  )
}
