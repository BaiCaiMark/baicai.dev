import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://baicai.dev'),
  title: {
    default: 'baicai.dev',
    template: '%s | baicai.dev',
  },
  description: 'A practical home for useful tools, personal projects, and notes.',
  applicationName: 'baicai.dev',
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'baicai.dev',
    description: 'A practical home for useful tools, personal projects, and notes.',
    url: 'https://baicai.dev',
    siteName: 'baicai.dev',
    images: [
      {
        url: '/brand/social/og-brand-card-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'baicai.dev brand card',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/brand/favicon/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/brand/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/favicon/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/brand/favicon/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071015',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="site-body flex flex-col antialiased">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
