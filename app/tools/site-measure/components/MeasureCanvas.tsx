'use client'
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { calculate, referenceGeometry, area as polygonArea, type Bounds, type Point } from '../core/geometry'
import { sinkPin } from './sink-pin'
import { edgeOrder, treatmentOf, value, type Area, type Edge } from '../core/model'
import { edgeNames, edgeLength, finishedEdgeReading, finishedFormula, worksheetLayout } from '../core/worksheet'
import { nearestEdge, type ScreenEdge } from './touch'
import { formatLength, type Unit } from '../core/units'

export type EdgeSelection = { partId: string; edge: Edge }
type Props = { area: Area; selected: string | null; selectedEdge: EdgeSelection | null; selectedReference?: string | null; floatingEditor?: ReactNode; paintToolbar?: ReactNode; paintTreatment?: string | null; directMode?: boolean; unit: Unit; snapEnabled?: boolean; orthoEnabled?: boolean; moving: string | null; toolbar: ReactNode; onSelect: (id: string) => void; onEdge: (selection: EdgeSelection) => void; onDimension?: (selection: EdgeSelection) => void; onRename?: (id:string) => void; onReference?: (partId: string, refId: string) => void; onPlace: (id: string, position: Point) => void }
const path = (points: Point[]) => points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')+' Z'
export default function MeasureCanvas({ area, selected, selectedEdge, selectedReference, floatingEditor, paintToolbar, paintTreatment, directMode, unit, moving, toolbar, snapEnabled = true, orthoEnabled = false, onSelect, onEdge, onDimension, onRename, onReference, onPlace }: Props) {
  const svg = useRef<SVGSVGElement>(null), shell = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number,Point>())
  const gesture = useRef<{center:Point;distance:number;box:Bounds;scale:number;anchor:Point} | null>(null)
  const start = useRef<{x:number;y:number;partId:string|null;edge:Edge|null;dimension:boolean;nameTap:boolean;refId:string|null;position:Point|null;handle:boolean} | null>(null)
  const moved = useRef(false)
  const [manual,setManual]=useState<Bounds|null>(null),[ratio,setRatio]=useState(1.8)
  const [canvasSize,setCanvasSize]=useState({width:1000,height:600})
  const manualView=useRef(false)
  const [drag,setDrag]=useState<{id:string;position:Point}|null>(null)
  const [editorAnchor,setEditorAnchor]=useState<Point|null>(null)
  const lastBlankTap = useRef<{time:number;point:Point}|null>(null)
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
  const screenScale=Math.max(box.width/Math.max(1,canvasSize.width),box.height/Math.max(1,canvasSize.height))
  useLayoutEffect(()=>{liveBox.current=box;liveDrag.current=drag;manualView.current=manual!==null},[box,drag,manual])
  useLayoutEffect(()=>{
    const node=svg.current;if(!node)return
    let previous={width:0,height:0}
    const measure=()=>{
      const rect=node.getBoundingClientRect(),next={width:rect.width,height:rect.height}
      if(next.width<=0||next.height<=0)return
      if(previous.width&&previous.height&&manualView.current&&(next.width!==previous.width||next.height!==previous.height)){
        const b=liveBox.current,scale=Math.max(b.width/previous.width,b.height/previous.height)
        const width=next.width*scale,height=next.height*scale
        const resized={x:b.x+(b.width-width)/2,y:b.y+(b.height-height)/2,width,height}
        liveBox.current=resized;setManual(resized)
      }
      previous=next;setRatio(next.width/Math.max(1,next.height));setCanvasSize(next)
    }
    measure();const observer=new ResizeObserver(measure);observer.observe(node)
    return()=>observer.disconnect()
  },[])
  const edgePart=selectedEdge?.partId,edgeName=selectedEdge?.edge
  useLayoutEffect(()=>{
    if(!edgePart||!edgeName)return
    let frame=0
    const reveal=()=>{
      cancelAnimationFrame(frame)
      frame=requestAnimationFrame(()=>{
        const node=svg.current,editor=document.querySelector('.sm-context')
        if(!node||!editor)return
        const line=[...node.querySelectorAll<SVGLineElement>('.sm-edge-hit')].find(l=>l.closest('[data-shape]')?.getAttribute('data-shape')===edgePart&&l.closest('[data-edge]')?.getAttribute('data-edge')===edgeName)
        const matrix=line?.getScreenCTM();if(!line||!matrix)return
        const q=new DOMPoint((line.x1.baseVal.value+line.x2.baseVal.value)/2,(line.y1.baseVal.value+line.y2.baseVal.value)/2).matrixTransform(matrix)
        const r=node.getBoundingClientRect(),panel=editor.getBoundingClientRect(),v=window.visualViewport
        // With a keyboard covering the lower page, reclaim the canvas above it before panning.
        if(v&&v.height<innerHeight*.8&&r.top>v.offsetTop+v.height*.4){
          const before=window.scrollY;window.scrollBy({top:r.top-v.offsetTop-12,behavior:'instant'})
          if(window.scrollY!==before){reveal();return}
        }
        const left=Math.max(r.left,v?.offsetLeft??0)+30,top=Math.max(r.top,v?.offsetTop??0)+30
        let right=Math.min(r.right,(v?.offsetLeft??0)+(v?.width??innerWidth))-30,bottom=Math.min(r.bottom,(v?.offsetTop??0)+(v?.height??innerHeight))-30
        if(panel.top<bottom&&panel.bottom>top){if(panel.left>left+100)right=Math.min(right,panel.left-30);else bottom=Math.min(bottom,panel.top-30)}
        if(right<=left||bottom<=top)return
        const dx=q.x-Math.max(left,Math.min(right,q.x)),dy=q.y-Math.max(top,Math.min(bottom,q.y))
        const rootMatrix=node.getScreenCTM();if(!rootMatrix)return
        if(Math.abs(dx)>.5||Math.abs(dy)>.5){const b=liveBox.current,next={...b,x:b.x+dx/rootMatrix.a,y:b.y+dy/rootMatrix.a};liveBox.current=next;setManual(next)}
      })
    }
    reveal();window.visualViewport?.addEventListener('resize',reveal);window.visualViewport?.addEventListener('scroll',reveal)
    window.addEventListener('resize',reveal)
    const observer=new ResizeObserver(reveal),editor=document.querySelector('.sm-context');if(editor)observer.observe(editor)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',reveal);window.visualViewport?.removeEventListener('resize',reveal);window.visualViewport?.removeEventListener('scroll',reveal)}
  },[edgePart,edgeName])
  useLayoutEffect(()=>{
    if(!floatingEditor||(!selectedEdge&&!selectedReference))return
    const node=svg.current,outer=shell.current
    if(!node||!outer)return
    const line=selectedEdge?[...node.querySelectorAll<SVGLineElement>('.sm-edge-hit')].find(l=>l.closest('[data-shape]')?.getAttribute('data-shape')===selectedEdge.partId&&l.closest('[data-edge]')?.getAttribute('data-edge')===selectedEdge.edge):null
    const marker=selectedReference?[...node.querySelectorAll<SVGGElement>('[data-sink-ref]')].find(n=>n.getAttribute('data-sink-ref')===selectedReference):null
    const m=line?.getScreenCTM()??marker?.getScreenCTM()
    if(!m)return
    const point=line?new DOMPoint((line.x1.baseVal.value+line.x2.baseVal.value)/2,(line.y1.baseVal.value+line.y2.baseVal.value)/2).matrixTransform(m):new DOMPoint(0,0).matrixTransform(m)
    const root=outer.getBoundingClientRect(),popupWidth=Math.min(318,root.width-16),popupHeight=Math.min(348,root.height*.76)
    const x=Math.max(8,Math.min(root.width-popupWidth-8,point.x-root.left-popupWidth/2))
    const desired=point.y-root.top-popupHeight-12
    const y=Math.max(6,Math.min(root.height-popupHeight-6,desired>54?desired:point.y-root.top+12))
    setEditorAnchor(prev=>prev&&Math.abs(prev.x-x)<.5&&Math.abs(prev.y-y)<.5?prev:{x,y})
  },[selectedEdge,selectedReference,box,layout,floatingEditor])
  // When the editing label sits low on a phone, keep its floating editor visible
  // above the mobile browser chrome / soft keyboard without changing drawing scale.
  useLayoutEffect(()=>{
    if(!editorAnchor)return
    const reveal=()=>{
      const panel=shell.current?.querySelector<HTMLElement>('.sm-canvas-floating')
      if(!panel)return
      const viewport=window.visualViewport
      const top=viewport?.offsetTop??0
      const bottom=top+(viewport?.height??window.innerHeight)
      const rect=panel.getBoundingClientRect()
      if(rect.bottom>bottom-12)window.scrollBy({top:rect.bottom-bottom+12,behavior:'instant'})
      else if(rect.top<top+12)window.scrollBy({top:rect.top-top-12,behavior:'instant'})
    }
    const frame=requestAnimationFrame(reveal)
    window.visualViewport?.addEventListener('resize',reveal)
    return()=>{cancelAnimationFrame(frame);window.visualViewport?.removeEventListener('resize',reveal)}
  },[editorAnchor,edgePart,edgeName,selectedReference])
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
      const target=e.target as Element,handle=!!target.closest('[data-move-handle]')
      const refId=target.closest('[data-sink-ref]')?.getAttribute('data-sink-ref')??null
      let partId=target.closest('[data-shape]')?.getAttribute('data-shape')??null
      const dimension=!!directMode&&!!target.closest('[data-dimension]')
      const nameTap=!!directMode&&!!target.closest('[data-part-title]')
      let edge=target.closest('[data-dimension]')?.closest('[data-edge]')?.getAttribute('data-edge') as Edge|null
      if(!edge&&target.closest('.sm-direct-edge-name,.sm-direct-note-pin'))edge=target.closest('[data-edge]')?.getAttribute('data-edge') as Edge|null
      if(!handle&&!dimension&&!edge&&!refId&&!nameTap){
        const candidates:ScreenEdge[]=[]
        // Resolve all nearby edges in screen space, independent of transparent stroke paint order.
        e.currentTarget.querySelectorAll<SVGLineElement>('.sm-edge-hit').forEach(line=>{
          const m=line.getScreenCTM();if(!m)return
          const a=new DOMPoint(line.x1.baseVal.value,line.y1.baseVal.value).matrixTransform(m)
          const b=new DOMPoint(line.x2.baseVal.value,line.y2.baseVal.value).matrixTransform(m)
          candidates.push({partId:line.closest('[data-shape]')!.getAttribute('data-shape')!,edge:line.closest('[data-edge]')!.getAttribute('data-edge') as Edge,a,b})
        })
        const hit=nearestEdge({x:e.clientX,y:e.clientY},candidates)
        if(hit){partId=hit.partId;edge=hit.edge}
      }
      const item=layout.find(p=>p.shape.id===partId)
      if(partId)lastBlankTap.current=null
      start.current={x:e.clientX,y:e.clientY,partId,edge,dimension,nameTap,refId,position:item?{x:item.x,y:item.y}:null,handle};moved.current=false
    }else{moved.current=true;start.current=null;lastBlankTap.current=null;liveDrag.current=null;setDrag(null)}
    reset()
  }
  const move=(e:PointerEvent<SVGSVGElement>)=>{
    if(!pointers.current.has(e.pointerId)||!gesture.current)return
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    const base=gesture.current,now=center()
    if(start.current&&Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>7)moved.current=true
    if(!moved.current)return
    const dx=(now.center.x-base.center.x)*base.scale,dy=(now.center.y-base.center.y)*base.scale
    if(pointers.current.size===1&&start.current?.partId&&!start.current.nameTap&&!(directMode&&start.current.edge)){
      // A selected part can be dragged directly from its interior. Edge taps keep measurement priority.
      if(start.current.refId||(!start.current.handle&&moving!==start.current.partId&&selected!==start.current.partId)||!start.current.position)return
      let moveX=dx,moveY=dy
      if((orthoEnabled||e.shiftKey)&&!start.current.handle){
        if(Math.abs(e.clientX-start.current.x)>=Math.abs(e.clientY-start.current.y))moveY=0
        else moveX=0
      }
      let position={x:start.current.position.x+moveX,y:start.current.position.y+moveY}
      if(snapEnabled){
        const current=layout.find(p=>p.shape.id===start.current!.partId)
        if(current){
          const threshold=10*base.scale
          const nearest=(raw:number,source:number[],targets:number[])=>{
            let nearest=raw,distance=threshold
            for(const s of source)for(const t of targets){const offset=t-s,delta=Math.abs(offset);if(delta<distance){distance=delta;nearest=raw+offset}}
            return nearest
          }
          const others=layout.filter(p=>p.shape.id!==current.shape.id)
          if(others.length){
            if(!(orthoEnabled||e.shiftKey)||moveX!==0){
              const xs=others.flatMap(p=>[p.x,p.x+p.width,p.x+p.width/2])
              position.x=nearest(position.x,[position.x,position.x+current.width,position.x+current.width/2],xs)
            }
            if(!(orthoEnabled||e.shiftKey)||moveY!==0){
              const ys=others.flatMap(p=>[p.y,p.y+p.height,p.y+p.height/2])
              position.y=nearest(position.y,[position.y,position.y+current.height,position.y+current.height/2],ys)
            }
          }
        }
      }
      position={x:Math.max(-10000,Math.min(10000,position.x)),y:Math.max(-10000,Math.min(10000,position.y))}
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
    if(e.type==='pointercancel'||e.type==='lostpointercapture'){start.current=null;liveDrag.current=null;setDrag(null);moved.current=true}
    else if(!pointers.current.size){
      if(liveDrag.current){onPlace(liveDrag.current.id,liveDrag.current.position);liveDrag.current=null;setDrag(null)}
      else if(!moved.current&&start.current?.partId){
        setManual(liveBox.current)
        if(start.current.handle||moving===start.current.partId){/* Move mode owns the whole selected Part, including edges. */}
        else if(start.current.nameTap)onRename?.(start.current.partId)
        else if(start.current.refId)onReference?.(start.current.partId,start.current.refId)
        else if(start.current.edge&&start.current.dimension)onDimension?.({partId:start.current.partId,edge:start.current.edge})
        else if(start.current.edge)onEdge({partId:start.current.partId,edge:start.current.edge})
        else onSelect(start.current.partId)
      }
      else if(!moved.current&&start.current&&!start.current.partId){
        // Only a stationary double-tap on empty canvas recenters the entire drawing.
        // Shape, edge, dimension and two-finger gestures never trigger Fit All.
        const now=performance.now(),previous=lastBlankTap.current
        const point={x:e.clientX,y:e.clientY}
        if(previous&&now-previous.time<340&&Math.hypot(point.x-previous.point.x,point.y-previous.point.y)<30){
          manualView.current=false;setManual(null);lastBlankTap.current=null
        }else lastBlankTap.current={time:now,point}
      }else lastBlankTap.current=null
      start.current=null
    }
    reset()
  }
  return <div className="sm-canvas-shell" ref={shell} data-moving={!!moving} data-direct={!!directMode} data-painting={!!paintTreatment}>
    {toolbar?<div className="sm-canvas-commandbar">{toolbar}</div>:null}
    <svg ref={svg} className="sm-canvas" aria-label={area.name+' measurement worksheet'} role="group" viewBox={box.x+' '+box.y+' '+box.width+' '+box.height} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={e=>{if(pointers.current.has(e.pointerId))up(e)}}>
      {layout.map(item=>{
        const {shape,points,local}=item,position=drag?.id===shape.id?drag.position:{x:item.x,y:item.y},g=calculate(shape)
        const sign=polygonArea(points)>0?1:-1
        return <g key={shape.id} data-shape={shape.id} transform={'translate('+position.x+' '+position.y+')'}>
          <text x="0" y={directMode?"-110":"-78"} className="sm-part-title" data-part-title={directMode?'true':undefined} role={directMode?'button':undefined} tabIndex={directMode?0:undefined} aria-label={directMode?'Rename part '+shape.name:undefined} onKeyDown={e=>{if(directMode&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();onRename?.(shape.id)}}}>{shape.name.length>36?shape.name.slice(0,35)+'…':shape.name}</text>
          <text x="0" y={directMode?"-86":"-57"} className="sm-part-caption">{directMode?(g.top?'Finished':'Finished · incomplete'):(item.guide?'Incomplete · template not to scale':shape.basis==='cabinet'?'Cabinet + overhangs':'Finished measurements')}{!directMode&&(shape.notes||shape.fieldRecords.length)?' · notes / checks in Edit':''}</text>
          <path className={item.guide?'sm-template-guide':'sm-top'} data-selected={selected===shape.id} d={path(points)} role="button" tabIndex={0} aria-label={'Part '+shape.name} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(shape.id)}}}/>
          {shape.basis==='cabinet'&&g.base?<path className="sm-cabinet" d={path(g.base.map(local))}/>:null}
          {item.guide&&!directMode?<text x={item.width/2} y={item.height/2} className="sm-guide-watermark" textAnchor="middle">MEASURE EDGES</text>:null}
          {edgeOrder(shape).map((edge,i)=>{
            const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=sign*dy/len,ny=-sign*dx/len
            const offset=34,la={x:a.x+nx*offset,y:a.y+ny*offset},lb={x:b.x+nx*offset,y:b.y+ny*offset},mid={x:(la.x+lb.x)/2,y:(la.y+lb.y)/2}
            const active=selectedEdge?.partId===shape.id&&selectedEdge.edge===edge
            // Cabinet measurements may be used to solve the outline, but must never be displayed as finished dimensions.
            const n=directMode?finishedEdgeReading(shape,edge):(g.top?edgeLength(shape,edge):shape.basis==='finished'?edgeLength(shape,edge,false):null)
            const formula=directMode?finishedFormula(shape,edge,unit):null
            return <g key={edge} data-edge={edge} role="button" tabIndex={0} aria-label={shape.name+' '+edgeNames[edge]} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setManual(liveBox.current);onEdge({partId:shape.id,edge})}}} className="sm-edge" data-selected={active} data-treatment={treatmentOf(shape,edge)??"unset"}>
              <line className="sm-edge-selection-halo" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
              <line className="sm-edge-highlight" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
              <line className="sm-dimension-line" x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}/>
              {[{p:a,q:la},{p:b,q:lb}].map((p,j)=><line key={j} className="sm-dimension-line" x1={p.p.x} y1={p.p.y} x2={p.q.x+nx*5} y2={p.q.y+ny*5}/>)}
              <rect data-dimension="true" className="sm-label-bg" x={mid.x-(formula?72:52)} y={mid.y-(formula?24:15)} width={formula?144:104} height={formula?48:30} rx="6" role={directMode?'button':undefined} tabIndex={directMode?0:undefined} aria-label={directMode?'Edit finished dimension '+shape.name+' '+edge:undefined} onKeyDown={e=>{if(directMode&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();onDimension?.({partId:shape.id,edge})}}}/>

              {formula?<text className="sm-edge-formula" x={mid.x} y={mid.y-6} textAnchor="middle">{formula}</text>:null}
              <text className="sm-edge-value" x={mid.x} y={mid.y+(formula?15:6)} textAnchor="middle">{n===null?'?':formatLength(n,unit).replace('待量 / Unknown','?')}</text>
              {shape.fieldRecords.filter(r=>r.kind==='note'&&r.edge===edge&&r.text.trim()).slice(0,1).map(r=><text key={r.id} className="sm-direct-note-pin" textAnchor="middle" x={mid.x} y={mid.y+48}>{r.kind==='note'?'✎ '+r.text.slice(0,24)+(r.text.length>24?'…':''):''}</text>)}
              <line className="sm-edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>
            </g>
          })}
          {g.top?shape.references.map(ref=>{
            const rg=referenceGeometry(ref,shape,g)
            return <g key={ref.id} className="sm-reference">
              {rg.lines.map((l,i)=>{const a=local(l.a),b=local(l.b);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>})}
              {rg.point?<circle cx={local(rg.point).x} cy={local(rg.point).y} r="5"/>:null}
              {rg.lines[0]&&(!directMode||ref.kind!=='sink')?<text x={local(rg.lines[0].a).x+8} y={local(rg.lines[0].a).y+24}>{ref.kind==='sink'?'Sink Center':'Cooktop'}{value(ref.y)===null?' · Y unknown':value(ref.x)===null?' · X unknown':''}</text>:null}
            </g>
          }):null}
          {shape.references.map(ref=>{
            const rg=g.top?referenceGeometry(ref,shape,g):null
            const point=rg?.point?local(rg.point):ref.kind==='sink'?sinkPin(ref,shape,g,local,item.width,item.height):{x:item.width*.5,y:item.height*.5}
            const positioned=ref.kind==='sink'?value(ref.x)!==null:!!rg?.point
            const sinkNumber=shape.references.filter(r=>r.kind==='sink').findIndex(r=>r.id===ref.id)+1
            return <g key={'pin-'+ref.id} className="sm-direct-sink-pin" data-sink-ref={ref.id} data-x-only={ref.kind==='sink'&&value(ref.y)===null} transform={'translate('+point.x+' '+point.y+')'} role="button" tabIndex={0}
              aria-label={'Edit '+(ref.kind==='sink'?'Sink Center':'Cooktop')+' location'} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onReference?.(shape.id,ref.id)}}}>
              <rect x="-38" y="-18" width="76" height="36" rx="8"/>
              <text textAnchor="middle" y="5">{ref.kind==='sink'?'S'+sinkNumber+' '+(positioned?formatLength(value(ref.x),unit):'?'):'Cooktop'}{ref.kind==='sink'?'':positioned?'':' ?'}</text>
            </g>
          })}
          {selected===shape.id&&!directMode?<g data-move-handle="true" className="sm-move-handle" role="button" tabIndex={0} aria-label={'Drag '+shape.name} transform={'translate('+(item.width+30*screenScale)+' '+(-55*screenScale)+') scale('+screenScale+')'} onKeyDown={e=>{
            const direction=({ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}} as Record<string,Point>)[e.key]
            if(direction){e.preventDefault();setManual(liveBox.current);const step=(e.shiftKey?40:10)*screenScale;onPlace(shape.id,{x:Math.max(-10000,Math.min(10000,item.x+direction.x*step)),y:Math.max(-10000,Math.min(10000,item.y+direction.y*step))})}
          }}><title>Drag to move · arrow keys also work</title><rect x="-22" y="-22" width="44" height="44" rx="10"/><path d="M-12 0H12M0-12V12M-12 0l4-4M-12 0l4 4M12 0l-4-4M12 0l-4 4M0-12l-4 4M0-12l4 4M0 12l-4-4M0 12l4-4"/></g>:null}
        </g>
      })}
    </svg>
    {paintToolbar}
    {floatingEditor&&(selectedEdge||selectedReference)&&editorAnchor?<div className="sm-canvas-floating" style={{left:editorAnchor.x,top:editorAnchor.y}}>{floatingEditor}</div>:null}
    {!layout.length?<div className="sm-empty"><h2>Add the first part</h2><p>Choose Rectangle or L-shape, then tap the edge you measured.</p></div>:null}
    <p className="sm-canvas-hint">{moving?'Move selected part · tap Done moving to measure edges':'Tap edge to measure · tap part then drag inside it to move · blank space pans · two fingers zoom'}</p>
  </div>
}
