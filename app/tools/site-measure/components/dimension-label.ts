import type { Point } from '../core/geometry'
import { area } from '../core/geometry'
import { edgeOrder } from '../core/model'
import type { projectCanvasItems } from '../core/project-canvas'
import type { Unit } from '../core/units'
import { finishedFormula } from '../core/worksheet'

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

export function placeDimensionLabels(parts: ReturnType<typeof projectCanvasItems>, direct: boolean, unit: Unit) {
  const occupied = parts.map(p=>({x:p.x,y:p.y-124,w:p.width,h:52,owner:''}))
  const hulls = parts.map(p=>({x:p.x,y:p.y,w:p.width,h:p.height,owner:p.shape.id}))
  const placed = new Map<string,{center:Point;formula:string|null;leader:boolean;width:number;height:number;angle:number;lift:number}>()
  for(const part of parts){
    const sign=Math.sign(area(part.points))
    for(const [i,edge] of edgeOrder(part.shape).entries()){
      const a=part.points[i], b=part.points[(i+1)%part.points.length]
      const formula=direct?finishedFormula(part.shape,edge,unit):null
      const layout=dimensionLabelLayout(a,b,!!formula)
      layout.width=Math.max(layout.width,(formula?.length??0)*8+14)
      const vertical=Math.abs(b.y-a.y)>Math.abs(b.x-a.x)
      const w=vertical?layout.height:layout.width,h=vertical?layout.width:layout.height
      const length=Math.hypot(b.x-a.x,b.y-a.y),tx=(b.x-a.x)/length,ty=(b.y-a.y)/length
      const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2}
      const at=(distance:number,slide:number)=>({x:mid.x+sign*ty*distance+tx*slide,y:mid.y-sign*tx*distance+ty*slide})
      let center=at(34+layout.lift,0)
      const obstacles=[...occupied,...hulls.filter(hull=>hull.owner!==part.shape.id)]
      let best=Infinity
      for(const distance of [34+layout.lift,86+layout.lift,138+layout.lift]){
        for(const slide of [0,-64,64,-132,132]){
          const p=at(distance,slide),x=p.x+part.x-w/2,y=p.y+part.y-h/2
          const overlap=obstacles.reduce((total,r)=>total+
            Math.max(0,Math.min(x+w,r.x+r.w+3)-Math.max(x,r.x-3))*
            Math.max(0,Math.min(y+h,r.y+r.h+3)-Math.max(y,r.y-3)),0)
          const score=overlap*1000+distance+Math.abs(slide)
          if(score<best){center=p;best=score}
          if(!overlap)break
        }
        if(best<=distance)break
      }
      occupied.push({x:part.x+center.x-w/2,y:part.y+center.y-h/2,w,h,owner:part.shape.id})
      placed.set(part.shape.id+':'+edge,{...layout,center,formula,leader:Math.hypot(center.x-mid.x,center.y-mid.y)>35})
    }
  }
  return placed
}
