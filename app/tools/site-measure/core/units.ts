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
export function formatLength(mm: number | null, unit: Unit): string {
  return mm === null ? 'Unknown' : numeric(mm, unit) + (unit === 'in' ? '″' : ' mm')
}
