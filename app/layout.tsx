import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata, Viewport } from 'next'

const faviconPath = '/favicon.svg?v=5'

export const metadata: Metadata = {
  metadataBase: new URL('https://baicai.dev'),
  title: {
    default: 'BaiCai',
    template: '%s | BaiCai',
  },
  description: 'A practical home for useful tools, personal projects, and notes.',
  openGraph: {
    title: 'BaiCai',
    description: 'A practical home for useful tools, personal projects, and notes.',
    url: 'https://baicai.dev',
    siteName: 'BaiCai',
    images: [{ url: faviconPath, width: 627, height: 627, alt: 'BaiCai' }],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [{ url: faviconPath, type: 'image/svg+xml', sizes: 'any' }],
    shortcut: [faviconPath],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8faf9',
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
