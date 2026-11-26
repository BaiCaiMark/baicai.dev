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
    const next=newReference('sink',project.unit,shape.basis === 'cabinet' ? 'cabinet' : 'countertop')
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
    <div className="sm-sink-bar">
      <label>Sink <select aria-label="Sink selector" value={editingId} onChange={e=>{onEnd();setEditingId(e.target.value);setConfirmRemove(false)}}>
        {sinks.map((sink,i)=><option key={sink.id} value={sink.id}>{i+1}</option>)}
      </select></label>
      <label>From <select aria-label="Sink X direction" value={ref.fromX} onChange={e=>update(r=>{r.fromX=e.target.value as Reference['fromX']})}>
        <option value="left">Left</option><option value="right">Right</option>
      </select></label>
      <label>Datum <select aria-label="Sink reference basis" value={ref.basis} onChange={e=>update(r=>{r.basis=e.target.value as Reference['basis']})}>
        <option value="cabinet">Cabinet</option><option value="countertop">Finished</option>
      </select></label>
      <label>X ({project.unit}) <input key={ref.id} aria-label="Sink Center distance" autoFocus inputMode={project.unit==='in'?'text':'decimal'} autoComplete="off" spellCheck={false}
        value={inputValue(ref,project)} placeholder="?" maxLength={80} aria-invalid={!!ref.x.input.trim()&&value(ref.x)===null}
        onChange={e=>update(r=>{r.x=quantity(e.target.value,project.unit,'measured')},ref.id+'x')}
        onBlur={onEnd} onKeyDown={e=>{if(e.key==='Enter')finish()}}/></label>
      <button type="button" aria-label="Close direct editor" onClick={finish}>Done</button>
    </div>
    <div className="sm-sink-options">
      {confirmRemove?<><span>Remove Sink {index+1}?</span><button onClick={remove}>Remove</button><button onClick={()=>setConfirmRemove(false)}>Cancel</button></>
        :<><button onClick={add} disabled={shape.references.length>=30} aria-label="Add another Sink">＋ Sink</button><button onClick={()=>setConfirmRemove(true)}>Remove Sink</button><button onClick={onAdvanced}>Advanced</button></>}
    </div>
  </section>
}
