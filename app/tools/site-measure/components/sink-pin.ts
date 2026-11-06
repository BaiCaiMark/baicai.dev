import { bounds, type Geometry, type Point } from '../core/geometry'
import { value, type Reference, type Shape } from '../core/model'
import { finishedEdgeReading } from '../core/worksheet'

/** Display position for an X-only Sink Center. Y is schematic, never surveyed. */
export function sinkPin(ref:Reference,shape:Shape,g:Geometry,local:(p:Point)=>Point,w:number,h:number){
  const sinkRefs=shape.references.filter(r=>r.kind==='sink')
  const i=Math.max(0,sinkRefs.findIndex(r=>r.id===ref.id))
  const fallback={x:w*(i+1)/(sinkRefs.length+1),y:h*.51}
  const distance=value(ref.x)
  if(distance===null)return fallback
  const polygon=ref.basis==='cabinet'?g.base:g.top
  if(polygon){
    const bb=bounds(polygon)
    const x=ref.fromX==='left'?bb.x+distance:bb.x+bb.width-distance
    return local({x,y:bb.y+bb.height*.51})
  }
  const width=ref.basis==='cabinet'?value(shape.dimensions.width):finishedEdgeReading(shape,'back')
  if(width===null||width<=0)return fallback
  const x=ref.fromX==='left'?distance:width-distance
  return {x:Math.max(.07,Math.min(.93,x/width))*w,y:h*.51}
}
