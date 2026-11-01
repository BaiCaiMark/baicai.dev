'use client'
import { useId } from 'react'
import { originLabels, statusLabels, value, type Quantity } from '../core/model'
import { numeric, parseLength, type Unit } from '../core/units'

type Props = { label: string; quantity: Quantity; unit: Unit; allowance?: boolean; onChange: (q: Quantity) => void; onEnd: () => void; id?: string }
export default function QuantityField({ label, quantity: q, unit, allowance, onChange, onEnd, id }: Props) {
  const generated = useId(), fieldId = id ?? generated
  const mm = value(q), activeUnit = mm === null && q.input.trim() ? q.unit : unit
  const input = q.unit === activeUnit ? q.input : mm === null ? '' : numeric(mm, activeUnit)
  const invalid = q.input.trim() !== '' && mm === null
  const change = (text: string) => onChange({ input: text, unit: activeUnit, origin: allowance ? 'allowance' : q.origin === 'assumed' ? 'assumed' : 'measured', status: 'unconfirmed' })
  const fraction = (part: string) => {
    if (!part) return
    const current = parseLength(input, 'in')
    const whole = current === null ? 0 : Math.floor(current / 25.4 + 1e-8)
    change((whole ? whole + ' ' : '') + part)
    onEnd()
  }
  return <div className="sm-field">
    <label htmlFor={fieldId}>{label}</label>
    <div className="sm-input-line">
      <input id={fieldId} data-quantity={label} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
        value={input} placeholder="待量" aria-invalid={invalid} aria-describedby={fieldId + '-hint'}
        onFocus={e => e.currentTarget.select()} onChange={e => change(e.target.value)} onBlur={onEnd}
        onKeyDown={e => { if (e.key === 'Enter') {
          e.preventDefault(); onEnd()
          const fields = Array.from(e.currentTarget.closest('section')?.querySelectorAll<HTMLInputElement>('input[data-quantity]') ?? [])
          const next = fields[fields.indexOf(e.currentTarget) + 1]; if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }) } else e.currentTarget.blur()
        } }} />
      <span>{activeUnit === 'in' ? 'inch' : 'mm'}</span>
      {activeUnit === 'in' ? <select aria-label={label + ' 分數'} value="" onChange={e => fraction(e.target.value)}>
        <option value="">分數</option>
        {Array.from({ length: 15 }, (_, i) => { let n = i + 1, d = 16; while (n % 2 === 0) { n /= 2; d /= 2 } return <option key={i} value={n + '/' + d}>{n}/{d}</option> })}
      </select> : null}
    </div>
    <div className="sm-field-meta" id={fieldId + '-hint'}>
      {allowance ? <span className={invalid ? 'sm-error-text' : ''}>{invalid ? '格式無效' : mm === null ? '尚無數值' : originLabels[q.origin]}</span> : <select aria-label={label + ' 數值來源'} value={q.origin} onChange={e => { onChange({ ...q, origin: e.target.value as Quantity['origin'], status: 'unconfirmed' }); onEnd() }}><option value="measured">實測</option><option value="assumed">假設</option>{q.origin !== 'measured' && q.origin !== 'assumed' ? <option value={q.origin}>{originLabels[q.origin]}</option> : null}</select>}
      <select aria-label={label + ' 確認狀態'} value={q.status} onChange={e => { onChange({ ...q, status: e.target.value as Quantity['status'] }); onEnd() }}>
        {Object.entries(statusLabels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </div>
  </div>
}
