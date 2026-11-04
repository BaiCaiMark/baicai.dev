'use client'
import { useLayoutEffect, useState, type ReactNode } from 'react'
import QuantityField from './QuantityField'
import { calculate, bounds } from '../core/geometry'
import { edgeOrder, quantity, setTreatment, treatmentOf, value, type Edge, type Project, type Shape, type Treatment } from '../core/model'
import { formatLength } from '../core/units'

const edgeLabel: Record<Edge,string> = {
  back:'Back',right:'Right',front:'Front',left:'Left',innerX:'Inner horizontal',innerY:'Inner vertical',
}
const treatmentName: Record<Treatment,string> = {'no-polish':'No Polish',polish:'Polish',miter:'Miter'}
function formula(base:number|null,a:number|null,b:number|null,unit:Project['unit']) {
  if(base===null||a===null||b===null)return 'Incomplete'
  const parts=[a,base,b].filter((n,i)=>i===1||n!==0)
  return parts.map(n=>formatLength(n,unit)).join(' + ')+' = '+formatLength(base+a+b,unit)
}
function QuickPanelPosition({children}:{children:ReactNode}) {
  useLayoutEffect(()=>{
    const panel=document.querySelector<HTMLElement>('.sm-context')
    if(!panel)return
    const studio=panel.closest<HTMLElement>('.sm-studio')
    const size=()=>{
      const viewport=window.visualViewport
      const top=viewport?.offsetTop??0,height=viewport?.height??innerHeight
      const mobile=innerWidth<=700
      const canvas=document.querySelector('.sm-canvas-shell')?.getBoundingClientRect()
      const y=mobile?top+Math.max(8,height-Math.min(500,height*.57)):top+Math.max(8,Math.min(canvas?.top??80,height-300))
      panel.style.top=y+'px'
      panel.style.height=Math.max(100,Math.min(mobile?height*.57:650,top+height-y-8))+'px'
      studio?.style.setProperty('--sm-keyboard-space',height<innerHeight*.8?Math.max(0,innerHeight-height)+'px':'0px')
    }
    size()
    window.addEventListener('resize',size)
    window.visualViewport?.addEventListener('resize',size)
    window.visualViewport?.addEventListener('scroll',size)
    return()=>{studio?.style.removeProperty('--sm-keyboard-space');window.removeEventListener('resize',size);window.visualViewport?.removeEventListener('resize',size);window.visualViewport?.removeEventListener('scroll',size)}
  },[])
  return <>{children}</>
}
type Props={project:Project;shape:Shape;edge:Edge|null;onChange:(recipe:(s:Shape)=>void,group?:string)=>void;onEnd:()=>void;onClose:()=>void;onDetails:()=>void}
export default function QuickMeasurePanel({project,shape,edge,onChange,onEnd,onClose,onDetails}:Props) {
  const [active,setActive]=useState<Edge|null>(edge)
  const [custom,setCustom]=useState(false)
  const sides=edgeOrder(shape),selected=active??'front'
  const g=calculate(shape),w=value(shape.dimensions.width),h=value(shape.dimensions.height)
  const rect=shape.template==='rectangle',step=shape.profile==='vanity-step'
  const chosen=treatmentOf(shape,selected)
  const allowance=shape.allowances[selected]
  const length=rect&&shape.basis==='cabinet'?formula(w,value(shape.allowances.left),value(shape.allowances.right),project.unit):null
  const depth=rect&&shape.basis==='cabinet'?formula(h,value(shape.allowances.back),value(shape.allowances.front),project.unit):null
  const missing=sides.filter(e=>value(shape.allowances[e])===null)
  const bb=g.top?bounds(g.top):null
  const ready=!!g.top
  const dim=(key:'width'|'height'|'legX'|'legY',label:string)=><QuantityField key={key} label={label} quantity={shape.dimensions[key]} unit={project.unit} onEnd={onEnd} onChange={q=>onChange(s=>{s.dimensions[key]=q},shape.id+key)}/>
  const options=project.unit==='in'
    ? selected==='front'?['1 1/2','1 3/4','0','1/8']:['1/2','3/4','1','0','1/8']
    : selected==='front'?['38.1','44.45','0']:['12.7','19.05','25.4','0','3.175']
  const setOverhang=(input:string)=>{onChange(s=>{s.allowances[selected]=quantity(input,project.unit,'allowance')},shape.id+selected);onEnd()}
  const setEdgeTreatment=(next:Treatment)=>{onChange(s=>{setTreatment(s,selected,next,project)});onEnd()}
  return <aside className="sm-context sm-quick-panel" data-edge-selected={!!edge} aria-label="Quick measurement editor">
    <QuickPanelPosition><></></QuickPanelPosition>
    <header className="sm-context-heading"><div><span>QUICK MEASURE</span><h2>{shape.name}</h2><p>{ready&&bb?'Finished '+formatLength(bb.width,project.unit)+' × '+formatLength(bb.height,project.unit):'Finished · incomplete'}</p></div><button className="sm-primary sm-editor-done" onClick={()=>{onEnd();onClose()}}>Done</button></header>
    <div className="sm-context-body">
      <section className="sm-quick-dimensions"><div className="sm-quick-section-title"><strong>{shape.basis==='cabinet'?'Cabinet size':'Finished size'}</strong><span>{project.unit==='in'?'inch':'mm'}</span></div>
        <div className="sm-quick-fields">{dim('width',step?'Total length':'Length')}{dim('height',step?'Max depth':'Depth')}</div>
        {!rect?<div className="sm-quick-fields">{dim('legX',step?'Shallow depth':'Right end depth')}{dim('legY',step?'Deep section width':'Lower end width')}</div>:null}
        {step?<div className="sm-vanity-step-guide">
          <p><strong>Stepped Vanity · Deep {shape.mirrored?'Right':'Left'}</strong> <span>· mirrored shape in the uploaded DXF</span></p>
          <div className="sm-quick-choices"><button type="button" aria-pressed={!shape.mirrored} onClick={()=>{onChange(s=>{s.mirrored=false});onEnd()}}>Deep Left</button><button type="button" aria-pressed={shape.mirrored} onClick={()=>{onChange(s=>{s.mirrored=true});onEnd()}}>Deep Right</button></div>
          <p>DXF silhouette example: 70″ total, 22.5″ max depth, 7″ shallow depth, 40″ deep section. <strong>Enter actual Cabinet measurements.</strong> Sink and edge treatment were not supplied.</p>
        </div>:null}
      </section>
      <section className="sm-quick-edges">
        <div className="sm-quick-section-title"><strong>Edge treatment</strong><span>Tap an edge below or on the drawing</span></div>
        <div className="sm-quick-edge-grid">{sides.map(e=><button key={e} type="button" aria-pressed={selected===e} onClick={()=>{setActive(e);setCustom(false);onEnd()}}><span>{edgeLabel[e]}</span><strong>{treatmentOf(shape,e)?treatmentName[treatmentOf(shape,e)!]:'Not set'}</strong><small>{formatLength(value(shape.allowances[e]),project.unit)}</small></button>)}</div>
        <h3>{edgeLabel[selected]} edge</h3>
        <div className="sm-quick-choices" aria-label={edgeLabel[selected]+' treatment'}>
          {(['no-polish','polish','miter'] as Treatment[]).map(t=><button key={t} type="button" aria-pressed={chosen===t} onClick={()=>setEdgeTreatment(t)}>{treatmentName[t]}</button>)}
        </div>
        <div className="sm-quick-section-title"><strong>{edgeLabel[selected]} overhang</strong><span>{allowance.origin==='default'?'Default · check on site':'Custom / measured'}</span></div>
        <div className="sm-quick-choices" aria-label={edgeLabel[selected]+' overhang'}>
          {options.map(n=><button key={n} type="button" aria-pressed={value(allowance)===value(quantity(n,project.unit))} onClick={()=>{setCustom(false);setOverhang(n)}}>{n}{project.unit==='in'?'″':' mm'}</button>)}
          <button type="button" aria-pressed={custom} onClick={()=>setCustom(true)}>Custom…</button>
        </div>
        {custom?<QuantityField label="Custom overhang" quantity={allowance} unit={project.unit} allowance autoFocus onEnd={onEnd} onChange={q=>onChange(s=>{s.allowances[selected]=q},shape.id+selected)}/>:null}
        {chosen==='miter'?<p className="sm-quick-notice">Miter is recorded as a treatment only. Joint type and slab-thickness compensation are not calculated.</p>:null}
        {missing.length?<button className="sm-quick-fill" onClick={()=>{onChange(s=>{for(const e of missing){s.allowances[e]= {...quantity('0',project.unit,'default'),defaultRevision:project.defaults.revision}}});onEnd()}}>Set {missing.map(e=>edgeLabel[e]).join(', ')} unknown overhang to 0</button>:null}
      </section>
      <section className="sm-quick-result">
        {shape.basis==='cabinet'&&rect?<><strong>Cabinet → Finished</strong><p>Length · {length}</p><p>Depth · {depth}</p></>:null}
        {ready&&bb?<p className="sm-quick-final">Finished: {formatLength(bb.width,project.unit)} × {formatLength(bb.height,project.unit)}</p>:<p className="sm-quick-notice">Not ready: {g.errors.slice(0,3).join('; ')}. You can keep these measurements and finish later.</p>}
      </section>
      <button className="sm-quick-details" onClick={onDetails}>More details · Sink Center, Notes, references, advanced settings →</button>
    </div>
  </aside>
}
