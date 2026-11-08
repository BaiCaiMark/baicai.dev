import type { Point } from '../core/geometry'

// Canvas annotations are visual only; no manufacturing geometry or measured values are changed.
export function dimensionLabelLayout(a: Point, b: Point, hasFormula: boolean) {
  const dx = b.x - a.x, dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  let angle = Math.atan2(dy, dx) * 180 / Math.PI
  // The same line may be stored in either direction: never show upside-down text.
  if (angle >= 90) angle -= 180
  else if (angle < -90) angle += 180
  const width = hasFormula ? 144 : 104
  const height = hasFormula ? 48 : 30
  // A small leg must not force its entire value card on top of the adjacent edges.
  // Move just the annotation outwards and keep its leader attached to the measured edge.
  const lift = length < width + 22 ? (hasFormula ? 60 : 46) : 0
  return { angle, width, height, lift }
}
