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
export const treatmentSchema = z.enum(['no-polish', 'polish', 'miter'])
export type Treatment = z.infer<typeof treatmentSchema>
export const referenceSchema = z.object({
  id, kind: z.enum(['sink', 'cooktop']), basis: z.enum(['cabinet', 'countertop']),
  fromX: z.enum(['left', 'right']), fromY: z.enum(['back', 'front']),
  x: quantitySchema, y: quantitySchema,
}).strict()
const edgeSchema = z.enum(['back','right','front','left','innerX','innerY'])
export const fieldRecordSchema = z.discriminatedUnion('kind', [
  z.object({ id, edge: edgeSchema.nullable(), kind: z.literal('measurement'), label: z.string().max(160), measurement: quantitySchema }).strict(),
  z.object({ id, edge: edgeSchema.nullable(), kind: z.literal('note'), text }).strict(),
])
export type FieldRecord = z.infer<typeof fieldRecordSchema>
const dimensionsSchema = z.object({ width: quantitySchema, height: quantitySchema, legX: quantitySchema, legY: quantitySchema }).strict()
export const shapeSchema = z.object({
  id, name: z.string().min(1).max(120), template: z.enum(['rectangle', 'l']),
  // A stepped vanity reuses the proven six-edge L geometry; old projects omit this optional tag.
  profile: z.enum(['vanity-step']).optional(),
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
  fieldRecords: z.array(fieldRecordSchema).max(80).default([]),
  // Optional for schema-v2 backups created before quick edge treatment was introduced.
  treatments: z.partialRecord(edgeSchema, treatmentSchema).optional(),
  // OPEN is a physical/visibility decision, separate from Polish and Overhang.
  openEdges: z.partialRecord(edgeSchema, z.boolean()).optional(),
  layout: z.object({x:z.number().finite().min(-10000).max(10000),y:z.number().finite().min(-10000).max(10000)}).strict().optional(),
}).strict()
const currentProjectSchema = z.object({
  schemaVersion: z.literal(2), id, name: z.string().min(1).max(120),
  revision: z.number().int().min(0), updatedAt: z.string().datetime(), unit: z.enum(['in', 'mm']),
  defaults: z.object({ revision: z.number().int().min(0), end: quantitySchema, front: quantitySchema }).strict(),
  areas: z.array(z.object({
    id, name: z.string().min(1).max(120), notes: text, shapes: z.array(shapeSchema).max(60),
  }).strict()).min(1).max(30),
}).strict().superRefine((p, ctx) => {
  const ids = [p.id, ...p.areas.flatMap(a => [a.id, ...a.shapes.flatMap(s => [s.id, ...s.references.map(r => r.id), ...s.fieldRecords.map(r=>r.id)])])]
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Duplicate identifiers / 重複識別碼' })
  if (p.areas.reduce((sum, a) => sum + a.shapes.length, 0) > 200) ctx.addIssue({ code: 'custom', message: 'Maximum 200 shapes / 最多 200 個形狀' })
})
// Parse into a new object; source v1 records/backups are never modified in place.
export const projectSchema = z.preprocess(raw => {
  if (raw && typeof raw === 'object' && 'schemaVersion' in raw && raw.schemaVersion === 1) return { ...raw, schemaVersion: 2 }
  return raw
}, currentProjectSchema)
export type Project = z.infer<typeof projectSchema>
export type Shape = z.infer<typeof shapeSchema>
export type Reference = z.infer<typeof referenceSchema>
export type Area = Project['areas'][number]
export const paramLabels: Record<Param, string> = { width: 'Back run length', height: 'Left run depth', legX: 'Right end depth', legY: 'Lower end width' }
export const edgeLabels: Record<Edge, string> = { back: 'Back run', right: 'Right end', front: 'Front edge', left: 'Left back run', innerX: 'Inside horizontal run', innerY: 'Inside vertical run' }
export const originLabels: Record<Quantity['origin'] | 'calculated', string> = {
  measured: 'Measured', default: 'Project default', allowance: 'Manual allowance', assumed: 'Estimate', calculated: 'Calculated',
}
export const statusLabels: Record<Status, string> = { unconfirmed: 'Not field checked', confirmed: 'Field checked', verify: 'Needs Check' }
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
    rotation: 0, mirrored: false, angleStatus: 'unconfirmed', notes: '', references: [], fieldRecords: [],
  }
}
/** The DXF supplied two mirrored 70 × 22.5 inch stepped outlines (deep width 40, shallow depth 7).
 * This creates an EMPTY measured template, never misrepresenting sample contour coordinates as surveyed cabinet dimensions.
 * Deep Left is the canonical L shape; Deep Right is mirrored.
 */
