export type Unit = 'in' | 'mm'
export const MAX_MM = 100_000
export function parseLength(text: string, unit: Unit): number | null {
  const s = unit === 'in' ? text.trim().replace(/[″”"]$/, '').trim() : text.trim()
  if (!s) return null
  let value: number
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s)
  const fraction = /^(\d+)\/(\d+)$/.exec(s)
  if (mixed || fraction) {
    if (unit !== 'in') return null
    const parts = mixed ? [Number(mixed[1]), Number(mixed[2]), Number(mixed[3])] : [0, Number(fraction![1]), Number(fraction![2])]
    if (!parts[2] || parts[1] >= parts[2]) return null
    value = parts[0] + parts[1] / parts[2]
  } else {
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null
    value = Number(s)
  }
  const mm = value * (unit === 'in' ? 25.4 : 1)
  return Number.isFinite(mm) && mm <= MAX_MM ? mm : null
}
export function numeric(mm: number, unit: Unit): string {
  return (mm / (unit === 'in' ? 25.4 : 1)).toFixed(6).replace(/\.?0+$/, '') || '0'
}
export function decimalLength(mm: number | null, unit: Unit): string {
  return mm === null ? 'Unknown' : numeric(mm, unit) + (unit === 'in' ? '″' : ' mm')
}
export function formatLength(mm: number | null, unit: Unit): string {
  if (mm === null) return 'Unknown'
  if (unit === 'mm') return numeric(mm, unit) + ' mm'
  const inches = Math.abs(mm / 25.4)
  const ticks = Math.round(inches * 16)
  if (Math.abs(ticks / 16 - inches) > 1e-10) {
    const decimal=numeric(mm,unit)
    const rounded=Math.abs(Number(decimal)-mm/25.4)>1e-10
    return (rounded?'≈':'')+decimal+'″'
  }
  const whole = Math.floor(ticks / 16)
  let numerator = ticks % 16
  if (!numerator) return (mm < 0 ? '-' : '') + whole + '″'
  let denominator = 16
  while (numerator % 2 === 0) {
    numerator /= 2
    denominator /= 2
  }
  return (mm < 0 ? '-' : '') + (whole ? whole + ' ' : '') + numerator + '/' + denominator + '″'
}
