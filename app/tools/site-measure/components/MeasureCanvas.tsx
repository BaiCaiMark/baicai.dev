'use client'
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { bounds, calculate, transformPoint, referenceGeometry, area as polygonArea, type Bounds, type Point } from '../core/geometry'
import { edgeOrder, value, type Area, type Edge } from '../core/model'
import { displayOutline, edgeNames, edgeLength, fieldMeasurementText, worksheetLayout } from '../core/worksheet'
import { formatLength, type Unit } from '../core/units'

export type EdgeSelection = { partId: string; edge: Edge }
type Props = { area: Area; selected: string | null; selectedEdge: EdgeSelection | null; unit: Unit; onSelect: (id: string) => void; onEdge: (selection: EdgeSelection) => void; onPlace: (id: string, position: Point) => void }
type Touch = Point
const path = (points: Point[]) => points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')+' Z'
export default function MeasureCanvas({ area, selected, selectedEdge, unit, onSelect, onEdge, onPlace }: Props) {
  const svg = useRef<SVGSVGElement>(null), shell = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number,Touch>())
  const gesture = useRef<{center:Point;distance:number;box:Bounds;scale:number} | null>(null)
  const start = useRef<{x:number;y:number;partId:string|null;edge:Edge|null;position:Point|null} | null>(null)
  const moved = useRef(false)
  const [manual,setManual]=useState<Bounds|null>(null),[ratio,setRatio]=useState(1.8)
  const [arranging,setArranging]=useState(false),[drag,setDrag]=useState<{id:string;position:Point}|null>(null)
  const layout=useMemo(()=>worksheetLayout(area.shapes),[area.shapes])
  const fitted=useMemo(()=>{
    if(!layout.length)return{x:0,y:0,width:1360,height:650}
    const x=Math.min(...layout.map(p=>p.x))-30,y=Math.min(...layout.map(p=>p.y))-30
    return{x,y,width:Math.max(...layout.map(p=>p.x+640))-x+30,height:Math.max(...layout.map(p=>p.y+490))-y+30}
  },[layout])
  const fit={...fitted}
  if(fit.width/fit.height<ratio){const w=fit.height*ratio;fit.x-=(w-fit.width)/2;fit.width=w}
  else{const h=fit.width/ratio;fit.y-=(h-fit.height)/2;fit.height=h}
  const box=manual??fit,liveBox=useRef(box),liveDrag=useRef(drag)
  useLayoutEffect(()=>{liveBox.current=box;liveDrag.current=drag},[box,drag])
  useLayoutEffect(()=>{
    const node=shell.current;if(!node)return
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
    gesture.current=pointers.current.size?{...center(),box:liveBox.current,scale:matrix?1/matrix.a:1}:null
  }
  const down=(e:PointerEvent<SVGSVGElement>)=>{
    if(e.pointerType==='mouse'&&e.button!==0)return
    e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pointers.current.size===1){
      const target=e.target as Element,partId=target.closest('[data-shape]')?.getAttribute('data-shape')??null
      const item=layout.find(p=>p.shape.id===partId)
      start.current={x:e.clientX,y:e.clientY,partId,edge:target.closest('[data-edge]')?.getAttribute('data-edge') as Edge|null,position:item?{x:item.x,y:item.y}:null};moved.current=false
    }else{moved.current=true;liveDrag.current=null;setDrag(null)}
    reset()
  }
  const move=(e:PointerEvent<SVGSVGElement>)=>{
    if(!pointers.current.has(e.pointerId)||!gesture.current)return
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    const base=gesture.current,now=center()
    if(start.current&&Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>7)moved.current=true
    if(!moved.current)return
    const dx=(now.center.x-base.center.x)*base.scale,dy=(now.center.y-base.center.y)*base.scale
    if(arranging&&pointers.current.size===1&&start.current?.partId&&start.current.position){
      const position={x:Math.max(-10000,Math.min(10000,start.current.position.x+dx)),y:Math.max(-10000,Math.min(10000,start.current.position.y+dy))}
      const next={id:start.current.partId,position};liveDrag.current=next;setDrag(next);return
    }
    const factor=base.distance&&now.distance?Math.min(10,Math.max(.1,base.distance/now.distance)):1
    const rect=e.currentTarget.getBoundingClientRect()
    const ax=base.box.x+(base.center.x-rect.left)*base.scale,ay=base.box.y+(base.center.y-rect.top)*base.scale
    const next={x:ax-(ax-base.box.x)*factor-dx*factor,y:ay-(ay-base.box.y)*factor-dy*factor,width:base.box.width*factor,height:base.box.height*factor}
    liveBox.current=next;setManual(next)
  }
  const up=(e:PointerEvent<SVGSVGElement>)=>{
    pointers.current.delete(e.pointerId)
    if(e.type!=='pointercancel'){
      if(liveDrag.current){onPlace(liveDrag.current.id,liveDrag.current.position);liveDrag.current=null;setDrag(null)}
      else if(!moved.current&&start.current?.partId){
        if(start.current.edge)onEdge({partId:start.current.partId,edge:start.current.edge})
        else onSelect(start.current.partId)
      }
    }else{liveDrag.current=null;setDrag(null)}
    reset()
  }
  const zoom=(factor:number)=>{const b=liveBox.current;setManual({x:b.x+b.width*(1-factor)/2,y:b.y+b.height*(1-factor)/2,width:b.width*factor,height:b.height*factor})}
  return <div className="sm-canvas-shell" ref={shell}>
    <div className="sm-canvas-tools"><button onClick={()=>zoom(.8)} aria-label="Zoom in">＋</button><button onClick={()=>zoom(1.25)} aria-label="Zoom out">−</button><button onClick={()=>setManual(null)}>Fit All</button><button aria-pressed={arranging} onClick={()=>setArranging(!arranging)}>Arrange parts</button></div>
    <svg ref={svg} className="sm-canvas" aria-label={area.name+' measurement worksheet'} role="group" viewBox={box.x+' '+box.y+' '+box.width+' '+box.height} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {layout.map(item=>{
        const {shape}=item,position=drag?.id===shape.id?drag.position:{x:item.x,y:item.y}
        const display=displayOutline(shape),rotated=display.points.map(p=>transformPoint(p,shape)),bb=bounds(rotated),g=calculate(shape)
        const scale=Math.min(400/Math.max(bb.width,1),225/Math.max(bb.height,1))
        const origin={x:320-bb.width*scale/2,y:105+(225-bb.height*scale)/2}
        const local=(p:Point)=>{const t=transformPoint(p,shape);return{x:origin.x+(t.x-bb.x)*scale,y:origin.y+(t.y-bb.y)*scale}}
        const points=display.points.map(local),sign=polygonArea(points)>0?1:-1
        return <g key={shape.id} data-shape={shape.id} transform={'translate('+position.x+' '+position.y+')'}>
          <rect className="sm-part-paper" data-selected={selected===shape.id} width="640" height="490" rx="12"/>
          <text x="24" y="34" className="sm-part-title" role="button" tabIndex={0} aria-label={'Part '+shape.name} onKeyDown={e=>{if(e.key==='Enter')onSelect(shape.id)}}>{shape.name}</text>
          <text x="24" y="60" className="sm-part-caption">{display.guide?'Template guide · incomplete · not to scale':shape.basis==='cabinet'?'Cabinet + applied overhangs':'Finished countertop measurements'}</text>
          {shape.basis==='cabinet'&&g.base?<path className="sm-cabinet" d={path(g.base.map(local))}/>:null}
          <path className={display.guide?'sm-template-guide':'sm-top'} data-selected={selected===shape.id} d={path(points)}/>
          {display.guide?<text x="320" y="235" className="sm-guide-watermark" textAnchor="middle">MEASURE EDGES</text>:null}
          {edgeOrder(shape).map((edge,i)=>{
            const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=sign*dy/len,ny=-sign*dx/len
            const offset=30,la={x:a.x+nx*offset,y:a.y+ny*offset},lb={x:b.x+nx*offset,y:b.y+ny*offset},mid={x:(la.x+lb.x)/2,y:(la.y+lb.y)/2}
            const active=selectedEdge?.partId===shape.id&&selectedEdge.edge===edge
            const n=edgeLength(shape,edge,!!g.top)
            return <g key={edge} data-edge={edge} role="button" tabIndex={0} aria-label={shape.name+' '+edgeNames[edge]} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onEdge({partId:shape.id,edge})}}} className="sm-edge" data-selected={active}>
              <line className="sm-edge-highlight" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
              <line className="sm-dimension-line" x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}/>
              {[{p:a,q:la},{p:b,q:lb}].map((p,j)=><line key={j} className="sm-dimension-line" x1={p.p.x} y1={p.p.y} x2={p.q.x+nx*5} y2={p.q.y+ny*5}/>)}
              <rect className="sm-label-bg" x={mid.x-58} y={mid.y-17} width="116" height="34" rx="6"/>
              <text className="sm-edge-value" x={mid.x} y={mid.y+7} textAnchor="middle">{n===null?'?':formatLength(n,unit).replace('待量 / Unknown','?')}</text>
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
          <text x="24" y="410" className="sm-part-records">{shape.notes?shape.notes.slice(0,66):'Tap an edge to enter a measurement'}</text>
          {(shape.fieldRecords??[]).slice(0,2).map((r,i)=><text key={r.id} x="24" y={438+i*23} className="sm-field-record" data-record={r.id}>{(r.kind==='note'?'Note: '+r.text:(r.label||'Reference')+': '+fieldMeasurementText(r.measurement,unit)).slice(0,76)}</text>)}
          {(shape.fieldRecords?.length??0)>2?<text x="580" y="480" className="sm-part-caption">+{shape.fieldRecords.length-2} more</text>:null}
        </g>
      })}
    </svg>
    {!layout.length?<div className="sm-empty"><h2>Add the first part</h2><p>Choose Rectangle or L-shape, then tap the edge you measured.</p></div>:null}
    <p className="sm-canvas-hint">{arranging?'Drag a part to arrange the worksheet. Positions are not surveyed.':'Tap a line to measure · drag blank space to pan · pinch to zoom'}</p>
  </div>
}
