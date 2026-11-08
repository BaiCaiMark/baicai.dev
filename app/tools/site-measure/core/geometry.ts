import { fieldMeasurementText } from './field'
import { edgeOrder, edgeLabels, originLabels, paramLabels, requiredParams, statusLabels, treatmentOf, value, type Edge, type Shape, type Reference, type Project } from './model'
import { formatLength, type Unit } from './units'

export type Point = { x: number; y: number }
export type Segment = { a: Point; b: Point }
export type Bounds = { x: number; y: number; width: number; height: number }
export type Geometry = { base: Point[] | null; top: Point[] | null; errors: string[]; warnings: string[] }
export const EPS = 1e-7
export function bounds(points: Point[]): Bounds {
  const xs = points.map(p => p.x), ys = points.map(p => p.y)
  const x = Math.min(...xs), y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}
export function area(points: Point[]): number {
  return points.reduce((a, p, i) => { const q = points[(i + 1) % points.length]; return a + p.x * q.y - q.x * p.y }, 0) / 2
}
function cross(a: Point, b: Point): number { return a.x * b.y - a.y * b.x }
function subtract(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y } }
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const ab = subtract(b, a), cd = subtract(d, c), ac = subtract(c, a), det = cross(ab, cd)
  if (Math.abs(det) < EPS) {
    if (Math.abs(cross(ac, ab)) > EPS) return false
    const axis = Math.abs(ab.x) > Math.abs(ab.y) ? 'x' : 'y'
    return Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis])) <= Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) + EPS
  }
  const t = cross(ac, cd) / det, u = cross(ac, ab) / det
  return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS
}
export function validPolygon(points: Point[]): boolean {
  if (points.length < 4 || area(points) <= EPS || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length
    if (Math.hypot(points[next].x - points[i].x, points[next].y - points[i].y) <= EPS) return false
    for (let j = i + 1; j < points.length; j++) {
      if (j === next || (j + 1) % points.length === i) continue
      if (intersects(points[i], points[next], points[j], points[(j + 1) % points.length])) return false
    }
  }
  return true
}
// Canonical frame: +X right, +Y toward front, E1 is back. Transform only after solving.
// Only the fixed 4/6-edge orthogonal topology is supported; topology changes are rejected.
export function offsetOrthogonal(points: Point[], offsets: number[]): Point[] | null {
  const lines = points.map((p, i) => {
    const q = points[(i + 1) % points.length], d = subtract(q, p), len = Math.hypot(d.x, d.y)
    return { p: { x: p.x + d.y / len * offsets[i], y: p.y - d.x / len * offsets[i] }, d }
  })
  const result: Point[] = []
  for (let i = 0; i < lines.length; i++) {
    const prev = lines[(i + lines.length - 1) % lines.length], curr = lines[i]
    const det = cross(prev.d, curr.d)
    if (Math.abs(det) < EPS) return null
    const t = cross(subtract(curr.p, prev.p), curr.d) / det
    result.push({ x: prev.p.x + t * prev.d.x, y: prev.p.y + t * prev.d.y })
  }
  if (!validPolygon(result)) return null
  // Reject edge reversal, even when the resulting polygon happens to remain simple.
  if (result.some((p, i) => {
    const d = subtract(result[(i + 1) % result.length], p), orig = lines[i].d
    return d.x * orig.x + d.y * orig.y <= EPS
  })) return null
  return result
}
function solve(shape: Shape): Geometry {
  const errors: string[] = [], warnings: string[] = []
  const params = requiredParams(shape)
  for (const key of params) {
    const n = value(shape.dimensions[key])
    if (n === null || n <= 0) errors.push(paramLabels[key] + '：' + (shape.dimensions[key].input.trim() ? 'Enter a valid positive measurement' : 'Unknown'))
    if (shape.dimensions[key].status !== 'confirmed') warnings.push(paramLabels[key] + ' ' + statusLabels[shape.dimensions[key].status])
  }
  if (shape.angleStatus !== 'confirmed') warnings.push('90° template assumption; actual wall angle: ' + statusLabels[shape.angleStatus])
  else warnings.push('90° template adopted; field checked is not manufacturing approval')
  if (errors.length) return { base: null, top: null, errors, warnings }
  const w = value(shape.dimensions.width)!, h = value(shape.dimensions.height)!
  let base: Point[]
  if (shape.template === 'l') {
    const a = value(shape.dimensions.legX)!, b = value(shape.dimensions.legY)!
    if (a >= h || b >= w) return { base: null, top: null, errors: ['L-shape end depths must be smaller than the overall runs; no degenerate or crossing outline'], warnings }
    base = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: a }, { x: b, y: a }, { x: b, y: h }, { x: 0, y: h }]
  } else base = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]
  if (shape.basis === 'finished') return { base, top: base, errors, warnings }
  const offsets = edgeOrder(shape).map(e => {
    const q = shape.allowances[e], n = value(q)
    if (n === null) errors.push(edgeLabels[e] + ' overhang ' + (q.input.trim() ? 'invalid' : 'unknown (choose 0 for no overhang)'))
    if (q.status !== 'confirmed') warnings.push(edgeLabels[e] + ' overhang ' + statusLabels[q.status])
    return n ?? 0
  })
  if (errors.length) return { base, top: null, errors, warnings }
  const top = offsetOrthogonal(base, offsets)
  if (!top) errors.push('Overhangs reverse an edge, collapse a run or cause crossing. Check this unsupported combination.')
  return { base, top, errors, warnings }
}
export function calculate(shape: Shape): Geometry {
  const geometry = solve(shape)
  if (geometry.top && requiredParams(shape).every(key => value(shape.alternateDimensions[key]) !== null)) {
    const alternate = solve({ ...shape, basis: shape.basis === 'cabinet' ? 'finished' : 'cabinet', dimensions: shape.alternateDimensions })
    if (alternate.top && geometry.top.some((p, i) => {
      const q = geometry.top![(i + 1) % geometry.top!.length], a = alternate.top![i], b = alternate.top![(i + 1) % alternate.top!.length]
      return Math.abs(Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(b.x - a.x, b.y - a.y)) > 1e-6
    })) {
      geometry.errors.push('Cabinet + overhang conflicts with the direct finished measurements. Check both input sets before exporting an outline.')
      geometry.top = null
    }
  }
  return geometry
}
export function transformPoint(p: Point, shape: Pick<Shape, 'mirrored' | 'rotation'>): Point {
  const x = shape.mirrored ? -p.x : p.x, y = p.y
  switch (shape.rotation) {
    case 90: return { x: -y, y: x }
    case 180: return { x: -x, y: -y }
    case 270: return { x: y, y: -x }
    default: return { x, y }
  }
}
export function contains(points: Point[], p: Point): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j]
    if (Math.abs(cross(subtract(p, a), subtract(b, a))) < EPS && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS) return true
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}
function clipAxis(points: Point[], coordinate: number, axis: 'x' | 'y'): Segment[] {
  const other = axis === 'x' ? 'y' : 'x', bb = bounds(points)
  const stops = [bb[other], bb[other] + (other === 'x' ? bb.width : bb.height)]
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    if (Math.abs(a[axis] - b[axis]) > EPS && coordinate >= Math.min(a[axis], b[axis]) - EPS && coordinate <= Math.max(a[axis], b[axis]) + EPS) {
      stops.push(a[other] + (coordinate - a[axis]) / (b[axis] - a[axis]) * (b[other] - a[other]))
    }
  }
  const sorted = [...new Set(stops)].sort((a, b) => a - b), lines: Segment[] = []
  for (let i = 1; i < sorted.length; i++) {
    const mid = { [axis]: coordinate, [other]: (sorted[i - 1] + sorted[i]) / 2 } as Point
    if (sorted[i] - sorted[i - 1] > EPS && contains(points, mid)) lines.push({ a: { [axis]: coordinate, [other]: sorted[i - 1] } as Point, b: { [axis]: coordinate, [other]: sorted[i] } as Point })
  }
  return lines
}
export function referenceGeometry(ref: Reference, shape: Shape, geometry: Geometry): { lines: Segment[]; point: Point | null; warnings: string[] } {
  const warnings: string[] = [], polygon = ref.basis === 'cabinet' ? (shape.basis === 'cabinet' ? geometry.base : null) : geometry.top
  if (!polygon) return { lines: [], point: null, warnings: ['Reference outline is incomplete'] }
  const bb = bounds(polygon), xValue = value(ref.x), yValue = value(ref.y)
  const x = xValue === null ? null : ref.fromX === 'left' ? bb.x + xValue : bb.x + bb.width - xValue
  const y = yValue === null ? null : ref.fromY === 'back' ? bb.y + yValue : bb.y + bb.height - yValue
  if (x === null) warnings.push('X unknown or invalid')
  if (y === null && (ref.kind !== 'sink' || ref.y.input.trim())) warnings.push('Y unknown or invalid')
  if (ref.x.status !== 'confirmed' || (ref.kind !== 'sink' || ref.y.input.trim()) && ref.y.status !== 'confirmed') warnings.push('Position measurements are not all field checked')
  let lines: Segment[] = []
  if (x !== null) lines = lines.concat(clipAxis(polygon, x, 'x'))
  if (y !== null) lines = lines.concat(clipAxis(polygon, y, 'y'))
  let point: Point | null = x !== null && y !== null ? { x, y } : null
  if (point && !contains(polygon, point)) { warnings.push('Reference point is outside the outline or inside the notch; Needs Check'); point = null }
  if (x !== null && (x < bb.x - EPS || x > bb.x + bb.width + EPS)) warnings.push('X is outside the reference outline')
  if (y !== null && (y < bb.y - EPS || y > bb.y + bb.height + EPS)) warnings.push('Y is outside the reference outline')
  return { lines, point, warnings }
}
export type ReportRow = { label: string; text: string }
export function measurementRows(shape: Shape, unit: Unit, geometry = calculate(shape)): ReportRow[] {
  const rows: ReportRow[] = requiredParams(shape).map(key => {
    const q = shape.dimensions[key]
    return { label: (shape.basis === 'cabinet' ? 'Cabinet ' : 'Countertop directly measured ') + paramLabels[key], text: formatLength(value(q), unit) + ' · ' + originLabels[q.origin] + ' / ' + statusLabels[q.status] }
  })
  for (const key of requiredParams(shape)) {
    const q = shape.alternateDimensions[key]
    if (q.input.trim()) rows.push({ label: 'Retained alternate ' + (shape.basis === 'cabinet' ? 'finished reading ' : 'cabinet ') + paramLabels[key], text: formatLength(value(q), unit) + ' · ' + originLabels[q.origin] + ' / ' + statusLabels[q.status] })
  }
  for (const e of edgeOrder(shape)) {
    const treatment = treatmentOf(shape,e)
    if (treatment) rows.push({label:'Treatment '+edgeLabels[e],text:({'no-polish':'No Polish',polish:'Polish',miter:'Miter'} as const)[treatment] + (treatment==='miter'?' · joining compensation not calculated':'')})
  }
  if (shape.basis === 'cabinet') {
    for (const e of edgeOrder(shape)) {
      const q = shape.allowances[e]
      rows.push({ label: 'Overhang ' + edgeLabels[e], text: formatLength(value(q), unit) + ' · ' + originLabels[q.origin] + ' / ' + statusLabels[q.status] + (q.defaultRevision === undefined ? '' : ' · preset v' + q.defaultRevision) })
    }
    if (shape.template === 'rectangle') {
      const result = (key: 'width' | 'height', a: Edge, b: Edge) => {
        const values = [value(shape.allowances[a]), value(shape.dimensions[key]), value(shape.allowances[b])]
        if(values.some(n=>n===null))return values.map(n=>formatLength(n,unit)).join(' + ')+' = Incomplete'
        return values.filter((n,i)=>i===1||n!==0).map(n=>formatLength(n,unit)).join(' + ') + ' = ' + formatLength(values.reduce<number>((s,n)=>s+n!,0),unit)
      }
      rows.push({ label: 'Finished length = Left + Cabinet + Right (calculated)', text: result('width', 'left', 'right') })
      rows.push({ label: 'Finished depth = Back + Cabinet + Front (calculated)', text: result('height', 'back', 'front') })
    }
  }
  if (geometry.top) {
    const bb = bounds(geometry.top)
    rows.push({ label: shape.basis === 'cabinet' ? 'Countertop finished size (calculated)' : 'Countertop finished size (directly measured)', text: formatLength(bb.width, unit) + ' × ' + formatLength(bb.height, unit) })
    if (shape.template === 'l') edgeOrder(shape).forEach((e, i) => {
      const a = geometry.top![i], b = geometry.top![(i + 1) % geometry.top!.length]
      rows.push({ label: 'Finished ' + edgeLabels[e], text: formatLength(Math.hypot(b.x - a.x, b.y - a.y), unit) + ' · calculated edge length' })
    })
  }
  rows.push({ label: 'Template orientation & reference axes', text: 'Rotation ' + shape.rotation + '° / Mirror ' + (shape.mirrored ? 'Yes' : 'No') + '; original template X left→right, Y back→front; axes follow the drawing' })
  for (const ref of shape.references) {
    const label = ref.kind === 'sink' ? 'Sink '+(shape.references.filter(r=>r.kind==='sink').findIndex(r=>r.id===ref.id)+1)+' Center' : 'Cooktop'
    rows.push({ label: label + ' · ' + (ref.basis === 'cabinet' ? 'Cabinet edges' : 'Countertop edges'), text: 'X ' + (ref.fromX === 'left' ? 'from left' : 'from right') + ' ' + formatLength(value(ref.x), unit) + (ref.kind === 'sink' && !ref.y.input.trim() ? ' (X only; not a cutout)' : ' / Y ' + (ref.fromY === 'back' ? 'from back' : 'from front') + ' ' + formatLength(value(ref.y), unit) + ' (reference only, not a cutout)') })
    rows.push({ label: label + ' measurement source', text: 'X ' + originLabels[ref.x.origin] + ' / ' + statusLabels[ref.x.status] + (ref.kind==='sink'&&!ref.y.input.trim() ? '' : ' · Y '+ originLabels[ref.y.origin] + ' / ' + statusLabels[ref.y.status]) })
    for (const warning of referenceGeometry(ref, shape, geometry).warnings) rows.push({ label: label + ' Needs Check', text: warning })
  }
  for (const record of shape.fieldRecords ?? []) {
    const place = record.edge ? ({back:'Back run',right:'Right end',front:'Lower end',left:'Left back run',innerX:'Inside horizontal run',innerY:'Inside vertical run'})[record.edge] : 'Part'
    if (record.kind === 'measurement') rows.push({label:'Reference measurement / ' + place + (record.label ? ' / ' + record.label : ''),text:fieldMeasurementText(record.measurement,unit) + ' · ' + originLabels[record.measurement.origin] + ' / ' + statusLabels[record.measurement.status]})
    else rows.push({label:'Field note / ' + place,text:record.text})
  }
  return rows
}
export function exportSnapshot(input: Project) {
  const project = structuredClone(input)
  return {
    project: structuredClone(project),
    entries: project.areas.flatMap(area => area.shapes.map(shape => {
      const geometry = calculate(shape)
      return { area, shape, geometry, rows: measurementRows(shape, project.unit, geometry) }
    })),
  }
}
export type Snapshot = ReturnType<typeof exportSnapshot>
