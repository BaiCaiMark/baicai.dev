import type { Quantity } from './model'
import { formatLength, parseLength, type Unit } from './units'
export function parseFieldMeasurement(q: Quantity): { total: number | null; parts: number[]; expression: boolean } {
  const terms = q.input.split('+').map(s => s.trim())
  if (terms.length > 12 || terms.some(s => !s)) return { total: null, parts: [], expression: terms.length > 1 }
  const parts = terms.map(s => parseLength(s, q.unit))
  return { total: parts.some(n => n === null) ? null : parts.reduce<number>((a, b) => a + b!, 0), parts: parts.filter((n): n is number => n !== null), expression: terms.length > 1 }
}
export function fieldMeasurementText(q: Quantity, unit: Unit): string {
  const result = parseFieldMeasurement(q)
  if (result.total === null) return q.input.trim() ? q.input + ' (' + q.unit + ') · Needs Check' : 'Unknown'
  return result.expression
    ? result.parts.map(n => formatLength(n, unit)).join(' + ') + ' = ' + formatLength(result.total, unit) + ' (reference only)'
    : formatLength(result.total, unit) + ' (reference only)'
}
