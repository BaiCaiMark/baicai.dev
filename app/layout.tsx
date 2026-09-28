import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { site } from './data/site'

const displayFont = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-display', display: 'swap' })
const uiFont = Inter({ subsets: ['latin'], variable: '--font-ui', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7F8F6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${uiFont.variable} site-body flex flex-col antialiased`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <NavBar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
