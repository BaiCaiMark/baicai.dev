import { jsPDF } from 'jspdf'
import { bounds, type Point, type Snapshot } from './geometry'
import { edgeOrder, treatmentOf } from './model'
import { drawPartSheets } from './part-sheets'
import { adoptSharedCanvas, projectCanvasItems } from './project-canvas'
import { canvasNoteLines, noteCardHeight, NOTE_WIDTH } from './canvas-notes'

export async function loadPdfFont(): Promise<Uint8Array> {
  const response = await fetch('/fonts/site-measure/NotoSansTC-Regular.ttf')
  if (!response.ok) throw new Error('PDF 中文字型載入失敗，請確認網路後重試')
  return new Uint8Array(await response.arrayBuffer())
}
function binary(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return result
}

type Rgb = [number, number, number]
const green: Rgb = [38, 91, 78]
const orange: Rgb = [172, 94, 35]
const textColor: Rgb = [34, 49, 44]
const white: Rgb = [255, 255, 255]
const inBounds = (p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y)

/**
 * Minimal field drawing, not a fabrication sheet.
 * The PDF uses the shared *visual* workspace, never CNC positions.
 * Wall sketches and canvas notes stay schematic and are NOT added to DXF.
 */
export function createPdf(snapshot: Snapshot, fontBytes: Uint8Array): Uint8Array {
  const { project } = snapshot
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape', putOnlyUsedFonts: true, compress: true })
  pdf.addFileToVFS('NotoSansTC.ttf', binary(fontBytes))
  pdf.addFont('NotoSansTC.ttf', 'NotoTC', 'normal')
  pdf.setFont('NotoTC')
  pdf.setProperties({ title: project.name + ' - Field Drawing', subject: 'Schematic field measurements - NOT CNC approval', creator: 'Site Measure Studio' })

  // Old room-local projects are placed in a shared visual workspace before printing.
  // This copy leaves original measurements, backup and CNC geometry untouched.
  const drawingProject = adoptSharedCanvas(project)
  const parts = projectCanvasItems(drawingProject.areas)
  const notes = project.canvasNotes ?? []
  const walls = project.wallSketches ?? []
  const strings = [project.name, ...parts.flatMap(p => [p.areaName, p.shape.name, p.shape.notes,
    ...p.shape.fieldRecords.map(r=>r.kind==='note'?r.text:r.label)]), ...notes.map(n => n.text), ...walls.map(w => w.name)]
  const cmap = (pdf.getFont().metadata as { cmap?: { unicode?: { codeMap?: Record<number, number> } } }).cmap?.unicode?.codeMap
  if (cmap) {
    const missing = [...new Set(Array.from(strings.join('')).filter(c => c.trim() && !cmap[c.codePointAt(0)!]))]
    if (missing.length) throw new Error('PDF 字型不支援這些字元，請替換後重試：' + missing.slice(0, 12).join(' '))
  }

  // Canvas coordinates have no surveying significance, but all drawings, notes and
  // sketches share them. Keep their relative placement instead of re-layout per Part.
  const framing: Point[] = []
  for (const part of parts) {
    const { x, y } = part
    framing.push(...part.points.map(p => ({ x: x + p.x, y: y + p.y })))
    framing.push({ x: x - 95, y: y - 185 }, { x: x + part.width + 95, y: y + part.height + 95 })
  }
  for (const wall of walls) framing.push(...wall.points)
  for (const note of notes) {
    framing.push({ x: note.targetX, y: note.targetY }, { x: note.x, y: note.y },
      { x: note.x + NOTE_WIDTH, y: note.y + noteCardHeight(note.text) })
  }
  const box = framing.length ? bounds(framing) : { x: 0, y: 0, width: 1200, height: 740 }
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const left = 12, right = 12, top = 27, bottom = 18
  const drawableW = pageWidth - left - right
  const drawableH = pageHeight - top - bottom
  const scale = Math.min(drawableW / Math.max(box.width, 1), drawableH / Math.max(box.height, 1))
  const shiftX = left + (drawableW - box.width * scale) / 2
  const shiftY = top + (drawableH - box.height * scale) / 2
  const px = (p: Point): Point => ({
    x: shiftX + (p.x - box.x) * scale,
    y: shiftY + (p.y - box.y) * scale,
  })
  const line = (a: Point, b: Point) => {
    const a1 = px(a), b1 = px(b)
    if (inBounds(a1) && inBounds(b1)) pdf.line(a1.x, a1.y, b1.x, b1.y)
  }
  const setStroke = (color: Rgb, width: number, dash: number[] = []) => {
    pdf.setDrawColor(...color)
    pdf.setLineWidth(width)
    pdf.setLineDashPattern(dash, 0)
  }
  const words = (s: string, x: number, y: number, size = 9, align: 'left' | 'center' | 'right' = 'left', color: Rgb = textColor) => {
    pdf.setTextColor(...color)
    pdf.setFont('NotoTC', 'normal')
    pdf.setFontSize(size)
    pdf.text(s, x, y, { align })
  }
  // Small header and footer only: no multi-page text report, no per-edge data table.
  words(project.name.length > 65 ? project.name.slice(0, 64) + '…' : project.name, left, 12, 14)
  words(project.unit === 'in' ? 'inch' : 'mm', pageWidth - right, 12, 9, 'right')
  setStroke([202, 212, 207], 0.24)
  pdf.line(left, 17, pageWidth - right, 17)

  // Pass 1: Part fills and outlines. Open geometry remains visibly incomplete.
  for (const part of parts) {
    const outline = part.points.map(p => px({ x: part.x + p.x, y: part.y + p.y }))
    if (outline.length < 3) continue
    pdf.setFillColor(244, 249, 246)
    setStroke(part.guide ? [140, 147, 143] : green, part.guide ? 0.3 : 0.65, part.guide ? [2.4, 1.8] : [])
    const start = outline[0]
    const deltas = outline.slice(1).map((p, i) => [p.x - outline[i].x, p.y - outline[i].y])
    pdf.lines(deltas, start.x, start.y, [1, 1], 'FD', true)
    pdf.setLineDashPattern([], 0)
    // Edge treatment is visual only; it is never manufacturing approval.
    if (!part.guide) {
      edgeOrder(part.shape).forEach((edge, i) => {
        const t = treatmentOf(part.shape, edge)
        if (!t) return
        const color: Rgb = t === 'polish' ? [18, 155, 84] : t === 'no-polish' ? [205, 61, 55] : orange
        setStroke(color, 0.94, t === 'polish' ? [] : [2.2, 1.2])
        const a = part.points[i], b = part.points[(i + 1) % part.points.length]
        line({ x: part.x + a.x, y: part.y + a.y }, { x: part.x + b.x, y: part.y + b.y })
      })
    }
  }

  // Pass 2: independent *schematic* wall drawings, above countertop fills.
  // No scale or mm values are inferred from the freehand points.
  setStroke(orange, 0.85, [2.4, 1.6])
  for (const wall of walls) {
    wall.points.slice(1).forEach((p, i) => line(wall.points[i], p))
    // A distinct dashed orange line plus the footer avoids repeated labels on the drawing.
  }
  pdf.setLineDashPattern([], 0)

  for (const part of parts) {
    const p = px({ x: part.x, y: part.y - 35 })
    words(part.shape.name, p.x, p.y, 9)
  }

  // Pass 4: visible on-canvas notes, with their original project-level pins.
  // Notes remain as written and do not change measurements or CNC geometry.
  for (const note of notes) {
    const at = px({ x: note.x, y: note.y })
    const target = px({ x: note.targetX, y: note.targetY })
    const lines = canvasNoteLines(note.text)
    const fontSize = 8.2
    pdf.setFontSize(fontSize)
    const neededW = Math.max(30, ...lines.map(l => pdf.getTextWidth(l) + 7))
    const cardW = Math.min(55, neededW)
    const cardH = Math.max(12, 5 + lines.length * 4.2)
    setStroke(orange, 0.35, [1.5, 1])
    pdf.line(target.x, target.y, at.x + 2, at.y + cardH / 2)
    pdf.setFillColor(255, 250, 241)
    pdf.setDrawColor(203, 151, 103)
    pdf.roundedRect(at.x, at.y, cardW, cardH, 1.3, 1.3, 'FD')
    pdf.setFillColor(...white)
    pdf.circle(target.x, target.y, 1.3, 'FD')
    for (let i = 0; i < lines.length; i++) {
      words(lines[i], at.x + 3, at.y + 4.9 + i * 4.2, fontSize)
    }
  }
  pdf.setLineDashPattern([], 0)

  // This one-line caution protects against mistaking a sketch for a CNC drawing.
  const footer = 'FIELD SKETCH · dashed orange = schematic wall · NOT CNC / NOT TO SCALE · verify measurements'
  setStroke([202, 212, 207], 0.24)
  pdf.line(left, pageHeight - 12, pageWidth - right, pageHeight - 12)
  words(footer, left, pageHeight - 6.5, 7.1, 'left', [92, 105, 98])
  if (parts.length) {
    // Keep the shared map when its spatial notes or wall sketches carry information.
    const overview = notes.length > 0 || walls.length > 0
    for (const part of parts) drawPartSheets(pdf, project, part)
    if (!overview) pdf.deletePage(1)
  }
  const count = pdf.getNumberOfPages()
  for (let page = 1; page <= count; page++) {
    pdf.setPage(page)
    words(page + ' / ' + count, pdf.internal.pageSize.getWidth() - right, pdf.internal.pageSize.getHeight() - 6.5, 8, 'right')
  }
  return new Uint8Array(pdf.output('arraybuffer'))
}