export function newVanityStep(project: Project, deepSide: 'left' | 'right', index = 1): Shape {
  const shape = newShape('l', project.unit, index)
  shape.profile = 'vanity-step'
  shape.name = 'Vanity Step · Deep ' + (deepSide === 'left' ? 'Left ' : 'Right ') + index
  shape.mirrored = deepSide === 'right'
  shape.notes = 'Template silhouette from reference DXF 111401(1).dxf: overall 70″ × 22.5″, full-depth run 40″, shallow section 30″ × 7″. The DXF does not identify cabinet/finished basis, sink, or edge treatments. Enter actual cabinet measurements; sample numbers are not field readings.'
  // Only the position/form of the blank guide is based on the reference.
  // 0″ is an explicit, unconfirmed project default, individually editable per edge.
  for (const edge of edgeOrder(shape)) {
    shape.allowances[edge] = {...quantity('0', project.unit, 'default'), status: 'unconfirmed', defaultRevision: project.defaults.revision}
  }
  return shape
}
export function newProject(): Project {
  return {
    schemaVersion: 2, id: uid(), name: 'New measurement project', revision: 0, updatedAt: new Date().toISOString(), unit: 'in',
    defaults: { revision: 0, end: quantity('1', 'in', 'allowance'), front: quantity('1.5', 'in', 'allowance') },
    areas: [{ id: uid(), name: 'Kitchen', notes: '', shapes: [] }],
  }
}
export function newReference(kind: Reference['kind'], unit: Unit): Reference {
  return { id: uid(), kind, basis: 'countertop', fromX: 'left', fromY: 'back', x: quantity('', unit), y: quantity('', unit) }
}
export function duplicateShape(source: Shape, existingNames: string[], position: { x: number; y: number }): Shape {
  const copy = structuredClone(source)
  copy.id = uid()
  copy.references.forEach(r => { r.id = uid() })
  copy.fieldRecords.forEach(r => { r.id = uid() })
  let count = 1, name: string
  do { name = source.name.slice(0, 100) + (count === 1 ? ' copy' : ' copy ' + count); count++ } while (existingNames.includes(name))
  copy.name = name
  copy.layout = { x: Math.max(-10000, Math.min(10000, position.x + 48)), y: Math.max(-10000, Math.min(10000, position.y + 48)) }
  return copy
}
export function treatmentOf(shape: Shape, edge: Edge): Treatment | null {
  return shape.treatments?.[edge] ?? null
}
// Only replace blank or default-sourced values. Manual custom allowances remain untouched.
export function setTreatment(shape: Shape, edge: Edge, treatment: Treatment, project: Project): void {
  shape.treatments ??= {}
  const previous = shape.treatments[edge]
  shape.treatments[edge] = treatment
  if (previous === treatment) return
  // Once an explicit OPEN decision exists, treatment and allowance stay independent.
  if (shape.openEdges?.[edge] !== undefined) return
  const existing = shape.allowances[edge]
  if (existing.input.trim() && existing.origin !== 'default') return
  if (treatment === 'miter') {
    // No implicit slab thickness or joining geometry for miter.
    shape.allowances[edge] = quantity('', project.unit, 'default')
    return
  }
  if (treatment === 'no-polish') {
    shape.allowances[edge] = { ...quantity('0', project.unit, 'default'), defaultRevision: project.defaults.revision }
    return
  }
  shape.allowances[edge] = {
    ...((edge === 'front' || edge === 'innerX') ? project.defaults.front : project.defaults.end),
    origin: 'default', status: 'unconfirmed', defaultRevision: project.defaults.revision,
  }
}
// One-step rectangle starting point, with visible editable defaults (not measured readings).
export function applyRectangleQuickDefaults(shape: Shape, project: Project): void {
  if (shape.template !== 'rectangle') return
  shape.treatments = {back:'no-polish', right:'no-polish', front:'polish', left:'no-polish'}
  for (const edge of edgeOrder(shape)) {
    const preset = edge === 'front' ? project.defaults.front : quantity('0', project.unit, 'default')
    shape.allowances[edge] = {...preset,origin:'default',status:'unconfirmed',defaultRevision:project.defaults.revision}
  }
}
// Canvas-first defaults are suggestions only; never silently replace a measured or custom value.
export function setEdgeOpen(shape: Shape, edge: Edge, open: boolean, project: Project): void {
  const previousOpen = shape.openEdges?.[edge]
  const existing = shape.allowances[edge]
  const autoValue = !existing.input.trim() || existing.origin === 'default'
  const previousTreatment = shape.treatments?.[edge]
  shape.openEdges ??= {}
  shape.openEdges[edge] = open
  if (autoValue) {
    const preset = open ? (edge === 'front' || edge === 'innerX' ? project.defaults.front : project.defaults.end) : quantity('0', project.unit, 'default')
    shape.allowances[edge] = { ...preset, origin: 'default', status: 'unconfirmed', defaultRevision: project.defaults.revision }
  }
  shape.treatments ??= {}
  // Preserve Miter and independently chosen treatments. Auto-follow only while the allowance is still a preset.
  if (!previousTreatment || (autoValue && previousOpen !== undefined && previousTreatment === (previousOpen ? 'polish' : 'no-polish')))
    shape.treatments[edge] = open ? 'polish' : 'no-polish'
}
export function applyCanvasOpenDefaults(shape: Shape, project: Project): void {
  if (shape.openEdges) return
  for (const edge of edgeOrder(shape)) setEdgeOpen(shape, edge, edge === 'front' || (shape.template === 'l' && edge === 'innerX'), project)
}
export function applyDefault(shape: Shape, edge: Edge, project: Project, kind: 'end' | 'front'): Shape {
  return { ...shape, allowances: { ...shape.allowances, [edge]: { ...project.defaults[kind], origin: 'default', defaultRevision: project.defaults.revision } } }
}
export function parseBackup(raw: string): Project {
  if (new TextEncoder().encode(raw).byteLength > 5_000_000) throw new Error('Project backup exceeds 5 MB')
  let candidate: unknown
  try { candidate = JSON.parse(raw) } catch { throw new Error('Not a valid JSON project backup') }
  const parsed = projectSchema.safeParse(candidate)
  if (!parsed.success) throw new Error('Unsupported project format or version: ' + parsed.error.issues[0].message)
  return parsed.data
}
export function importCopy(project: Project): Project {
  const p = structuredClone(project)
  p.id = uid(); p.name = (p.name.slice(0, 105) + ' (imported)'); p.revision = 0; p.updatedAt = new Date().toISOString()
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

export function worksheetSample(): Project {
  const p = sampleProject(), kitchen = p.areas[0], l = kitchen.shapes[1]
  p.name='Sample Kitchen & Vanities';kitchen.shapes[0].name='Stove Left';kitchen.notes='Visual arrangement only; not surveyed positions.'
  const island = newShape('rectangle','in'); island.name='Island'; island.basis='finished'
  island.dimensions.width=quantity('72');island.dimensions.height=quantity('36')
  l.fieldRecords.push({id:uid(),edge:'innerX',kind:'measurement',label:'Cabinet check',measurement:quantity('12 + 24 3/4 + 1 1/2')})
  l.fieldRecords.push({id:uid(),edge:'back',kind:'note',text:'Wall may be curved. Verify before fabrication.'})
  kitchen.shapes=[l,kitchen.shapes[0],island]
  l.layout={x:310,y:110};kitchen.shapes[1].layout={x:80,y:110};island.layout={x:560,y:390}
  return p
}
