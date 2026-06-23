'use client'

import { useMemo, useState } from 'react'

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
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Tools / A5 Bridge Saw</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">A5 bridge saw converter.</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">
            Custom inch to machine millimeter conversion for the A5 bridge saw. Enter the stone
            position and size in inches, then use the millimeter values for the machine.
          </p>
        </div>
        <button
          type="button"
          onClick={resetA5Defaults}
          className="w-fit rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
        >
          Reset defaults
        </button>
      </div>

      <div className="mt-10 rounded-md border border-gray-200 bg-gray-50 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {fieldLabels.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-semibold text-gray-950">{field.label}</span>
              <span className="mt-1 block text-xs text-gray-500">{field.hint}</span>
              <input
                inputMode="decimal"
                value={values[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-lg font-semibold text-gray-950 outline-none transition focus:border-gray-950"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {fieldLabels.map((field) => (
            <div key={field.key} className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{field.label} output</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-950">
                {outputs[field.key] || '--'}
              </p>
              <p className="mt-1 text-xs text-gray-500">mm</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-gray-200 p-5 sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Unit converter</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">Inch and mm</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-gray-950">Inch</span>
              <input
                inputMode="decimal"
                value={inch}
                onChange={(event) => updateFromInch(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-950 outline-none transition focus:border-gray-950"
              />
            </label>
            <div className="hidden pb-3 text-gray-400 sm:block">=</div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-950">mm</span>
              <input
                inputMode="decimal"
                value={mm}
                onChange={(event) => updateFromMm(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-950 outline-none transition focus:border-gray-950"
              />
            </label>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-5 sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Fraction helper</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">Sixteenths to decimal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-gray-950">Numerator 1-16</span>
              <input
                inputMode="numeric"
                value={fraction}
                onChange={(event) => setFraction(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-950 outline-none transition focus:border-gray-950"
              />
            </label>
            <div className="hidden pb-3 text-gray-400 sm:block">/16 =</div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Decimal</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-950">
                {fractionResult || '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-950">A5 machine parameters</h2>
        <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <p>X output = X inch x 25.4 + 62.9899 + 3.175</p>
          <p>Y output = Y inch x 25.4 + 351.372</p>
          <p>Width output = Width inch x 25.4</p>
          <p>Height output = Height inch x 25.4</p>
        </div>
      </div>
    </section>
  )
}
