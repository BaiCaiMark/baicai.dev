import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://baicai.dev'),
  title: 'BaiCai',
  description: 'Learning in public and building iteratively.',
  openGraph: {
    title: 'BaiCai',
    description: 'Learning in public and building iteratively.',
    url: 'https://baicai.dev',
    siteName: 'BaiCai',
    images: [{ url: '/favicon.png', width: 64, height: 64, alt: 'BaiCai' }],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
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
