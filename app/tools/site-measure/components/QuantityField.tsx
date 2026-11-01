'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { value, type Quantity } from '../core/model'
import { numeric, type Unit } from '../core/units'
import { parseFieldMeasurement } from '../core/worksheet'

type Props = { label: string; quantity: Quantity; unit: Unit; allowance?: boolean; expression?: boolean; onChange: (q: Quantity) => void; onEnd: () => void; id?: string; autoFocus?: boolean }
export default function QuantityField({ label, quantity: q, unit, allowance, expression, onChange, onEnd, id, autoFocus }: Props) {
  const generated = useId(), fieldId = id ?? generated, inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!autoFocus) return
    const frame=requestAnimationFrame(()=>{inputRef.current?.focus();inputRef.current?.select()})
    return()=>cancelAnimationFrame(frame)
  },[autoFocus])
  const mm = value(q), activeUnit = expression || (mm === null && q.input.trim()) ? q.unit : unit
  const input = expression || q.unit === activeUnit ? q.input : mm === null ? '' : numeric(mm, activeUnit)
  const valid = expression ? parseFieldMeasurement(q).total !== null : mm !== null
  const change = (text: string) => onChange({ input: text, unit: activeUnit, origin: allowance ? 'allowance' : q.origin === 'assumed' ? 'assumed' : 'measured', status: 'unconfirmed' })
  const insert = (text: string) => {
    const element = inputRef.current
    const a = element?.selectionStart ?? input.length, b = element?.selectionEnd ?? a
    change(input.slice(0,a) + text + input.slice(b)); element?.focus()
    requestAnimationFrame(() => element?.setSelectionRange(a+text.length,a+text.length))
  }
  return <div className="sm-field">
    <label htmlFor={fieldId}>{label}</label>
    <div className="sm-input-line">
      <input ref={inputRef} id={fieldId} data-quantity={label} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
        autoFocus={autoFocus} value={input} placeholder="Unknown" maxLength={80} aria-invalid={!!q.input.trim() && !valid}
        onFocus={e => { setFocused(true); e.currentTarget.select() }} onChange={e => change(e.target.value)}
        onBlur={() => { setFocused(false); onEnd() }} onKeyDown={e => { if (e.key === 'Enter') { onEnd(); e.currentTarget.blur() } }} />
      <span>{activeUnit === 'in' ? 'inch' : 'mm'}</span>
    </div>
    {q.input.trim() && !valid ? <p className="sm-error-text">Use a positive number or fraction{expression ? '; + separates readings' : ''}.</p> : null}
    {activeUnit === 'in' ? <div className="sm-entry-keys" data-active={focused} aria-hidden={!focused} aria-label="Fraction typing keys">
      {[' ', '/', ...(expression ? [' + '] : [])].map(key => <button key={key} type="button" onPointerDown={e => e.preventDefault()} onClick={() => insert(key)}>{key === ' ' ? 'Space' : key}</button>)}
      <span>e.g. 25 1/2</span>
    </div> : null}
    <details className="sm-quantity-details"><summary>{q.origin === 'assumed' ? 'Estimate' : q.status === 'verify' ? 'Needs Check' : 'Details'}</summary>
      <p>{({measured:'Measured',assumed:'Estimate',default:'Project default',allowance:'Manual allowance'})[q.origin]} · {({confirmed:'Field checked',unconfirmed:'Not field checked',verify:'Needs Check'})[q.status]} — field status, not manufacturing approval.</p>
      <div className="sm-actions">
        {!allowance ? <button type="button" onClick={() => { onChange({...q,origin:q.origin==='assumed'?'measured':'assumed',status:'unconfirmed'});onEnd() }}>{q.origin==='assumed'?'Use measured':'Mark estimate'}</button> : null}
        <button type="button" onClick={() => { onChange({...q,status:'verify'});onEnd() }}>Needs Check</button>
        <button type="button" onClick={() => { onChange({...q,status:'confirmed'});onEnd() }}>Field checked</button>
        <button type="button" onClick={() => { change('');onEnd() }}>Set unknown</button>
      </div>
    </details>
  </div>
}
