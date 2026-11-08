import { jsPDF } from 'jspdf'
import { bounds, calculate, referenceGeometry, type Point, type Snapshot } from './geometry'
import { edgeOrder, treatmentOf, value } from './model'
import { formatLength } from './units'
import { adoptSharedCanvas, projectCanvasItems } from './project-canvas'
import { finishedEdgeReading } from './worksheet'
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
const red: Rgb = [172, 65, 52]
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
  const strings = [project.name, ...parts.flatMap(p => [p.areaName, p.shape.name]), ...notes.map(n => n.text), ...walls.map(w => w.name)]
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
  const tag = (label: string, world: Point, size = 9, color: Rgb = textColor) => {
    const p = px(world)
    pdf.setFontSize(size)
    const width = Math.min(58, pdf.getTextWidth(label) + 2.8)
    pdf.setFillColor(...white)
    pdf.roundedRect(p.x - width / 2, p.y - 3.6, width, 5.6, 1, 1, 'F')
    words(label, p.x, p.y, size, 'center', color)
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

  // Pass 3: finished measurements directly on the drawing, including incomplete '?'.
  for (const part of parts) {
    const { shape } = part
    words((part.areaName ? part.areaName + ' / ' : '') + shape.name,
      px({ x: part.x, y: part.y - 145 }).x, px({ x: part.x, y: part.y - 145 }).y, 9)
    const signedArea = part.points.reduce((s, p, i) => {
      const q = part.points[(i + 1) % part.points.length]
      return s + p.x * q.y - q.x * p.y
    }, 0)
    const sign = signedArea >= 0 ? 1 : -1
    edgeOrder(shape).forEach((edge, i) => {
      // Rectangle opposite edges repeat the same finished reading; keep one per axis.
      if (shape.template === 'rectangle' && (edge === 'front' || edge === 'left')) return
      const a = part.points[i], b = part.points[(i + 1) % part.points.length]
      if (!a || !b) return
      const dx = b.x - a.x, dy = b.y - a.y, size = Math.hypot(dx, dy)
      if (size < 1) return
      const normal = { x: sign * dy / size, y: -sign * dx / size }
      const mid = { x: part.x + (a.x + b.x) / 2, y: part.y + (a.y + b.y) / 2 }
      const label = { x: mid.x + normal.x * 45, y: mid.y + normal.y * 45 }
      const n = finishedEdgeReading(shape, edge)
      const text = n === null ? '?' : formatLength(n, project.unit)
      const edgeA = { x: part.x + a.x, y: part.y + a.y }
      const edgeB = { x: part.x + b.x, y: part.y + b.y }
      setStroke([128, 146, 136], 0.18)
      line(edgeA, { x: edgeA.x + normal.x * 27, y: edgeA.y + normal.y * 27 })
      line(edgeB, { x: edgeB.x + normal.x * 27, y: edgeB.y + normal.y * 27 })
      const labelPoint = px(label)
      tag(text, label, 9, n === null ? red : green)
      if (size * scale < 22) {
        setStroke([128, 146, 136], 0.18)
        const m = px(mid)
        pdf.line(m.x, m.y, labelPoint.x, labelPoint.y)
      }
    })
    const geometry = calculate(shape)
    let sinkCount = 0
    for (const ref of shape.references) {
      if (ref.kind !== 'sink') continue
      sinkCount++
      let at: Point | null = null
      if (geometry.top) {
        const rg = referenceGeometry(ref, shape, geometry)
        if (rg.point) at = part.local(rg.point)
      }
      if (!at) {
        const x = value(ref.x)
        const width = geometry.top ? bounds(geometry.top).width : null
        const t = x !== null && width && width > 0 ? Math.max(0.08, Math.min(0.92, x / width)) : 0.5
        at = { x: part.width * (ref.fromX === 'right' ? 1 - t : t), y: part.height * 0.5 }
      }
      const spot = px({ x: part.x + at.x, y: part.y + at.y })
      setStroke([66, 124, 141], 0.25, [1.5, 1])
      pdf.circle(spot.x, spot.y, 1.65, 'S')
      const x = value(ref.x)
      const label = 'S' + sinkCount + ' ' + (x === null ? '?' : formatLength(x, project.unit))
      pdf.setFontSize(8.5)
      const ww = pdf.getTextWidth(label) + 5
      pdf.setFillColor(...white)
      pdf.roundedRect(spot.x - ww / 2, spot.y - 10, ww, 6, 1.3, 1.3, 'F')
      words(label, spot.x, spot.y - 5.7, 8.5, 'center', [51, 101, 125])
    }
    pdf.setLineDashPattern([], 0)
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
  words('1 / 1', pageWidth - right, pageHeight - 6.5, 7.1, 'right', [92, 105, 98])
  return new Uint8Array(pdf.output('arraybuffer'))
}
