'use client'
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { calculate, referenceGeometry, area as polygonArea, type Bounds, type Point } from '../core/geometry'
import { edgeOrder, value, type Area, type Edge } from '../core/model'
import { edgeNames, edgeLength, worksheetLayout } from '../core/worksheet'
import { formatLength, type Unit } from '../core/units'

export type EdgeSelection = { partId: string; edge: Edge }
type Props = { area: Area; selected: string | null; selectedEdge: EdgeSelection | null; unit: Unit; moving: string | null; toolbar: ReactNode; onSelect: (id: string) => void; onEdge: (selection: EdgeSelection) => void; onPlace: (id: string, position: Point) => void }
const path = (points: Point[]) => points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')+' Z'
export default function MeasureCanvas({ area, selected, selectedEdge, unit, moving, toolbar, onSelect, onEdge, onPlace }: Props) {
  const svg = useRef<SVGSVGElement>(null), shell = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number,Point>())
  const gesture = useRef<{center:Point;distance:number;box:Bounds;scale:number;anchor:Point} | null>(null)
  const start = useRef<{x:number;y:number;partId:string|null;edge:Edge|null;position:Point|null} | null>(null)
  const moved = useRef(false)
  const [manual,setManual]=useState<Bounds|null>(null),[ratio,setRatio]=useState(1.8)
  const [drag,setDrag]=useState<{id:string;position:Point}|null>(null)
  const layout=useMemo(()=>worksheetLayout(area.shapes),[area.shapes])
  const fitted=useMemo(()=>{
    if(!layout.length)return{x:0,y:0,width:1100,height:650}
    const x=Math.min(...layout.map(p=>p.x))-120,y=Math.min(...layout.map(p=>p.y))-150
    return{x,y,width:Math.max(...layout.map(p=>p.x+p.width+120))-x,height:Math.max(...layout.map(p=>p.y+p.height+110))-y}
  },[layout])
  const fit={...fitted}
  if(fit.width/fit.height<ratio){const w=fit.height*ratio;fit.x-=(w-fit.width)/2;fit.width=w}
  else{const h=fit.width/ratio;fit.y-=(h-fit.height)/2;fit.height=h}
  const box=manual??fit,liveBox=useRef(box),liveDrag=useRef(drag)
  useLayoutEffect(()=>{liveBox.current=box;liveDrag.current=drag},[box,drag])
  useLayoutEffect(()=>{
    const node=svg.current;if(!node)return
    const measure=()=>setRatio(node.clientWidth/Math.max(1,node.clientHeight))
    measure();const observer=new ResizeObserver(measure);observer.observe(node)
    return()=>observer.disconnect()
  },[])
  const center=()=>{
    const ps=[...pointers.current.values()]
    return{center:{x:ps.reduce((s,p)=>s+p.x,0)/ps.length,y:ps.reduce((s,p)=>s+p.y,0)/ps.length},distance:ps.length>1?Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y):0}
  }
  const reset=()=>{
    const matrix=svg.current?.getScreenCTM()
    if(!pointers.current.size){gesture.current=null;return}
    const current=center(),anchor=matrix?new DOMPoint(current.center.x,current.center.y).matrixTransform(matrix.inverse()):{x:liveBox.current.x,y:liveBox.current.y}
    gesture.current={...current,box:liveBox.current,scale:matrix?1/matrix.a:1,anchor}
  }
  const down=(e:PointerEvent<SVGSVGElement>)=>{
    if(e.pointerType==='mouse'&&e.button!==0)return
    e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pointers.current.size===1){
      const target=e.target as Element,partId=target.closest('[data-shape]')?.getAttribute('data-shape')??null
      const item=layout.find(p=>p.shape.id===partId)
      start.current={x:e.clientX,y:e.clientY,partId,edge:target.closest('[data-edge]')?.getAttribute('data-edge') as Edge|null,position:item?{x:item.x,y:item.y}:null};moved.current=false
    }else{moved.current=true;start.current=null;liveDrag.current=null;setDrag(null)}
    reset()
  }
  const move=(e:PointerEvent<SVGSVGElement>)=>{
    if(!pointers.current.has(e.pointerId)||!gesture.current)return
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    const base=gesture.current,now=center()
    if(start.current&&Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>7)moved.current=true
    if(!moved.current)return
    const dx=(now.center.x-base.center.x)*base.scale,dy=(now.center.y-base.center.y)*base.scale
    if(pointers.current.size===1&&start.current?.partId){
      if(moving!==start.current.partId||!start.current.position)return // Part drag never implicitly pans or measures.
      const position={x:Math.max(-10000,Math.min(10000,start.current.position.x+dx)),y:Math.max(-10000,Math.min(10000,start.current.position.y+dy))}
      setManual(base.box) // Freeze the view while moving; Fit All is explicit.
      const next={id:start.current.partId,position};liveDrag.current=next;setDrag(next);return
    }
    const factor=base.distance&&now.distance?Math.min(10,Math.max(.1,base.distance/now.distance)):1
    const ax=base.anchor.x,ay=base.anchor.y
    const next={x:ax-(ax-base.box.x)*factor-dx*factor,y:ay-(ay-base.box.y)*factor-dy*factor,width:base.box.width*factor,height:base.box.height*factor}
    liveBox.current=next;setManual(next)
  }
  const up=(e:PointerEvent<SVGSVGElement>)=>{
    pointers.current.delete(e.pointerId)
    if(e.type==='pointercancel'){start.current=null;liveDrag.current=null;setDrag(null);moved.current=true}
    else if(!pointers.current.size){
      if(liveDrag.current){onPlace(liveDrag.current.id,liveDrag.current.position);liveDrag.current=null;setDrag(null)}
      else if(!moved.current&&start.current?.partId){
        if(moving===start.current.partId){/* Move mode owns the whole selected Part, including edges. */}
        else if(start.current.edge)onEdge({partId:start.current.partId,edge:start.current.edge})
        else onSelect(start.current.partId)
      }
      start.current=null
    }
    reset()
  }
  const zoom=(factor:number)=>{const b=liveBox.current;setManual({x:b.x+b.width*(1-factor)/2,y:b.y+b.height*(1-factor)/2,width:b.width*factor,height:b.height*factor})}
  return <div className="sm-canvas-shell" ref={shell} data-moving={!!moving}>
    <div className="sm-canvas-commandbar">{toolbar}<div className="sm-canvas-tools"><button onClick={()=>zoom(.8)} aria-label="Zoom in">＋</button><button onClick={()=>zoom(1.25)} aria-label="Zoom out">−</button><button onClick={()=>setManual(null)}>Fit All</button></div></div>
    <svg ref={svg} className="sm-canvas" aria-label={area.name+' measurement worksheet'} role="group" viewBox={box.x+' '+box.y+' '+box.width+' '+box.height} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {layout.map(item=>{
        const {shape,points,local}=item,position=drag?.id===shape.id?drag.position:{x:item.x,y:item.y},g=calculate(shape)
        const sign=polygonArea(points)>0?1:-1
        return <g key={shape.id} data-shape={shape.id} transform={'translate('+position.x+' '+position.y+')'}>
          <text x="0" y="-78" className="sm-part-title">{shape.name.length>36?shape.name.slice(0,35)+'…':shape.name}</text>
          <text x="0" y="-57" className="sm-part-caption">{item.guide?'Incomplete · template not to scale':shape.basis==='cabinet'?'Cabinet + overhangs':'Finished measurements'}{shape.notes||shape.fieldRecords.length?' · notes / checks in Edit':''}</text>
          <path className={item.guide?'sm-template-guide':'sm-top'} data-selected={selected===shape.id} d={path(points)} role="button" tabIndex={0} aria-label={'Part '+shape.name} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(shape.id)}}}/>
          {shape.basis==='cabinet'&&g.base?<path className="sm-cabinet" d={path(g.base.map(local))}/>:null}
          {item.guide?<text x={item.width/2} y={item.height/2} className="sm-guide-watermark" textAnchor="middle">MEASURE EDGES</text>:null}
          {edgeOrder(shape).map((edge,i)=>{
            const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=sign*dy/len,ny=-sign*dx/len
            const offset=34,la={x:a.x+nx*offset,y:a.y+ny*offset},lb={x:b.x+nx*offset,y:b.y+ny*offset},mid={x:(la.x+lb.x)/2,y:(la.y+lb.y)/2}
            const active=selectedEdge?.partId===shape.id&&selectedEdge.edge===edge,n=edgeLength(shape,edge,!!g.top)
            return <g key={edge} data-edge={edge} role="button" tabIndex={0} aria-label={shape.name+' '+edgeNames[edge]} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onEdge({partId:shape.id,edge})}}} className="sm-edge" data-selected={active}>
              <line className="sm-edge-highlight" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
              <line className="sm-dimension-line" x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}/>
              {[{p:a,q:la},{p:b,q:lb}].map((p,j)=><line key={j} className="sm-dimension-line" x1={p.p.x} y1={p.p.y} x2={p.q.x+nx*5} y2={p.q.y+ny*5}/>)}
              <rect className="sm-label-bg" x={mid.x-52} y={mid.y-15} width="104" height="30" rx="6"/>
              <text className="sm-edge-value" x={mid.x} y={mid.y+6} textAnchor="middle">{n===null?'?':formatLength(n,unit).replace('待量 / Unknown','?')}</text>
              <line className="sm-edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
            </g>
          })}
          {g.top?shape.references.map(ref=>{
            const rg=referenceGeometry(ref,shape,g)
            return <g key={ref.id} className="sm-reference">
              {rg.lines.map((l,i)=>{const a=local(l.a),b=local(l.b);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>})}
              {rg.point?<circle cx={local(rg.point).x} cy={local(rg.point).y} r="5"/>:null}
              {rg.lines[0]?<text x={local(rg.lines[0].a).x+8} y={local(rg.lines[0].a).y+24}>{ref.kind==='sink'?'Sink Center':'Cooktop'}{value(ref.y)===null?' · Y unknown':value(ref.x)===null?' · X unknown':''}</text>:null}
            </g>
          }):null}
        </g>
      })}
    </svg>
    {!layout.length?<div className="sm-empty"><h2>Add the first part</h2><p>Choose Rectangle or L-shape, then tap the edge you measured.</p></div>:null}
    <p className="sm-canvas-hint">{moving?'MOVE PART · drag the selected geometry · Done moving to measure edges · blank space pans; two fingers zoom':'Tap inside a part to select · tap a line to measure · drag blank space to pan · pinch to zoom'}</p>
  </div>
}
