import { z } from 'zod'
import { parseLength, type Unit } from './units'

export const statusSchema = z.enum(['unconfirmed', 'confirmed', 'verify'])
export const originSchema = z.enum(['measured', 'default', 'allowance', 'assumed'])
const text = z.string().max(4000)
const id = z.string().min(1).max(100)
export const quantitySchema = z.object({
  input: z.string().max(80), unit: z.enum(['in', 'mm']),
  origin: originSchema, status: statusSchema,
  defaultRevision: z.number().int().min(0).optional(),
}).strict()
export type Quantity = z.infer<typeof quantitySchema>
export type Status = Quantity['status']
export type Param = 'width' | 'height' | 'legX' | 'legY'
export type Edge = 'back' | 'right' | 'front' | 'left' | 'innerX' | 'innerY'
export const referenceSchema = z.object({
  id, kind: z.enum(['sink', 'cooktop']), basis: z.enum(['cabinet', 'countertop']),
  fromX: z.enum(['left', 'right']), fromY: z.enum(['back', 'front']),
  x: quantitySchema, y: quantitySchema,
}).strict()
const dimensionsSchema = z.object({ width: quantitySchema, height: quantitySchema, legX: quantitySchema, legY: quantitySchema }).strict()
export const shapeSchema = z.object({
  id, name: z.string().min(1).max(120), template: z.enum(['rectangle', 'l']),
  basis: z.enum(['cabinet', 'finished']),
  dimensions: dimensionsSchema,
  alternateDimensions: dimensionsSchema,
  allowances: z.object({
    back: quantitySchema, right: quantitySchema, front: quantitySchema,
    left: quantitySchema, innerX: quantitySchema, innerY: quantitySchema,
  }).strict(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  mirrored: z.boolean(), angleStatus: statusSchema, notes: text,
  references: z.array(referenceSchema).max(30),
}).strict()
export const projectSchema = z.object({
  schemaVersion: z.literal(1), id, name: z.string().min(1).max(120),
  revision: z.number().int().min(0), updatedAt: z.string().datetime(), unit: z.enum(['in', 'mm']),
  defaults: z.object({ revision: z.number().int().min(0), end: quantitySchema, front: quantitySchema }).strict(),
  areas: z.array(z.object({
    id, name: z.string().min(1).max(120), notes: text, shapes: z.array(shapeSchema).max(60),
  }).strict()).min(1).max(30),
}).strict().superRefine((p, ctx) => {
  const ids = [p.id, ...p.areas.flatMap(a => [a.id, ...a.shapes.flatMap(s => [s.id, ...s.references.map(r => r.id)])])]
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Duplicate identifiers / 重複識別碼' })
  if (p.areas.reduce((sum, a) => sum + a.shapes.length, 0) > 200) ctx.addIssue({ code: 'custom', message: 'Maximum 200 shapes / 最多 200 個形狀' })
})
export type Project = z.infer<typeof projectSchema>
export type Shape = z.infer<typeof shapeSchema>
export type Reference = z.infer<typeof referenceSchema>
export type Area = Project['areas'][number]
export const paramLabels: Record<Param, string> = { width: '總長 W', height: '總深 H', legX: '橫腿深 A', legY: '直腿寬 B' }
export const edgeLabels: Record<Edge, string> = { back: 'E1 後側 Back', right: 'E2 右端 Right', front: 'E3 前側 Front', left: 'E4 左側 Left', innerX: 'E5 內橫邊', innerY: 'E6 內直邊' }
export const originLabels: Record<Quantity['origin'] | 'calculated', string> = {
  measured: '實測', default: '專案預設', allowance: '手動伸出量', assumed: '假設', calculated: '計算',
}
export const statusLabels: Record<Status, string> = { unconfirmed: '未確認', confirmed: '已確認', verify: '需複核' }
export function uid(): string { return crypto.randomUUID() }
export function quantity(input = '', unit: Unit = 'in', origin: Quantity['origin'] = 'measured'): Quantity {
  return { input, unit, origin, status: 'unconfirmed' }
}
export function value(q: Quantity): number | null { return parseLength(q.input, q.unit) }
export function requiredParams(shape: Shape): Param[] { return shape.template === 'rectangle' ? ['width', 'height'] : ['width', 'height', 'legX', 'legY'] }
export function edgeOrder(shape: Shape): Edge[] { return shape.template === 'rectangle' ? ['back', 'right', 'front', 'left'] : ['back', 'right', 'innerX', 'innerY', 'front', 'left'] }
export function newShape(template: Shape['template'], unit: Unit, index = 1): Shape {
  return {
    id: uid(), name: (template === 'l' ? 'L-shape ' : 'Rectangle ') + index, template, basis: 'cabinet',
    dimensions: { width: quantity('', unit), height: quantity('', unit), legX: quantity('', unit), legY: quantity('', unit) },
    alternateDimensions: { width: quantity('', unit), height: quantity('', unit), legX: quantity('', unit), legY: quantity('', unit) },
    allowances: {
      back: quantity('', unit, 'allowance'), right: quantity('', unit, 'allowance'),
      front: quantity('', unit, 'allowance'), left: quantity('', unit, 'allowance'),
      innerX: quantity('', unit, 'allowance'), innerY: quantity('', unit, 'allowance'),
    },
    rotation: 0, mirrored: false, angleStatus: 'unconfirmed', notes: '', references: [],
  }
}
export function newProject(): Project {
  return {
    schemaVersion: 1, id: uid(), name: '新量尺工程', revision: 0, updatedAt: new Date().toISOString(), unit: 'in',
    defaults: { revision: 0, end: quantity('1', 'in', 'allowance'), front: quantity('1.5', 'in', 'allowance') },
    areas: [{ id: uid(), name: 'Kitchen', notes: '', shapes: [] }],
  }
}
export function newReference(kind: Reference['kind'], unit: Unit): Reference {
  return { id: uid(), kind, basis: 'countertop', fromX: 'left', fromY: 'back', x: quantity('', unit), y: quantity('', unit) }
}
export function applyDefault(shape: Shape, edge: Edge, project: Project, kind: 'end' | 'front'): Shape {
  return { ...shape, allowances: { ...shape.allowances, [edge]: { ...project.defaults[kind], origin: 'default', defaultRevision: project.defaults.revision } } }
}
export function parseBackup(raw: string): Project {
  if (new TextEncoder().encode(raw).byteLength > 5_000_000) throw new Error('工程檔超過 5 MB')
  let candidate: unknown
  try { candidate = JSON.parse(raw) } catch { throw new Error('不是有效的 JSON 工程檔') }
  const parsed = projectSchema.safeParse(candidate)
  if (!parsed.success) throw new Error('工程格式或版本不支援：' + parsed.error.issues[0].message)
  return parsed.data
}
export function importCopy(project: Project): Project {
  const p = structuredClone(project)
  p.id = uid(); p.name = (p.name.slice(0, 110) + '（匯入）'); p.revision = 0; p.updatedAt = new Date().toISOString()
  return p
}
export function sampleProject(): Project {
  const p = newProject(); p.name = '示範工程 · Sample only'
  const bath = newShape('rectangle', 'in')
  bath.name = 'Vanity 59 + 1'; bath.dimensions.width = quantity('59'); bath.dimensions.height = quantity('21')
  for (const e of edgeOrder(bath)) bath.allowances[e] = quantity('0', 'in', 'allowance')
  bath.allowances.right = { ...p.defaults.end, origin: 'default', defaultRevision: 0 }
  bath.allowances.front = { ...p.defaults.front, origin: 'default', defaultRevision: 0 }
  const sink = newReference('sink', 'in'); sink.x = quantity('30'); bath.references.push(sink)
  bath.notes = '櫃體不含門板；Front allowance 已含預留。Sink Y 待量。'
  const l = newShape('l', 'in'); l.name = 'Kitchen L'; l.basis = 'finished'
  l.dimensions = { width: quantity('96'), height: quantity('72'), legX: quantity('25.5'), legY: quantity('25.5') }
  const small = newShape('rectangle', 'in'); small.name = 'Stove 左側'; small.basis = 'finished'
  small.dimensions.width = quantity('24'); small.dimensions.height = quantity('25.5')
  const stove = newReference('cooktop', 'in'); stove.x = quantity('12'); small.references.push(stove)
  const bath2 = structuredClone(bath); bath2.id = uid(); bath2.name = 'Vanity 2'
  bath2.references = []; bath2.dimensions.width = quantity('47')
  p.areas = [
    { id: uid(), name: 'Kitchen', notes: '排版位置不代表現場相對距離', shapes: [small, l] },
    { id: uid(), name: 'Bathroom 1', notes: '', shapes: [bath] },
    { id: uid(), name: 'Bathroom 2', notes: '', shapes: [bath2] },
  ]
  return p
}


// Switching measurement basis retains both input sets; never relabel cabinet readings as finished readings.
export function setBasis(shape: Shape, basis: Shape['basis']): void {
  if (basis === shape.basis) return
  const previous = shape.dimensions
  shape.dimensions = shape.alternateDimensions
  shape.alternateDimensions = previous
  shape.basis = basis
}
