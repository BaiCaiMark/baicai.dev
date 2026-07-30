import Image from 'next/image'
import Link from 'next/link'

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
        src="/brand/logo/logo-mark-primary.svg"
        width={32}
        height={32}
        alt=""
        aria-hidden="true"
        priority
      />
      {!compact ? (
        <span className="brand-logo-text">
          baicai<span>.dev</span>
        </span>
      ) : null}
    </Link>
  )
}
