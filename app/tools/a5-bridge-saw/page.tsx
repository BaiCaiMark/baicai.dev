'use client'

import { useMemo, useState } from 'react'
import PageHeader from '../../components/PageHeader'

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
        <PageHeader
          eyebrow="Tools / A5 Bridge Saw"
          title="A5 bridge saw converter."
          description="Custom inch to machine millimeter conversion for the A5 bridge saw. Enter the stone position and size in inches, then use the millimeter values for the machine."
          actions={(
            <button type="button" onClick={resetA5Defaults} className="button-secondary">
              Reset defaults
            </button>
          )}
        />

        <div className="mt-10 border-y border-[var(--border)] bg-[var(--surface-muted)] px-0 py-6 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {fieldLabels.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">{field.label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">{field.hint}</span>
              <input
                inputMode="decimal"
                value={values[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="field-input mt-3 text-lg font-semibold tabular-nums"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fieldLabels.map((field) => (
            <div key={field.key} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">{field.label} output</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {outputs[field.key] || '--'}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">mm</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="content-card">
          <p className="eyebrow">Unit converter</p>
          <h2 className="section-heading mt-2">Inch and mm</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">Inch</span>
              <input
                inputMode="decimal"
                value={inch}
                onChange={(event) => updateFromInch(event.target.value)}
                className="field-input mt-2 text-lg font-semibold tabular-nums"
              />
            </label>
            <div className="hidden pb-3 text-[var(--muted)] sm:block">=</div>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">mm</span>
              <input
                inputMode="decimal"
                value={mm}
                onChange={(event) => updateFromMm(event.target.value)}
                className="field-input mt-2 text-lg font-semibold tabular-nums"
              />
            </label>
          </div>
        </div>

        <div className="content-card">
          <p className="eyebrow">Fraction helper</p>
          <h2 className="section-heading mt-2">Sixteenths to decimal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--foreground)]">Numerator 1-16</span>
              <input
                inputMode="numeric"
                value={fraction}
                onChange={(event) => setFraction(event.target.value)}
                className="field-input mt-2 text-lg font-semibold tabular-nums"
              />
            </label>
            <div className="hidden pb-3 text-[var(--muted)] sm:block">/16 =</div>
            <div className="rounded-lg bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Decimal</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {fractionResult || '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-[var(--border)] pt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">A5 machine parameters</h2>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
          <p>X output = X inch x 25.4 + 62.9899 + 3.175</p>
          <p>Y output = Y inch x 25.4 + 351.372</p>
          <p>Width output = Width inch x 25.4</p>
          <p>Height output = Height inch x 25.4</p>
        </div>
      </div>
      </div>
    </section>
  )
}
