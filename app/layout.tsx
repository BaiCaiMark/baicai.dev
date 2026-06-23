import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata } from 'next'

const faviconPath = '/favicon.svg?v=3'

export const metadata: Metadata = {
  metadataBase: new URL('https://baicai.dev'),
  title: 'BaiCai',
  description: 'Learning in public and building iteratively.',
  openGraph: {
    title: 'BaiCai',
    description: 'Learning in public and building iteratively.',
    url: 'https://baicai.dev',
    siteName: 'BaiCai',
    images: [{ url: faviconPath, width: 1024, height: 1024, alt: 'BaiCai' }],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [{ url: faviconPath, type: 'image/svg+xml', sizes: 'any' }],
    shortcut: [faviconPath],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-gray-900 antialiased">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
