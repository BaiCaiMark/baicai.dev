'use client'
import { useState } from 'react'
import { edgeLength } from '../core/worksheet'
import { formatLength, numeric, parseLength } from '../core/units'
import { quantity, setEdgeOpen, markTreatment, treatmentOf, uid, value, type Edge, type Project, type Reference, type Shape, type Treatment, type Quantity } from '../core/model'

const names:Record<Edge,string>={back:'Back',right:'Right',front:'Front',left:'Left',innerX:'Inside horizontal',innerY:'Inside vertical'}
const treatments:{id:Treatment;label:string}[]=[{id:'no-polish',label:'No Polish'},{id:'polish',label:'Polish'},{id:'miter',label:'Miter'}]
function display(q:Quantity,unit:Project['unit']) {
  const n=value(q)
  return q.unit===unit||n===null?q.input:numeric(n,unit)
}
function shortInput(q:Quantity,unit:Project['unit'],label:string,onChange:(text:string)=>void,onBlur:()=>void,focus=false) {
  const candidate=display(q,unit)
  return <input key={label} aria-label={label} autoFocus={focus} inputMode="decimal" autoComplete="off" spellCheck={false}
    value={candidate} placeholder="?" maxLength={80} aria-invalid={!!candidate.trim()&&parseLength(candidate,unit)===null}
    onChange={e=>onChange(e.target.value)} onBlur={onBlur} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
}
type Common={project:Project;shape:Shape;onChange:(recipe:(s:Shape)=>void,group?:string)=>void;onEnd:()=>void;onClose:()=>void;onAdvanced:()=>void}
export function DirectEdgeEditor({project,shape,edge,onChange,onEnd,onClose,onAdvanced}:Common&{edge:Edge}) {
  const [showNote,setShowNote]=useState(false)
  const name=names[edge],treatment=treatmentOf(shape,edge),edgeOpen=shape.openEdges?.[edge]
  const note=shape.fieldRecords.findLast(r=>r.kind==='note'&&r.edge===edge)
  const editTreatment=(kind:Treatment)=>{onChange(s=>markTreatment(s,edge,kind));onEnd()}
  const addNote=()=>{
    if(!note&&shape.fieldRecords.length<80)onChange(s=>s.fieldRecords.push({id:uid(),kind:'note',edge,text:''}))
    setShowNote(true);onEnd()
  }
  const currentNote=shape.fieldRecords.findLast(r=>r.kind==='note'&&r.edge===edge)
  return <section className="sm-direct-editor" aria-label={name+' edge properties'}>
    <header><div><strong>{name} · Edge</strong><span>OPEN / Treatment</span></div><button aria-label="Close direct editor" onClick={()=>{onEnd();onClose()}}>×</button></header>
    <div className="sm-direct-open" aria-label={name+' exposed edge'}>
      <strong>Exposure</strong><div><button type="button" aria-pressed={edgeOpen===true} onClick={()=>{onChange(s=>setEdgeOpen(s,edge,true,project));onEnd()}}>OPEN</button><button type="button" aria-pressed={edgeOpen===false} onClick={()=>{onChange(s=>setEdgeOpen(s,edge,false,project));onEnd()}}>Not OPEN</button></div>
    </div>
    <div className="sm-direct-treatment"><div className="sm-direct-label"><strong>Edge Treatment</strong></div>
      <div className="sm-direct-chips" aria-label={name+' treatment'}>{treatments.map(t=><button key={t.id} data-treatment={t.id} type="button" aria-pressed={treatment===t.id} onClick={()=>editTreatment(t.id)}>{t.label}</button>)}</div>
    </div>
    {treatment==='miter'?<small className="sm-direct-warning">Miter is recorded without automatic slab-thickness compensation.</small>:null}
    <div className="sm-direct-note-actions"><button onClick={addNote}>{note?'✎ Edit Note':'＋ Note'}</button><button onClick={onAdvanced}>Advanced</button></div>
    {showNote&&currentNote?.kind==='note'?<textarea aria-label={'Note on '+name} autoFocus value={currentNote.text} maxLength={4000} placeholder="e.g. wall out 1/4 inch" onChange={e=>onChange(s=>{const r=s.fieldRecords.find(x=>x.id===currentNote.id);if(r?.kind==='note')r.text=e.target.value},currentNote.id+'note')} onBlur={onEnd}/>:null}
    <div className="sm-direct-bottom"><span>Finished: {formatLength(edgeLength(shape,edge),project.unit)}</span><button onClick={()=>{onEnd();onClose()}}>Done</button></div>
  </section>
}
export function DirectSinkEditor({project,shape,refId,onChange,onEnd,onClose,onAdvanced}:Common&{refId:string}) {
  const ref=shape.references.find(r=>r.id===refId)
  if(!ref)return null
  const update=(fn:(r:Reference)=>void,group?:string)=>onChange(s=>{const r=s.references.find(r=>r.id===refId);if(r)fn(r)},group)
  const input=(axis:'x'|'y')=>shortInput(ref[axis],project.unit,axis==='x'?'Sink from left/right':'Sink from back/front',text=>update(r=>{r[axis]=quantity(text,project.unit,'measured')},ref.id+axis),onEnd,axis==='x')
  return <section className="sm-direct-editor" aria-label="Sink Center direct editor">
    <header><div><strong>{ref.kind==='sink'?'Sink Center':'Cooktop Center'}</strong><span>定位尺寸 · 不是 Cutout</span></div><button aria-label="Close direct editor" onClick={()=>{onEnd();onClose()}}>×</button></header>
    <div className="sm-direct-row"><label>X <select aria-label="Sink X direction" value={ref.fromX} onChange={e=>update(r=>{r.fromX=e.target.value as Reference['fromX']})}><option value="left">左邊起</option><option value="right">右邊起</option></select></label>{input('x')}</div>
    <div className="sm-direct-row"><label>Y <select aria-label="Sink Y direction" value={ref.fromY} onChange={e=>update(r=>{r.fromY=e.target.value as Reference['fromY']})}><option value="back">後邊起</option><option value="front">前邊起</option></select></label>{input('y')}</div>
    <div className="sm-direct-note-actions"><button onClick={onAdvanced}>更多設定 / 多個 Sink</button></div>
    <div className="sm-direct-bottom"><small>位置不代表 Sink Cutout。</small><button onClick={()=>{onEnd();onClose()}}>完成</button></div>
  </section>
}
