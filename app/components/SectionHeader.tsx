import Link from 'next/link'

type SectionHeaderProps = {
  id: string
  title: string
  index?: string
  href?: string
  linkLabel?: string
}

export default function SectionHeader({ id, title, index, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-heading-group">
        {index ? <span className="section-index" aria-hidden="true">{index}</span> : null}
        <h2 id={id} className="section-heading">{title}</h2>
      </div>
      {href && linkLabel ? <Link href={href} className="text-link">{linkLabel}</Link> : null}
    </div>
  )
}
