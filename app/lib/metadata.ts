import type { Metadata } from 'next'
import { site } from '../data/site'

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = path === '/' ? `${site.name} | Think clearly. Build useful things.` : `${title} | ${site.name}`
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle, description, url: path, siteName: site.name, locale: 'en_US', type: 'website',
      images: [{ url: site.shareImage, width: 1200, height: 630, alt: 'baicai.dev — Think clearly. Build useful things.' }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [site.shareImage] },
  }
}
