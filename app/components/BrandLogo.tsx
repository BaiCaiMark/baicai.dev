import Link from 'next/link'
import { site } from '../data/site'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export default function BrandLogo({ compact = false, className = '' }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="baicai home"
      className={`brand-logo no-underline ${className}`}
    >
      <span className="brand-mark-warm brand-mark-full" aria-hidden="true" />
      <span className="brand-mark-warm brand-mark-small" aria-hidden="true" />
      {!compact ? (
        <span className="brand-logo-text">
          {site.brandName}
        </span>
      ) : null}
    </Link>
  )
}
