import type { WallSketch } from './model'
export type WorldPoint={x:number;y:number}
export const WALL_MAX_POINTS=120
export const WALL_MAX_SKETCHES=50
const bound=(n:number)=>Math.max(-10000,Math.min(10000,n))
const distance=(a:WorldPoint,b:WorldPoint)=>Math.hypot(a.x-b.x,a.y-b.y)

/** World units here are illustrative drawing positions, NEVER a surveyed wall coordinate system. */
export function appendWallStroke(draft:readonly WorldPoint[],stroke:readonly WorldPoint[]):WorldPoint[] {
  const next=draft.slice()
  for (const candidate of stroke) {
    if(next.length>=WALL_MAX_POINTS)break
    if(!Number.isFinite(candidate.x)||!Number.isFinite(candidate.y))continue
    const point={x:bound(candidate.x),y:bound(candidate.y)}
    if(next.length&&distance(next[next.length-1],point)<1)continue
    next.push(point)
  }
  return next
}
export function makeWallSketch(id:string,name:string,points:readonly WorldPoint[]):WallSketch {
  const clean=appendWallStroke([],points)
  if(clean.length<2||distance(clean[0],clean[clean.length-1])<1)throw new Error('Draw at least two distinct wall points')
  return {id,name:name.trim().slice(0,120),kind:'schematic',points:clean}
}
export function wallPath(points:readonly WorldPoint[]):string {
  return points.map((p,i)=>(i===0?'M':'L')+p.x+' '+p.y).join(' ')
}
