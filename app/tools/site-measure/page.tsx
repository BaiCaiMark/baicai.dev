import type { Metadata } from 'next'
import { pageMetadata } from '../../lib/metadata'
import Studio from './Studio'
import './studio.css'
export const metadata: Metadata = {
  ...pageMetadata('Site Measure Studio', 'Dimension-driven field measurements with local projects, PDF and DXF export.', '/tools/site-measure'),
  robots: { index: false, follow: false },
}
export default function SiteMeasurePage() { return <Studio /> }
