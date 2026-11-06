'use client'
import { edgeControl, finishedEdgeReading, dimensionTerms } from '../core/worksheet'
import { numeric, formatLength } from '../core/units'
import { quantity, value, type Edge, type Param, type Project, type Quantity, type Shape } from '../core/model'

type Props = {
  project: Project; shape: Shape; edge: Edge
  onChange: (fn:(s:Shape)=>void,group?:string)=>void
  onEnd:()=>void; onClose:()=>void
}
const sideLabel:Record<Edge,string>={back:'Back',right:'Right',front:'Front',left:'Left',innerX:'Inside',innerY:'Inside'}
function inputText(q:Quantity,unit:Project['unit']) {
  const n=value(q)
  return q.unit===unit || n===null ? q.input : numeric(n,unit)
}
export default function CanvasDimensionEditor({project,shape,edge,onChange,onEnd,onClose}:Props) {
  const control=edgeControl(shape,edge)
  const terms=dimensionTerms(shape,edge)
  const current=finishedEdgeReading(shape,edge)
  const unit=project.unit
  const renderInput=(q:Quantity,label:string,update:(text:string)=>void,focused=false)=><input
    aria-label={label} inputMode="decimal" autoComplete="off" spellCheck={false}
    autoFocus={focused} value={inputText(q,unit)} maxLength={80} placeholder="?"
    aria-invalid={!!q.input.trim() && value(q)===null}
    onChange={e=>update(e.target.value)}
    onBlur={onEnd} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
  const field=(param:Param)=>renderInput(shape.dimensions[param],shape.basis==='cabinet'?'Cabinet size':'Finished size',text=>{
    onChange(s=>{s.dimensions[param]=quantity(text,unit,'measured')},shape.id+param)
  },true)
  const allowanceField=(key:Edge,label:string)=>{
    const q=shape.allowances[key]
    const set=(text:string)=>onChange(s=>{s.allowances[key]=quantity(text,unit,'allowance')},shape.id+'overhang-'+key)
    return <div className="sm-dimension-cell" key={key}>
      <label>{label}</label>
      {renderInput(q,label+' overhang',set)}
      <div className="sm-dimension-presets" aria-label={label+' presets'}>
        {(unit==='in'?['0','1','1.5']:['0','25.4','38.1']).map(n=><button key={n} type="button"
          aria-pressed={value(q)===value(quantity(n,unit))}
          onClick={()=>{set(n);onEnd()}}>{n}</button>)}
      </div>
    </div>
  }
  const finish=()=>{onEnd();onClose()}
  return <section className="sm-direct-editor sm-dimension-editor" aria-label={'Edit dimension '+edge}>
    <header><div><strong>{control.label}</strong><span>{shape.name} · {unit==='in'?'inch':'mm'}</span></div>
      <button aria-label="Close dimension editor" onClick={finish}>×</button></header>
    {terms?.parameter && shape.basis==='cabinet' ?
      <>
        <div className="sm-dimension-formula">
          {allowanceField(terms.start,sideLabel[terms.start])}
          <span className="sm-dimension-operator">＋</span>
          <div className="sm-dimension-cell sm-dimension-cabinet">
            <label>Cabinet</label>{field(terms.parameter)}
          </div>
          <span className="sm-dimension-operator">{terms.endSign<0?'−':'＋'}</span>
          {allowanceField(terms.end,sideLabel[terms.end])}
        </div>
        <div className="sm-dimension-result"><span>Finished</span>
          <strong>{current===null?'?':formatLength(current,unit)}</strong>
        </div>
      </>
      :terms?.parameter && shape.basis==='finished' ?
        <div className="sm-dimension-finished"><label>Finished</label>{field(terms.parameter)}</div>
      :<p className="sm-direct-derived">Calculated: {current===null?'?':formatLength(current,unit)}. Edit a controlling dimension instead.</p>}
    <div className="sm-direct-bottom"><span>Measure & allowances</span><button onClick={finish}>Done</button></div>
  </section>
}
