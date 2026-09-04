'use client'

import { useMemo, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import Link from 'next/link'
import { a5Tool } from '../../data/site'

type FieldKey = 'x' | 'y' | 'width' | 'height'

const initialValues: Record<FieldKey, string> = {
  x: '6.25',
  y: '1.25',
  width: '126.75',
  height: '63.75',
}

const fieldLabels: Array<{ key: FieldKey; label: string; hint: string }> = [
  { key: 'x', label: 'X', hint: 'Input in inch' },
  { key: 'y', label: 'Y', hint: 'Input in inch' },
  { key: 'width', label: 'Width', hint: 'Cut size in inch' },
  { key: 'height', label: 'Height', hint: 'Cut size in inch' },
]

function parseNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatValue(value: number, decimals: number) {
  return value.toFixed(decimals)
}

export default function A5BridgeSawPage() {
  const [values, setValues] = useState(initialValues)
  const [inch, setInch] = useState('0.0394')
  const [mm, setMm] = useState('1')
  const [fraction, setFraction] = useState('11')

  const outputs = useMemo(() => {
    const x = parseNumber(values.x)
    const y = parseNumber(values.y)
    const width = parseNumber(values.width)
    const height = parseNumber(values.height)

    return {
      x: x === null ? '' : formatValue(x * 25.4 + 62.9899 + 3.175, 3),
      y: y === null ? '' : formatValue(y * 25.4 + 351.372, 3),
      width: width === null ? '' : formatValue(width * 25.4, 2),
      height: height === null ? '' : formatValue(height * 25.4, 2),
    }
  }, [values])

  const fractionResult = useMemo(() => {
    const numerator = Number(fraction)
    if (!Number.isInteger(numerator) || numerator < 1 || numerator > 16) {
      return ''
    }

    return formatValue(numerator / 16, 4)
  }, [fraction])

  function updateField(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function updateFromInch(value: string) {
    setInch(value)
    const parsed = parseNumber(value)
    setMm(parsed === null ? '' : formatValue(parsed * 25.4, 3))
  }

  function updateFromMm(value: string) {
    setMm(value)
    const parsed = parseNumber(value)
    setInch(parsed === null ? '' : formatValue(parsed / 25.4, 4))
  }

  function resetA5Defaults() {
    setValues(initialValues)
  }

  return (
    <section className="page-section">
      <div className="site-container">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/tools">Tools</Link><span aria-hidden="true">/</span><span aria-current="page">A5</span>
        </nav>
        <PageHeader
          eyebrow="Work / A5"
          title={a5Tool.name}
          description={a5Tool.description}
          actions={<button type="button" onClick={resetA5Defaults} className="button-secondary">Reset defaults</button>}
        />
        <div className="a5-fields">
          {fieldLabels.map((field) => (
            <div className="a5-field" key={field.key}>
              <label htmlFor={`a5-${field.key}`} className="block">
                <span className="text-sm font-semibold">{field.label}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{field.hint}</span>
              </label>
              <input
                id={`a5-${field.key}`}
                inputMode="decimal"
                value={values[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="field-input mt-3 tabular-nums"
              />
              <div className="a5-output">
                <p id={`label-${field.key}-output`} className="text-xs text-[var(--muted)]">{field.label} output</p>
                <output htmlFor={`a5-${field.key}`} aria-labelledby={`label-${field.key}-output`} className="tabular-nums">{outputs[field.key] || '--'}</output>
                <p className="text-xs text-[var(--muted)]">mm</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="content-card" aria-labelledby="unit-heading">
            <p className="eyebrow">Unit converter</p>
            <h2 id="unit-heading" className="section-heading mt-2">Inch and mm</h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold">Inch</span>
                <input inputMode="decimal" value={inch} onChange={(event) => updateFromInch(event.target.value)} className="field-input mt-2 tabular-nums" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">mm</span>
                <input inputMode="decimal" value={mm} onChange={(event) => updateFromMm(event.target.value)} className="field-input mt-2 tabular-nums" />
              </label>
            </div>
          </section>
          <section className="content-card" aria-labelledby="fraction-heading">
            <p className="eyebrow">Fraction helper</p>
            <h2 id="fraction-heading" className="section-heading mt-2">Sixteenths to decimal</h2>
            <div className="mt-5 grid grid-cols-2 items-end gap-4">
              <label className="block">
                <span className="text-sm font-semibold">Numerator 1-16</span>
                <input id="fraction" inputMode="numeric" value={fraction} onChange={(event) => setFraction(event.target.value)} className="field-input mt-2 tabular-nums" />
              </label>
              <div>
                <p id="decimal-label" className="text-xs text-[var(--muted)]">Decimal / 16</p>
                <output htmlFor="fraction" aria-labelledby="decimal-label" className="mt-2 block py-3 text-2xl font-semibold tabular-nums">{fractionResult || '--'}</output>
              </div>
            </div>
          </section>
        </div>
        <section className="mt-8 border-t border-[var(--border)] pt-6" aria-labelledby="parameters-heading">
          <h2 id="parameters-heading" className="section-heading">A5 machine parameters</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
            <p>X output = X inch x 25.4 + 62.9899 + 3.175</p>
            <p>Y output = Y inch x 25.4 + 351.372</p>
            <p>Width output = Width inch x 25.4</p>
            <p>Height output = Height inch x 25.4</p>
          </div>
        </section>
      </div>
    </section>
  )
}
