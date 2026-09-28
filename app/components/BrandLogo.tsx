import Image from 'next/image'
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
      aria-label="baicai.dev home"
      className={`brand-logo no-underline ${className}`}
    >
      <Image
        src={site.logo}
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
        className="brand-mark-full"
      />
      <Image src={site.logo} width={40} height={40} alt="" aria-hidden="true" className="brand-mark-small" />
      {!compact ? (
        <span className="brand-logo-text">
          {site.name}
        </span>
      ) : null}
    </Link>
  )
}
