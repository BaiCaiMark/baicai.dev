'use client'
import { useState } from 'react'
import QuantityField from './QuantityField'
import { applyDefault, edgeOrder, newReference, quantity, requiredParams, setBasis, uid, value, type Edge, type FieldRecord, type Project, type Quantity, type Shape } from '../core/model'
import { calculate, measurementRows } from '../core/geometry'
import { edgeControl, edgeLength, edgeNames, fieldMeasurementText, partSize } from '../core/worksheet'
import { formatLength } from '../core/units'

type Props = { project: Project; shape: Shape; edge: Edge | null; onChange: (recipe: (s: Shape) => void, group?: string) => void; onEnd: () => void; onClose: () => void; onRemove: () => void }
export default function PartEditor({ project, shape, edge, onChange, onEnd, onClose, onRemove }: Props) {
  const [referencesOpen,setReferencesOpen]=useState(false)
  const control=edge?edgeControl(shape,edge):null,geometry=calculate(shape)
  const updateRecord=(id:string,recipe:(r:FieldRecord)=>void,group?:string)=>onChange(s=>{const r=s.fieldRecords.find(r=>r.id===id);if(r)recipe(r)},group)
  const addRecord=(kind:FieldRecord['kind'])=>onChange(s=>{
    if(s.fieldRecords.length>=80)return
    s.fieldRecords.push(kind==='measurement'?{id:uid(),edge,kind,label:'',measurement:quantity('',project.unit)}:{id:uid(),edge,kind,text:''})
  })
  const records=shape.fieldRecords.filter(r=>edge===null||r.edge===edge)
  const allowance=(e:Edge,q:Quantity)=>onChange(s=>{s.allowances[e]=q},shape.id+e)
  const finished=edge?edgeLength(shape,edge):null
  const endEdges:Edge[]=control?.parameter==='width'?['left','right']:control?.parameter==='height'?['back','front']:control?.parameter==='legX'?['back','innerX']:['left','innerY']
  const baseValue=control?.parameter?value(shape.dimensions[control.parameter]):null
  return <aside className="sm-context" aria-label="Measurement editor">
    <header className="sm-context-heading"><div><span>{edge?'SELECTED EDGE':'PART'}</span><h2>{edge?edgeNames[edge]:shape.name}</h2><p>{edge?shape.name:partSize(shape,project.unit)}</p></div><button aria-label="Close editor" onClick={onClose}>×</button></header>
    <div className="sm-context-body">
      {edge&&control?<section className="sm-edge-editor">
        <p className="sm-measure-hint">{control.parameter?control.label+' · changes this part’s geometry.':'Calculated edge · record a separate reading to check it.'}</p>
        {control.parameter?<QuantityField key={shape.id+edge+shape.basis} id="sm-edge-measurement" autoFocus label={shape.basis==='cabinet'?'Cabinet measurement':'Finished measurement'} quantity={shape.dimensions[control.parameter]} unit={project.unit} onEnd={onEnd} onChange={q=>onChange(s=>{s.dimensions[control.parameter!]=q},shape.id+control.parameter)}/>:<div className="sm-derived"><strong>{formatLength(finished,project.unit)}</strong><p>{control.relationship}</p><p>Changing a reference reading will not change other measurements.</p></div>}
        <div className="sm-finished"><span>Finished edge</span><strong>{formatLength(finished,project.unit)}</strong>{shape.basis==='cabinet'&&control.parameter?<small>{formatLength(baseValue,project.unit)} + {endEdges.map(e=>formatLength(value(shape.allowances[e]),project.unit)).join(' + ')} = {formatLength(finished,project.unit)}<br/>{endEdges.map(e=>edgeNames[e]+': '+formatLength(value(shape.allowances[e]),project.unit)).join(' · ')}</small>:null}</div>
        <button className="sm-primary sm-done" onClick={()=>{onEnd();onClose()}}>Done</button>
        <div className="sm-actions"><button onClick={()=>addRecord('measurement')}>＋ Reference measurement</button><button onClick={()=>addRecord('note')}>＋ Edge note</button></div>
        {shape.basis==='cabinet'?<details className="sm-section-details"><summary>Overhangs{edgeOrder(shape).some(e=>value(shape.allowances[e])===null)?' · some unknown':''}</summary>
          <p>Each allowance moves the named edge outward, changing its neighboring run lengths. Blank stays unknown.</p>
          <QuantityField label={'Overhang on '+edgeNames[edge]} quantity={shape.allowances[edge]} unit={project.unit} allowance onEnd={onEnd} onChange={q=>allowance(edge,q)}/>
          <div className="sm-actions"><button onClick={()=>allowance(edge,quantity('0',project.unit,'allowance'))}>No overhang · 0</button><button onClick={()=>onChange(s=>Object.assign(s,applyDefault(s,edge,project,'end')))}>Use end default</button><button onClick={()=>onChange(s=>Object.assign(s,applyDefault(s,edge,project,'front')))}>Use front default</button></div>
          <details><summary>All part allowances</summary>{edgeOrder(shape).filter(e=>e!==edge).map(e=><div key={e} className="sm-allowance-row"><QuantityField label={edgeNames[e]+' overhang'} quantity={shape.allowances[e]} unit={project.unit} allowance onEnd={onEnd} onChange={q=>allowance(e,q)}/><div className="sm-actions"><button onClick={()=>allowance(e,quantity('0',project.unit,'allowance'))}>0</button><button onClick={()=>onChange(s=>Object.assign(s,applyDefault(s,e,project,'end')))}>End default</button><button onClick={()=>onChange(s=>Object.assign(s,applyDefault(s,e,project,'front')))}>Front default</button></div></div>)}</details>
          <button className="sm-zero-all" onClick={()=>onChange(s=>{edgeOrder(s).forEach(e=>{if(!s.allowances[e].input.trim())s.allowances[e]=quantity('0',project.unit,'allowance')})})}>Set remaining blank overhangs to 0</button>
          <p>No door thickness is added.</p>
        </details>:null}
      </section>:<p className="sm-measure-hint">Tap a line on the worksheet to enter its measurement. Add notes and independent checks here.</p>}
      {records.length?<section className="sm-records-editor"><h3>{edge?'Measurements & notes on this edge':'Field measurements & notes'}</h3>{records.map(r=><div className="sm-record-card" key={r.id} data-record-editor={r.id}>
        <div className="sm-row"><span>{r.edge?edgeNames[r.edge]:'Part reference'} · {r.kind==='measurement'?'does not change geometry':'Note'}</span><button aria-label="Remove field record" onClick={()=>onChange(s=>{s.fieldRecords=s.fieldRecords.filter(x=>x.id!==r.id)})}>Remove</button></div>
        {r.kind==='measurement'?<>
          <QuantityField label="Reference measurement" autoFocus={!r.measurement.input} quantity={r.measurement} unit={project.unit} expression onEnd={onEnd} onChange={q=>updateRecord(r.id,r=>{if(r.kind==='measurement')r.measurement=q},r.id+'value')}/>
          <p className="sm-reference-result">{fieldMeasurementText(r.measurement,project.unit)}</p>
          <label>Description (optional)<input aria-label="Reference description" value={r.label} maxLength={160} onChange={e=>updateRecord(r.id,r=>{if(r.kind==='measurement')r.label=e.target.value},r.id+'label')} onBlur={onEnd}/></label>
        </>:<label>Field note<textarea aria-label="Field note" value={r.text} maxLength={4000} autoFocus={!r.text} onChange={e=>updateRecord(r.id,r=>{if(r.kind==='note')r.text=e.target.value},r.id+'note')} onBlur={onEnd}/></label>}
      </div>)}</section>:null}
      {!edge?<div className="sm-actions"><button onClick={()=>addRecord('measurement')}>＋ Reference measurement</button><button onClick={()=>addRecord('note')}>＋ Part note</button></div>:null}
      <details className="sm-section-details"><summary>Part settings</summary>
        <label>Part name<input aria-label="Part name" value={shape.name} maxLength={120} onChange={e=>onChange(s=>{s.name=e.target.value||'Unnamed part'},shape.id+'name')} onBlur={onEnd}/></label>
        <div className="sm-segmented"><button aria-pressed={shape.basis==='cabinet'} onClick={()=>onChange(s=>setBasis(s,'cabinet'))}>Cabinet + overhang</button><button aria-pressed={shape.basis==='finished'} onClick={()=>onChange(s=>setBasis(s,'finished'))}>Direct finished size</button></div>
        <p>Switching preserves both input sets. Conflicting complete measurements need a check.</p>
        <div className="sm-actions"><button onClick={()=>onChange(s=>{s.rotation=((s.rotation+90)%360) as Shape['rotation']})}>Rotate · {shape.rotation}°</button><button aria-pressed={shape.mirrored} onClick={()=>onChange(s=>{s.mirrored=!s.mirrored})}>Mirror</button></div>
        <label>Right-angle template<select aria-label="Right-angle template status" value={shape.angleStatus} onChange={e=>onChange(s=>{s.angleStatus=e.target.value as Shape['angleStatus']})}><option value="unconfirmed">Not field checked</option><option value="verify">Needs Check</option><option value="confirmed">Field checked</option></select></label>
        <details><summary>Remove this part</summary><p>Undo can restore the part and its readings.</p><button onClick={onRemove}>Remove part</button></details>
        <details><summary>All controlling measurements</summary>{requiredParams(shape).map(key=><QuantityField key={key} label={({width:'Back run length',height:'Left back run',legX:'Right end depth',legY:'Lower end width'})[key]} quantity={shape.dimensions[key]} unit={project.unit} onEnd={onEnd} onChange={q=>onChange(s=>{s.dimensions[key]=q},shape.id+key)}/>)}</details>
      </details>
      <details className="sm-section-details" open={referencesOpen} onToggle={e=>setReferencesOpen(e.currentTarget.open)}><summary>Sink Center & Cooktop</summary><p>Position references only. Left/right/back/front follow the original template when rotated or mirrored. Unknown Y stays unknown.</p>
        <div className="sm-actions"><button disabled={shape.references.length>=30} onClick={()=>{onChange(s=>{s.references.push(newReference('sink',project.unit))});setReferencesOpen(true)}}>＋ Sink Center</button><button disabled={shape.references.length>=30} onClick={()=>{onChange(s=>{s.references.push(newReference('cooktop',project.unit))});setReferencesOpen(true)}}>＋ Cooktop</button></div>
        {shape.references.map(ref=><div className="sm-reference-editor" key={ref.id}><div className="sm-row"><strong>{ref.kind==='sink'?'Sink Center':'Cooktop'}</strong><button aria-label="Remove positioning reference" onClick={()=>onChange(s=>{s.references=s.references.filter(r=>r.id!==ref.id)})}>Remove</button></div>
          <label>Reference from<select aria-label="Position reference basis" value={ref.basis} onChange={e=>onChange(s=>{s.references.find(r=>r.id===ref.id)!.basis=e.target.value as 'countertop'|'cabinet'})}><option value="countertop">Finished countertop edges</option><option value="cabinet">Cabinet edges</option></select></label>
          <label>X measured from<select aria-label="X direction" value={ref.fromX} onChange={e=>onChange(s=>{s.references.find(r=>r.id===ref.id)!.fromX=e.target.value as 'left'|'right'})}><option value="left">Left</option><option value="right">Right</option></select></label>
          <QuantityField label={(ref.kind==='sink'?'Sink':'Cooktop')+' X'} quantity={ref.x} unit={project.unit} onEnd={onEnd} onChange={q=>onChange(s=>{s.references.find(r=>r.id===ref.id)!.x=q},ref.id+'x')}/>
          <label>Y measured from<select aria-label="Y direction" value={ref.fromY} onChange={e=>onChange(s=>{s.references.find(r=>r.id===ref.id)!.fromY=e.target.value as 'back'|'front'})}><option value="back">Back</option><option value="front">Front</option></select></label>
          <QuantityField label={(ref.kind==='sink'?'Sink':'Cooktop')+' Y'} quantity={ref.y} unit={project.unit} onEnd={onEnd} onChange={q=>onChange(s=>{s.references.find(r=>r.id===ref.id)!.y=q},ref.id+'y')}/>
        </div>)}
      </details>
      <details className="sm-section-details"><summary>Part notes</summary><label>Notes<textarea aria-label="Part notes" value={shape.notes} maxLength={4000} onChange={e=>onChange(s=>{s.notes=e.target.value},shape.id+'notes')} onBlur={onEnd}/></label><div className="sm-actions">{['No backsplash','Verify wall before fabrication','Cabinet doors not installed'].map(note=><button key={note} onClick={()=>onChange(s=>{s.notes=(s.notes?s.notes+'\n':'')+note})}>{note}</button>)}</div></details>
      <details className="sm-section-details"><summary>Measurement record & checks</summary>{geometry.errors.map(error=><p className="sm-error-text" key={error}>{error}</p>)}<dl>{measurementRows(shape,project.unit,geometry).map((r,i)=><div key={i}><dt>{r.label}</dt><dd>{r.text}</dd></div>)}</dl></details>
    </div>
  </aside>
}
