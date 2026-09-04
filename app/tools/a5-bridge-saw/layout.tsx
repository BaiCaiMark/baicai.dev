import { a5Tool } from '../../data/site'
import { pageMetadata } from '../../lib/metadata'

export const metadata = pageMetadata(a5Tool.name, a5Tool.description, a5Tool.href)

export default function A5BridgeSawLayout({ children }: { children: React.ReactNode }) {
  return children
}
