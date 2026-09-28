import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'baicai.dev — Think clearly. Build useful things.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), 'public', 'theme', 'logo', 'eclipse-ring-mark-transparent-1024.png'))
  const logoData = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '74px 78px', background: '#F7F8F6', color: '#18211F' }}>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 650 }}>
        <div style={{ color: '#0F4C43', fontSize: 26, letterSpacing: 2, marginBottom: 60 }}>baicai.dev</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Georgia', fontSize: 82, lineHeight: 1.02 }}><span>Think clearly.</span><span>Build useful things.</span></div>
        <div style={{ color: '#56645F', fontSize: 25, marginTop: 38 }}>Tools · Notes · Projects · About</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoData} width={385} height={385} alt="" />
    </div>,
    size,
  )
}
