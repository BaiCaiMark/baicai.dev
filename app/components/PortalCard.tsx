import Image from 'next/image'
import Link from 'next/link'

type PortalCardProps = {
  href: string
  title: string
  description: string
  icon: 'tools' | 'notes' | 'projects' | 'about'
  number: string
}

export default function PortalCard({ href, title, description, icon, number }: PortalCardProps) {
  return (
    <Link href={href} className="portal-card">
      <span className="portal-card-head"><span className="portal-icon"><Image src={`/theme/icons/${icon}.svg`} width={25} height={25} alt="" aria-hidden="true" /></span><span className="portal-number">{number}</span></span>
      <span className="portal-card-text"><strong>{title}</strong><span>{description}</span></span>
      <Image src="/theme/icons/arrow-right.svg" width={22} height={22} alt="" aria-hidden="true" className="portal-arrow" />
    </Link>
  )
}
