import type { MetadataRoute } from 'next'
import { navItems, site, tools } from './data/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set([
    ...navItems.map((item) => item.href),
    '/contact',
    ...tools.flatMap((tool) => tool.href ? [tool.href] : []),
  ])
  return [...paths].map((path) => ({ url: new URL(path, site.url).href }))
}
