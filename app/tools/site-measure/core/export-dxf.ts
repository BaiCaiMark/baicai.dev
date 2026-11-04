import { DxfWriter, LWPolylineFlags, Units, point2d, point3d } from '@tarikjabiri/dxf'
import { bounds, referenceGeometry, transformPoint, type Point, type Snapshot } from './geometry'
import { edgeLabels, edgeOrder } from './model'
import { formatLength } from './units'

// ASCII DXF escape sequences keep Unicode notes without depending on a system codepage.
// Escape literal CAD formatting characters too; notes never become DXF syntax.
export function dxfText(text: string): string {
  return text.replace(/[\r\n\t]/g, ' ').split('').map(c => {
    const n = c.charCodeAt(0)
    return n > 126 || c === '\\' || c === '%' ? '\\U+' + n.toString(16).toUpperCase().padStart(4, '0') : n >= 32 ? c : ''
  }).join('')
}
export function createDxf(snapshot: Snapshot): { text: string; included: string[]; excluded: string[] } {
  const d = new DxfWriter()
  d.setUnits(Units.Millimeters)
  for (const [name, color] of [['SM_TOP', 7], ['SM_CABINET', 8], ['SM_REFERENCE', 4], ['SM_DIM', 3], ['SM_NOTES', 2]] as const) d.addLayer(name, color)
  const included: string[] = [], excluded: string[] = []
  const note = (text: string, x: number, y: number, layer = 'SM_NOTES') => d.addText(point3d(x, y), 8, dxfText(text), { layerName: layer })
  note(snapshot.project.name + ' / revision ' + snapshot.project.revision + ' / units mm', 0, 100)
  note('FIELD MEASUREMENTS - NOT MANUFACTURING APPROVAL. Layout positions are NOT surveyed locations.', 0, 85)
  let rowY = 0
  for (const entry of snapshot.entries) {
    const { shape, area, geometry, rows } = entry, label = area.name + ' / ' + shape.name
    if (!geometry.top) { excluded.push(label); continue }
    included.push(label)
    const transformed = geometry.top.map(p => transformPoint(p, shape)), bb = bounds(transformed)
    const world = (p: Point) => {
      const t = transformPoint(p, shape)
      return { x: t.x - bb.x, y: rowY - (t.y - bb.y) }
    }
    const poly = (points: Point[], layerName: string) => d.addLWPolyline(points.map(p => {
      const v = world(p); return { point: point2d(v.x, v.y) }
    }), { flags: LWPolylineFlags.Closed, layerName })
    poly(geometry.top, 'SM_TOP')
    if (shape.basis === 'cabinet' && geometry.base) poly(geometry.base, 'SM_CABINET')
    note(label, 0, rowY + 55)
    note('90-degree template / ' + (shape.angleStatus === 'confirmed' ? 'adopted' : 'VERIFY ANGLE') + ' / ' + shape.basis, 0, rowY + 40)
    edgeOrder(shape).forEach((edge, i) => {
      const a = geometry.top![i], b = geometry.top![(i + 1) % geometry.top!.length], wa = world(a), wb = world(b)
      const mid = { x: (wa.x + wb.x) / 2, y: (wa.y + wb.y) / 2 }
      note(edgeLabels[edge] + ' ' + formatLength(Math.hypot(b.x - a.x, b.y - a.y), snapshot.project.unit), mid.x + 8, mid.y + 12, 'SM_DIM')
    })
    if (shape.rotation !== 0 || shape.mirrored) {
      const o=world({x:0,y:0}),a=world({x:80,y:0}),b=world({x:0,y:80})
      d.addLine(point3d(o.x,o.y),point3d(a.x,a.y),{layerName:'SM_REFERENCE'})
      d.addLine(point3d(o.x,o.y),point3d(b.x,b.y),{layerName:'SM_REFERENCE'})
      note('X+',a.x+8,a.y+8,'SM_REFERENCE');note('Y+',b.x+8,b.y+8,'SM_REFERENCE')
    }
    for (const ref of shape.references) {
      const rg = referenceGeometry(ref, shape, geometry)
      for (const line of rg.lines) {
        const a = world(line.a), b = world(line.b)
        d.addLine(point3d(a.x, a.y), point3d(b.x, b.y), { layerName: 'SM_REFERENCE' })
      }
      // A center cross only exists when BOTH coordinates were supplied and are inside.
      if (rg.point) {
        const p = world(rg.point)
        d.addLine(point3d(p.x - 8, p.y), point3d(p.x + 8, p.y), { layerName: 'SM_REFERENCE' })
        d.addLine(point3d(p.x, p.y - 8), point3d(p.x, p.y + 8), { layerName: 'SM_REFERENCE' })
      }
    }
    const lines = [
      ...rows.map(r => r.label + ': ' + r.text),
      ...geometry.warnings.map(w => 'VERIFY: ' + w),
      'Area notes: ' + area.notes, 'Shape notes: ' + shape.notes,
      'SM_REFERENCE entities are positioning references, NOT cutouts.',
    ].flatMap(line => {
      const chars = Array.from(line), out: string[] = []
      for (let i = 0; i < Math.max(chars.length, 1); i += 35) out.push(chars.slice(i, i + 35).join(''))
      return out
    })
    lines.forEach((line, i) => note(line, bb.width + 120, rowY - i * 13))
    rowY -= Math.max(bb.height, lines.length * 13) + 250
  }
  excluded.forEach((label, i) => note('EXCLUDED incomplete: ' + label, 0, rowY - i * 20))
  return { text: d.stringify(), included, excluded }
}
