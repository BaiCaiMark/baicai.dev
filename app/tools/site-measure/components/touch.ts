import type { Point } from '../core/geometry'
import type { Edge } from '../core/model'

export type ScreenEdge = { partId: string; edge: Edge; a: Point; b: Point }
/** Distances are CSS pixels, after the full SVG transform. Ties keep input order. */
export function nearestEdge(point: Point, edges: ScreenEdge[], radius = 22): ScreenEdge | null {
  let nearest: ScreenEdge | null = null, best = radius + 1e-6
  for (const edge of edges) {
    const dx=edge.b.x-edge.a.x,dy=edge.b.y-edge.a.y,length=dx*dx+dy*dy
    const t=length?Math.max(0,Math.min(1,((point.x-edge.a.x)*dx+(point.y-edge.a.y)*dy)/length)):0
    const distance=Math.hypot(point.x-edge.a.x-t*dx,point.y-edge.a.y-t*dy)
    if(distance<=radius&&(!nearest||distance<best-1e-6)){nearest=edge;best=distance}
  }
  return nearest
}
/** Insert a fraction token at the selection; never concatenate 25 and 1/2 to 251/2. */
export function insertFraction(input: string, start: number, end: number, fraction: string) {
  const before=input.slice(0,start),after=input.slice(end)
  const token=(before&&!/[\s+\/]$/.test(before)?' ':'')+fraction+(after&&!/^[\s+\/]/.test(after)?' ':'')
  return {text:before+token+after,caret:before.length+token.length}
}

