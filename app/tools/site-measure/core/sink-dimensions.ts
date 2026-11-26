import { value, type Reference, type Shape } from './model'
import { formatLength, type Unit } from './units'
import { bounds, type Geometry, type Point } from './geometry'

type Side = Reference['fromX']
type Reading = { mm: number | null; expression: string }

/** An X reading always retains the side and datum the operator actually measured. */
export function sinkDimensions(shape: Shape, ref: Reference, unit: Unit) {
  const raw = value(ref.x)
  const cabinet = shape.basis === 'cabinet'
  const width = value(shape.dimensions.width)
  const measuredSide = ref.fromX
  const opposite = measuredSide === 'left' ? 'right' : 'left'
  const offsets = { left: value(shape.allowances.left), right: value(shape.allowances.right) }
  const fmt = (mm: number | null) => mm === null ? '?' : formatLength(mm, unit).replace(/″$| mm$/, '')
  const term = (mm: number | null): Reading => ({ mm, expression: fmt(mm) })
  function combine(a: Reading, sign: 1 | -1, b: number | null): Reading {
    if (b === 0) return a
    return { mm: a.mm === null || b === null ? null : a.mm + sign * b,
      expression: a.expression + (sign === 1 ? ' + ' : ' − ') + fmt(b) }
  }
  const cabWidth = cabinet ? width : null
  const finishedWidth = cabinet ? combine(combine(term(width), 1, offsets.left), 1, offsets.right) : term(width)
  const fromCabinet = ref.basis === 'cabinet'
  const distances = (side: Side) => {
    const measured = side === measuredSide
    if (fromCabinet) {
      const base = measured ? term(raw) : combine(term(cabWidth), -1, raw)
      return { cabinet: base, finished: cabinet ? combine(base, 1, offsets[side]) : term(null) }
    }
    const finished = measured ? term(raw) : combine(finishedWidth, -1, raw)
    return { finished, cabinet: cabinet ? combine(finished, -1, offsets[side]) : term(null) }
  }
  return { raw, measuredSide, opposite, left: distances('left'), right: distances('right') }
}

export function sinkDimensionText(reading: Reading, unit: Unit) {
  if (reading.mm === null) return '?'
  const total = formatLength(reading.mm, unit)
  return / [−+] /.test(reading.expression) ? reading.expression + ' = ' + total : total
}

/** Use the actual template coordinate frame before display rotation or mirroring. */
export function sinkChainPoints(ref: Reference, shape: Shape, geometry: Geometry, fraction: number): Point[] | null {
  const top = geometry.top
  const datum = ref.basis === 'countertop' ? top : shape.basis === 'cabinet' ? geometry.base : null
  const raw = value(ref.x)
  if (!top || !datum || raw === null) return null
  const base = bounds(datum), finished = bounds(top)
  const x = ref.fromX === 'left' ? base.x + raw : base.x + base.width - raw
  if (x < finished.x || x > finished.x + finished.width) return null
  const y = finished.y + finished.height * fraction
  return [{ x: finished.x, y }, { x, y }, { x: finished.x + finished.width, y }]
}
