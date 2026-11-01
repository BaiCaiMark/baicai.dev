import { bounds, calculate, type Point } from './geometry'
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
export function worksheetLayout(shapes: Shape[]) {
  const columns = shapes.length > 1 ? 2 : 1
  return shapes.map((shape, index) => ({
    shape, x: shape.layout?.x ?? (index % columns) * 680 + 30,
    y: shape.layout?.y ?? Math.floor(index / columns) * 540 + 30,
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
