import type { Metadata } from 'next'
import { site } from '../data/site'

const homeTitle = 'baicai.dev | Creative Technology Studio'
const shareAlt = 'baicai.dev — Precision. Imagination. Made real.'

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = path === '/' ? homeTitle : `${title} | ${site.name}`
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: site.name,
      locale: 'en_US',
      type: 'website',
      images: [{ url: site.shareImage, width: 1200, height: 630, alt: shareAlt }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [site.shareImage] },
  }
}
