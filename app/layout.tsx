import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata, Viewport } from 'next'
import { site } from './data/site'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/brand/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/favicon/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/brand/favicon/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#161817',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="site-body flex flex-col antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <NavBar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
