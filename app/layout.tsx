import './globals.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://baicai.dev'),
  title: 'baicai.dev',
  description: 'Learning in public and building iteratively.',
  openGraph: {
    title: 'baicai.dev',
    description: 'Learning in public and building iteratively.',
    url: 'https://baicai.dev',
    siteName: 'baicai.dev',
    images: [{ url: '/favicon.svg', width: 1200, height: 630, alt: 'baicai.dev' }],
    locale: 'en_US',
    type: 'website',
  },
  icons: { icon: '/favicon.svg' },
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
