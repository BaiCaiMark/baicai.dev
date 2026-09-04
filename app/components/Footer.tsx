import Link from 'next/link'
import { footerLinks, site } from '../data/site'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-inner">
        <p>&copy; {new Date().getFullYear()} {site.name}<span className="footer-caption">Personal workshop</span></p>
        <nav aria-label="Footer navigation">
          {footerLinks.map((link) => <Link key={link.href} href={link.href} className="footer-link">{link.label}</Link>)}
        </nav>
      </div>
    </footer>
  )
}
