import type { Area, Project } from './model'
import { worksheetLayout } from './worksheet'

// A Part's layout is a worksheet coordinate, not a surveyed / CNC position.
// All Rooms share these same drawing coordinates after a one-time, idempotent upgrade.
export function projectCanvasItems(areas: readonly Area[]) {
  return areas.flatMap(area => worksheetLayout(area.shapes).map(item => ({
    ...item,
    areaId: area.id,
    areaName: area.name,
  })))
}

const clamp = (value: number) => Math.max(-10000, Math.min(10000, value))

/**
 * Existing schema-v2 projects stored each Room's positions on an independent canvas.
 * Retain the first occupied Room exactly as drawn and place subsequent Rooms below
 * the previous Room without changing measurements, rotations, IDs or DXF geometry.
 * No in-place mutation: callers can save the upgraded project as a new revision.
 */
export function adoptSharedCanvas(source: Project): Project {
  if (source.canvasLayout === 'shared-v1') return source
  const project = structuredClone(source)
  let bottom: number | null = null
  for (const area of project.areas) {
    const items = worksheetLayout(area.shapes)
    if (!items.length) continue
    const minX = Math.min(...items.map(item => item.x))
    const minY = Math.min(...items.map(item => item.y))
    const dx = bottom === null ? 0 : 100 - minX
    const dy = bottom === null ? 0 : bottom + 240 - minY
    for (const item of items) {
      item.shape.layout = { x: clamp(item.x + dx), y: clamp(item.y + dy) }
    }
    bottom = Math.max(...items.map(item => item.shape.layout!.y + item.height))
  }
  project.canvasLayout = 'shared-v1'
  return project
}
