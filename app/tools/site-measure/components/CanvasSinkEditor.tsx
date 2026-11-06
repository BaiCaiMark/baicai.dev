'use client'
import { useState } from 'react'
import { newReference, quantity, value, type Project, type Reference, type Shape } from '../core/model'
import { numeric } from '../core/units'

type Props={project:Project;shape:Shape;refId:string;onChange:(recipe:(s:Shape)=>void,group?:string)=>void;onEnd:()=>void;onClose:()=>void;onAdvanced:()=>void}
function inputValue(ref:Reference,project:Project) {
  const n=value(ref.x)
  return ref.x.unit===project.unit||n===null?ref.x.input:numeric(n,project.unit)
}
export default function CanvasSinkEditor({project,shape,refId,onChange,onEnd,onClose,onAdvanced}:Props) {
  const [editingId,setEditingId]=useState(refId)
  const [confirmRemove,setConfirmRemove]=useState(false)
  const sinks=shape.references.filter(r=>r.kind==='sink')
  const ref=shape.references.find(r=>r.id===editingId)
  if(!ref)return null
  const index=sinks.findIndex(r=>r.id===editingId)
  const update=(fn:(r:Reference)=>void,group?:string)=>onChange(s=>{const r=s.references.find(r=>r.id===editingId);if(r)fn(r)},group)
  const add=()=>{
    if(shape.references.length>=30)return
    const next=newReference('sink',project.unit)
    onChange(s=>{s.references.push(next)})
    onEnd();setEditingId(next.id);setConfirmRemove(false)
  }
  const remove=()=>{
    onChange(s=>{s.references=s.references.filter(r=>r.id!==editingId)})
    onEnd()
    const remaining=sinks.filter(r=>r.id!==editingId)
    if(remaining.length){setEditingId(remaining[0].id);setConfirmRemove(false)}
    else onClose()
  }
  const finish=()=>{onEnd();onClose()}
  return <section className="sm-direct-editor sm-sink-editor" aria-label="Sink Center direct editor">
    <header><div><strong>Sink Center {index+1}</strong><span>Left / Right · X only</span></div><button aria-label="Close direct editor" onClick={finish}>×</button></header>
    <nav className="sm-sink-tabs" aria-label="Sink selector">
      {sinks.map((s,i)=><button key={s.id} type="button" aria-pressed={s.id===editingId} onClick={()=>{onEnd();setEditingId(s.id);setConfirmRemove(false)}}>Sink {i+1}</button>)}
      <button type="button" onClick={add} disabled={shape.references.length>=30} aria-label="Add another Sink">＋ Sink</button>
    </nav>
    <div className="sm-sink-position">
      <div className="sm-sink-from"><label htmlFor="sm-sink-x-from">Measure from</label>
        <select id="sm-sink-x-from" aria-label="Sink X direction" value={ref.fromX} onChange={e=>update(r=>{r.fromX=e.target.value as Reference['fromX']})}>
          <option value="left">Left</option><option value="right">Right</option>
        </select></div>
      <div className="sm-sink-reading"><label htmlFor="sm-sink-x">Sink Center</label>
        <input key={ref.id} id="sm-sink-x" aria-label="Sink Center distance" autoFocus inputMode="decimal" autoComplete="off" spellCheck={false}
          value={inputValue(ref,project)} placeholder="?" maxLength={80}
          aria-invalid={!!ref.x.input.trim()&&value(ref.x)===null}
          onChange={e=>update(r=>{r.x=quantity(e.target.value,project.unit,'measured')},ref.id+'x')}
          onBlur={onEnd} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
      </div>
      <span className="sm-sink-unit">{project.unit==='in'?'inch':'mm'}</span>
    </div>
    {value(ref.x)!==null&&value(ref.x)!<0?<small className="sm-direct-warning">Distance cannot be negative.</small>:null}
    <p className="sm-sink-helper">Only Left / Right is needed. Y remains optional; no Cutout is assumed.</p>
    {confirmRemove?<div className="sm-sink-remove-confirm"><span>Remove Sink {index+1}?</span><button type="button" onClick={remove}>Remove</button><button type="button" onClick={()=>setConfirmRemove(false)}>Cancel</button></div>:null}
    <div className="sm-sink-actions"><button type="button" onClick={()=>setConfirmRemove(true)}>Remove Sink</button><button type="button" onClick={onAdvanced}>Advanced</button></div>
    <div className="sm-direct-bottom"><span>{sinks.length} Sink{sinks.length===1?'':'s'} · X reference only</span><button onClick={finish}>Done</button></div>
  </section>
}
