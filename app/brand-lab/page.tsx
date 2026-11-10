import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Header Logo Study V1 — baicai',
  robots: { index: false, follow: false },
}

const sizes = [24, 32, 40, 48, 64, 96] as const

export default function BrandLabPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f8f6f2', color: '#2e2b28', padding: '48px 20px 100px' }}>
      <div style={{ maxWidth: 1020, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 14 }}>← Home</Link>
        <p style={{ marginTop: 32, color: '#92744e', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>baicai / logo study / v1</p>
        <h1 style={{ margin: '8px 0 14px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 500, lineHeight: 1.15 }}>Original form. New light.</h1>
        <p style={{ maxWidth: 730, lineHeight: 1.8, color: '#6d6a64' }}>
          The left column uses the currently published original WebP. The right column colors the <strong>same image silhouette</strong> with warm gray and champagne-gold. This is a temporary micro-logo color experiment: original geometry, cutout and seams are not re-drawn.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 32 }}>
          <div style={{ padding: 24, border: '1px solid #e2ddd5', background: '#fffefa', borderRadius: 12 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.1em', marginBottom: 20 }}>CURRENT · MONOCHROME</p>
            {sizes.map((size) => (
              <div key={size} style={{ minHeight: Math.max(58, size + 16), display: 'flex', alignItems: 'center', gap: 22, borderTop: '1px solid #f0ece5' }}>
                <span style={{ width: 40, fontSize: 12, color: '#7e746a' }}>{size}px</span>
                <Image src="/brand/identity-2026/solid-form-mark.webp" width={size} height={size} alt={`Original logo at ${size} pixels`} style={{ objectFit: 'contain' }} />
              </div>
            ))}
          </div>
          <div style={{ padding: 24, border: '1px solid #e2ddd5', background: '#fffefa', borderRadius: 12 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.1em', marginBottom: 20 }}>V1 · WARM TAUPE / CHAMPAGNE</p>
            {sizes.map((size) => (
              <div key={size} style={{ minHeight: Math.max(58, size + 16), display: 'flex', alignItems: 'center', gap: 22, borderTop: '1px solid #f0ece5' }}>
                <span style={{ width: 40, fontSize: 12, color: '#7e746a' }}>{size}px</span>
                <span className="brand-mark-warm" role="img" aria-label={`Warm logo at ${size} pixels`} style={{ width: size, height: size }} />
              </div>
            ))}
          </div>
        </div>

        <section style={{ marginTop: 32, padding: 22, background: '#fffefa', border: '1px solid #e2ddd5', borderRadius: 12 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.1em' }}>HEADER TEST · LIGHT</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18, padding: 16, borderBottom: '1px solid #e2ddd5' }}>
            <span className="brand-mark-warm" aria-hidden="true" style={{ width: 40, height: 40 }} />
            <strong style={{ fontWeight: 650, fontSize: 23, letterSpacing: '-.065em' }}>baicai</strong>
          </div>
          <p style={{ color: '#847d73', fontSize: 13, marginTop: 12 }}>Review on a real phone at 100% zoom. The main website remains untouched until the preview is approved.</p>
        </section>
      </div>
    </main>
  )
}
