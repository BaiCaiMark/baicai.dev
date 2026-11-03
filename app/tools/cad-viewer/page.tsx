import type { Metadata } from 'next'
import Link from 'next/link'
import DrawingViewer from './DrawingViewer'
import { pageMetadata } from '../../lib/metadata'

export const metadata: Metadata = pageMetadata(
  'Drawing Viewer',
  'Open DXF, DWG and PDF drawings in your browser. Private, lightweight, read-only.',
  '/tools/cad-viewer',
)

export default function CadViewerPage() {
  return (
    <section className="page-section">
      <div className="site-container">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/tools">Tools</Link><span aria-hidden="true">/</span><span aria-current="page">Drawing Viewer</span>
        </nav>
        <DrawingViewer />
      </div>
    </section>
  )
}
