import { bounds, calculate, transformPoint, type Point } from './geometry'
import { edgeOrder, value, type Edge, type Param, type Shape } from './model'
import { formatLength, type Unit } from './units'

export const edgeNames: Record<Edge, string> = {
  back: 'Back run', right: 'Right end', front: 'Front edge', left: 'Left back run',
  innerX: 'Inside horizontal run', innerY: 'Inside vertical run',
}
export function edgeControl(shape: Shape, edge: Edge): { parameter: Param | null; label: string; relationship?: string } {
  if (shape.template === 'rectangle') return { parameter: edge === 'back' || edge === 'front' ? 'width' : 'height', label: edge === 'back' || edge === 'front' ? 'Length' : 'Depth' }
  const controls: Record<Edge, { parameter: Param | null; label: string; relationship?: string }> = {
    back: { parameter: 'width', label: 'Long back run' },
    left: { parameter: 'height', label: 'Left back run' },
    right: { parameter: 'legX', label: 'Right end depth' },
    front: { parameter: 'legY', label: 'Lower end width' },
    innerX: { parameter: null, label: 'Inside horizontal run', relationship: 'Long back run − lower end width, adjusted by edge overhangs.' },
    innerY: { parameter: null, label: 'Inside vertical run', relationship: 'Left back run − right end depth, adjusted by edge overhangs.' },
  }
  return controls[edge]
}
export function edgeLength(shape: Shape, edge: Edge, finished = true): number | null {
  const g = calculate(shape), outline = finished ? g.top : g.base
  if (outline) {
    const i = edgeOrder(shape).indexOf(edge)
    if (i < 0) return null
    const a = outline[i], b = outline[(i + 1) % outline.length]
    return Math.hypot(b.x - a.x, b.y - a.y)
  }
  if (!finished || shape.basis === 'finished') {
    const key = edgeControl(shape, edge).parameter
    if (key) return value(shape.dimensions[key])
  }
  return null
}
export { parseFieldMeasurement, fieldMeasurementText } from './field'
// Worksheet coordinates are visual positions, never surveyed mm coordinates.
// One fixed display scale for the whole Area; layout is never read by a solver/exporter.
export const WORKSHEET_SCALE = .2
export function worksheetPart(shape: Shape) {
  const display = displayOutline(shape), rotated = display.points.map(p => transformPoint(p, shape)), box = bounds(rotated)
  const local = (p: Point): Point => {
    const t = transformPoint(p, shape)
    return { x: (t.x - box.x) * WORKSHEET_SCALE, y: (t.y - box.y) * WORKSHEET_SCALE }
  }
  return { points: display.points.map(local), guide: display.guide, width: box.width * WORKSHEET_SCALE, height: box.height * WORKSHEET_SCALE, local }
}
export function worksheetLayout(shapes: Shape[]) {
  const items = shapes.map(shape => ({ shape, ...worksheetPart(shape) }))
  const columns = shapes.length > 1 ? 2 : 1
  const widths = Array.from({ length: columns }, (_, col) => Math.max(0, ...items.filter((_, i) => i % columns === col).map(p => p.width)))
  const heights = Array.from({ length: Math.ceil(items.length / columns) }, (_, row) => Math.max(0, ...items.slice(row * columns, (row + 1) * columns).map(p => p.height)))
  return items.map((item, i) => ({ ...item,
    // Retain Preview 2 saved translations, without mutating or migrating source data.
    x: item.shape.layout?.x ?? 100 + widths.slice(0, i % columns).reduce((n, w) => n + w + 200, 0),
    y: item.shape.layout?.y ?? 110 + heights.slice(0, Math.floor(i / columns)).reduce((n, h) => n + h + 200, 0),
  }))
}
export function displayOutline(shape: Shape): { points: Point[]; guide: boolean } {
  const g = calculate(shape)
  if (g.top) return { points: g.top, guide: false }
  if (g.base) return { points: g.base, guide: true }
  // Deliberately a dashed, watermarked template, never used by an exporter.
  return { points: shape.template === 'rectangle'
    ? [{x:0,y:0},{x:1600,y:0},{x:1600,y:900},{x:0,y:900}]
    : [{x:0,y:0},{x:2000,y:0},{x:2000,y:600},{x:700,y:600},{x:700,y:1500},{x:0,y:1500}], guide: true }
}
export function partSize(shape: Shape, unit: Unit): string {
  const top = calculate(shape).top
  return top ? formatLength(bounds(top).width, unit) + ' × ' + formatLength(bounds(top).height, unit) : 'Incomplete measurements'
}
