import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'baicai.dev — Precision. Imagination. Made real.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), 'public', 'favicon.png'))
  const logoData = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '72px 78px', background: '#F8F6F2', color: '#262522' }}>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 740 }}>
        <div style={{ color: '#92744E', fontSize: 25, letterSpacing: 2.4, marginBottom: 52 }}>baicai.dev / CREATIVE TECHNOLOGY STUDIO</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Georgia', fontSize: 76, lineHeight: 1.05 }}>
          <span>Precision.</span>
          <span style={{ color: '#92744E', fontStyle: 'italic' }}>Imagination.</span>
          <span>Made real.</span>
        </div>
        <div style={{ color: '#6D6A64', fontSize: 23, marginTop: 37 }}>Design · Engineering · Intelligent tools</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoData} width={320} height={320} alt="" />
    </div>,
    size,
  )
}
