'use client'
import { useState } from 'react'
import { edgeControl, edgeLength } from '../core/worksheet'
import { formatLength, numeric, parseLength } from '../core/units'
import { quantity, setTreatment, treatmentOf, uid, value, type Edge, type Project, type Reference, type Shape, type Treatment, type Quantity } from '../core/model'

const names:Record<Edge,string>={back:'後邊 Back',right:'右邊 Right',front:'前邊 Front',left:'左邊 Left',innerX:'內側橫邊',innerY:'內側直邊'}
const vanity:Record<Edge,string>={back:'總長 · Overall length',right:'淺位深度 · Shallow depth',front:'深位長度 · Deep run',left:'最深處 · Max depth',innerX:'淺位長度 · Shallow run',innerY:'深淺差 · Step'}
const treatments:{id:Treatment;label:string}[]=[{id:'no-polish',label:'No Polish'},{id:'polish',label:'Polish'},{id:'miter',label:'Miter'}]
function display(q:Quantity,unit:Project['unit']) {
  const n=value(q)
  return q.unit===unit||n===null?q.input:numeric(n,unit)
}
function shortInput(q:Quantity,unit:Project['unit'],label:string,onChange:(text:string)=>void,onBlur:()=>void,focus=false) {
  const candidate=display(q,unit)
  return <input key={label} aria-label={label} autoFocus={focus} inputMode="decimal" autoComplete="off" spellCheck={false}
    value={candidate} placeholder="Tap to enter" maxLength={80} aria-invalid={!!candidate.trim()&&parseLength(candidate,unit)===null}
    onChange={e=>onChange(e.target.value)} onBlur={onBlur} onKeyDown={e=>{if(e.key==='Enter'){e.currentTarget.blur()}}}/>
}
type Common={project:Project;shape:Shape;onChange:(fn:(s:Shape)=>void,group?:string)=>void;onEnd:()=>void;onClose:()=>void;onAdvanced:()=>void}
export function DirectEdgeEditor({project,shape,edge,onChange,onEnd,onClose,onAdvanced}:Common&{edge:Edge}) {
  const [custom,setCustom]=useState(false),[showNote,setShowNote]=useState(false)
  const control=edgeControl(shape,edge),param=control.parameter
  const name=shape.profile==='vanity-step'?vanity[edge]:names[edge]
  const read=param?shape.dimensions[param]:null
  const allowance=shape.allowances[edge],treatment=treatmentOf(shape,edge)
  const note=shape.fieldRecords.findLast(r=>r.kind==='note'&&r.edge===edge)
  const options=project.unit==='in'
    ? (edge==='front'||edge==='innerX'?['0','1/8','1 1/2','1 3/4']:['0','1/8','1/2','3/4','1'])
    : (edge==='front'||edge==='innerX'?['0','3.175','38.1','44.45']:['0','3.175','12.7','19.05','25.4'])
  const editAllowance=(input:string)=>{onChange(s=>{s.allowances[edge]=quantity(input,project.unit,'allowance')},shape.id+edge);onEnd()}
  const editTreatment=(kind:Treatment)=>{onChange(s=>setTreatment(s,edge,kind,project));onEnd()}
  const addNote=()=>{
    if(!note&&shape.fieldRecords.length<80)onChange(s=>s.fieldRecords.push({id:uid(),kind:'note',edge,text:''}))
    setShowNote(true);onEnd()
  }
  const currentNote=shape.fieldRecords.findLast(r=>r.kind==='note'&&r.edge===edge)
  return <section className="sm-direct-editor" aria-label={name+' direct editor'}>
    <header><div><strong>{name}</strong><span>{shape.name}</span></div><button aria-label="Close direct editor" onClick={()=>{onEnd();onClose()}}>×</button></header>
    {param&&read?<div className="sm-direct-row"><label>{shape.basis==='cabinet'?'Cabinet 實測':'Finished 實測'} <small>{param==='width'?'↔':'↕'}</small></label>
      {shortInput(read,project.unit,'Cabinet '+name,text=>onChange(s=>{s.dimensions[param]=quantity(text,project.unit,'measured')},shape.id+param),onEnd,true)}
      <span>{project.unit==='in'?'inch':'mm'}</span></div>
      :<p className="sm-direct-derived">這段是計算邊：{formatLength(edgeLength(shape,edge),project.unit)}。請修改圖上其他實測邊。</p>}
    {shape.basis==='cabinet'?<div className="sm-direct-allowance"><div className="sm-direct-label"><strong>Overhang</strong><span>{allowance.origin==='default'?'預設 · 未確認':'現場修改'}</span></div>
      <div className="sm-direct-chips" aria-label={name+' overhang'}>
        {options.map(n=><button key={n} aria-pressed={value(allowance)===value(quantity(n,project.unit))} onClick={()=>{setCustom(false);editAllowance(n)}}>{n}{project.unit==='in'?'″':''}</button>)}
        <button aria-pressed={custom} onClick={()=>setCustom(v=>!v)}>自訂</button>
      </div>
      {custom?<div className="sm-direct-row">{shortInput(allowance,project.unit,'Custom overhang',editAllowance,onEnd,true)}<span>{project.unit==='in'?'inch':'mm'}</span></div>:null}
    </div>:null}
    <div className="sm-direct-treatment"><div className="sm-direct-label"><strong>加工邊</strong><span>Edge Treatment</span></div>
      <div className="sm-direct-chips" aria-label={name+' treatment'}>{treatments.map(t=><button key={t.id} aria-pressed={treatment===t.id} onClick={()=>editTreatment(t.id)}>{t.label}</button>)}</div>
    </div>
    {treatment==='miter'?<small className="sm-direct-warning">Miter 僅記錄工序，未自動增加石材厚度。</small>:null}
    <div className="sm-direct-note-actions">
      <button onClick={addNote}>{note?'✎ 修改 Note':'＋ Note / 斜牆'}</button>
      <button onClick={onAdvanced}>更多設定</button>
    </div>
    {showNote&&currentNote?.kind==='note'?<textarea aria-label={'Note on '+name} autoFocus value={currentNote.text} maxLength={4000} placeholder="例如：左牆斜 1/4″，安裝前複核" onChange={e=>onChange(s=>{const r=s.fieldRecords.find(x=>x.id===currentNote.id);if(r?.kind==='note')r.text=e.target.value},currentNote.id+'note')} onBlur={onEnd}/>:null}
    <div className="sm-direct-bottom"><span>成品這段：{formatLength(edgeLength(shape,edge),project.unit)}</span><button onClick={()=>{onEnd();onClose()}}>完成</button></div>
  </section>
}
export function DirectSinkEditor({project,shape,refId,onChange,onEnd,onClose,onAdvanced}:Common&{refId:string}) {
  const ref=shape.references.find(r=>r.id===refId)
  if(!ref)return null
  const update=(fn:(r:Reference)=>void,group?:string)=>onChange(s=>{const r=s.references.find(r=>r.id===refId);if(r)fn(r)},group)
  const input=(axis:'x'|'y')=>shortInput(ref[axis],project.unit,axis==='x'?'Sink from left/right':'Sink from back/front',text=>update(r=>{r[axis]=quantity(text,project.unit,'measured')},ref.id+axis),onEnd,axis==='x')
  return <section className="sm-direct-editor" aria-label="Sink Center direct editor">
    <header><div><strong>{ref.kind==='sink'?'Sink Center':'Cooktop Center'}</strong><span>直接記錄定位尺寸 · 非 Cutout</span></div><button aria-label="Close direct editor" onClick={()=>{onEnd();onClose()}}>×</button></header>
    <div className="sm-direct-row"><label>X <select aria-label="Sink X direction" value={ref.fromX} onChange={e=>update(r=>{r.fromX=e.target.value as Reference['fromX']})}><option value="left">左邊起</option><option value="right">右邊起</option></select></label>{input('x')}</div>
    <div className="sm-direct-row"><label>Y <select aria-label="Sink Y direction" value={ref.fromY} onChange={e=>update(r=>{r.fromY=e.target.value as Reference['fromY']})}><option value="back">後邊起</option><option value="front">前邊起</option></select></label>{input('y')}</div>
    <div className="sm-direct-note-actions"><button onClick={onAdvanced}>更多設定 / 多個 Sink</button></div>
    <div className="sm-direct-bottom"><small>位置不代表 Sink Cutout。</small><button onClick={()=>{onEnd();onClose()}}>完成</button></div>
  </section>
}
