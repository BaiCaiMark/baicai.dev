import { jsPDF } from 'jspdf'
import { bounds, referenceGeometry, transformPoint, type Point, type Snapshot } from './geometry'
import { edgeOrder } from './model'
import { formatLength } from './units'

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
export function createPdf(snapshot: Snapshot, fontBytes: Uint8Array): Uint8Array {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', putOnlyUsedFonts: true, compress: true })
  pdf.addFileToVFS('NotoSansTC.ttf', binary(fontBytes))
  pdf.addFont('NotoSansTC.ttf', 'NotoTC', 'normal')
  pdf.setFont('NotoTC')
  pdf.setProperties({ title: snapshot.project.name + ' - Site Measure Studio', subject: 'Field measurements; not manufacturing approval', creator: 'Site Measure Studio' })
  const font = pdf.getFont()
  // Never silently drop unsupported characters (including emoji) from field notes.
  const cmap = (font.metadata as { cmap?: { unicode?: { codeMap?: Record<number, number> } } }).cmap?.unicode?.codeMap
  const allText = [snapshot.project.name, ...snapshot.entries.flatMap(e => [e.area.name, e.area.notes, e.shape.name, e.shape.notes, ...e.rows.flatMap(r => [r.label, r.text]), ...e.geometry.errors, ...e.geometry.warnings])].join('')
  if (cmap) {
    const missing = [...new Set(Array.from(allText).filter(c => c.trim() && !cmap[c.codePointAt(0)!]))]
    if (missing.length) throw new Error('PDF 字型不支援這些字元，請替換後重試：' + missing.slice(0, 12).join(' '))
  }
  let y = 0
  let sectionTitle = snapshot.project.name
  const header = (title: string) => {
    pdf.setTextColor(24, 33, 31); pdf.setFontSize(15); pdf.text('Site Measure Studio', 14, 16)
    pdf.setFontSize(10)
    const titles = pdf.splitTextToSize(title, 180) as string[]
    pdf.text(titles, 14, 24)
    const bottom = 24 + Math.max(titles.length - 1, 0) * 5
    pdf.setDrawColor(160); pdf.line(14, bottom + 4, 196, bottom + 4)
    y = bottom + 12
  }
  const next = (title: string) => { pdf.addPage(); header(title) }
  const paragraph = (text: string, color: [number, number, number] = [35, 45, 41]) => {
    pdf.setFontSize(10); pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text || '—', 180) as string[]
    for (const line of lines) {
      if (y > 274) next(sectionTitle + ' / continued 續頁')
      pdf.text(line, 14, y); y += 5.5
    }
    y += 2
  }
  header(snapshot.project.name + ' / revision ' + snapshot.project.revision)
  paragraph('現場量尺記錄 / Field measurements')
  paragraph('本文件不是加工核准。90° 為正交模板；未知、假設及未確認項目須複核。', [135, 72, 19])
  paragraph('圖面依頁面縮放，非 1:1。以標示數值為準。形狀排版位置不代表現場相對位置。')
  paragraph('顯示單位：' + (snapshot.project.unit === 'in' ? 'inch' : 'mm') + '；DXF 座標單位：mm。')
  paragraph('保存版本時間：' + snapshot.project.updatedAt)
  paragraph('幾何完成不代表牆角、伸出量、物料、開孔或加工工序已核准。參考線不是開孔輪廓。')
  for (const area of snapshot.project.areas) {
    paragraph(area.name + ' · ' + area.shapes.length + ' shapes')
    if (area.notes) paragraph('區域備註：' + area.notes)
  }
  const excluded = snapshot.entries.filter(e => !e.geometry.top)
  if (excluded.length) paragraph('DXF 將排除未完成輪廓：' + excluded.map(e => e.area.name + ' / ' + e.shape.name).join('；'), [160, 45, 35])
  for (const entry of snapshot.entries) {
    const { shape, area, geometry, rows } = entry
    sectionTitle = area.name + ' / ' + shape.name
    next(sectionTitle)
    const outline = geometry.top ?? (shape.basis === 'cabinet' ? geometry.base : null)
    if (outline) {
      const bb = bounds(outline.map(p => transformPoint(p, shape)))
      const scale = Math.min(152 / Math.max(bb.width, 1), 72 / Math.max(bb.height, 1))
      const ox = 105 - bb.width * scale / 2, oy = y + 12
      const view = (p: Point): Point => {
        const t = transformPoint(p, shape)
        return { x: ox + (t.x - bb.x) * scale, y: oy + (t.y - bb.y) * scale }
      }
      const polygon = (points: Point[], dashed: boolean) => {
        pdf.setLineDashPattern(dashed ? [2, 1.5] : [], 0)
        pdf.setDrawColor(dashed ? 140 : 15, dashed ? 140 : 76, dashed ? 140 : 67)
        pdf.setLineWidth(dashed ? 0.25 : 0.55)
        points.forEach((p, i) => { const a = view(p), b = view(points[(i + 1) % points.length]); pdf.line(a.x, a.y, b.x, b.y) })
      }
      if (shape.basis === 'cabinet' && geometry.base) polygon(geometry.base, true)
      if (geometry.top) polygon(geometry.top, false)
      edgeOrder(shape).forEach((edge, i) => {
        const a = view(outline[i]), b = view(outline[(i + 1) % outline.length])
        pdf.setTextColor(30); pdf.setFontSize(9)
        const p=outline[i],q=outline[(i+1)%outline.length]
        pdf.text(formatLength(Math.hypot(q.x-p.x,q.y-p.y),snapshot.project.unit), (a.x + b.x) / 2 + 2, (a.y + b.y) / 2 - 2)
      })
      if (geometry.top) {
        if (shape.rotation !== 0 || shape.mirrored) {
          const length=8/scale, o=view({x:0,y:0}),a=view({x:length,y:0}),b=view({x:0,y:length})
          pdf.setDrawColor(35,110,155);pdf.setTextColor(35,110,155);pdf.setFontSize(8);pdf.setLineDashPattern([],0)
          pdf.line(o.x,o.y,a.x,a.y);pdf.line(o.x,o.y,b.x,b.y)
          pdf.text('X+',a.x+1,a.y+3);pdf.text('Y+',b.x+1,b.y+3)
        }
        pdf.setDrawColor(35, 110, 155); pdf.setLineDashPattern([2, 1], 0); pdf.setLineWidth(0.3)
        for (const ref of shape.references) {
          const rg = referenceGeometry(ref, shape, geometry)
          for (const line of rg.lines) { const a = view(line.a), b = view(line.b); pdf.line(a.x, a.y, b.x, b.y) }
          if (rg.point) { const p = view(rg.point); pdf.circle(p.x, p.y, 1.2, 'S') }
        }
        pdf.setFontSize(10); pdf.setTextColor(30)
        pdf.text(formatLength(bounds(geometry.top).width, snapshot.project.unit) + ' × ' + formatLength(bounds(geometry.top).height, snapshot.project.unit), 105, oy + bb.height * scale + 9, { align: 'center' })
      }
      pdf.setLineDashPattern([], 0)
      y = oy + bb.height * scale + 19
      paragraph(geometry.top ? '實線：成品 / 灰虛線：櫃體 / 藍線：定位參考（非開孔）' : '僅顯示櫃體基準；成品輪廓未完成。', [85, 95, 90])
    } else paragraph('尺寸未完成或無效，沒有生成輪廓。', [160, 45, 35])
    for (const error of geometry.errors) paragraph('未完成：' + error, [160, 45, 35])
    for (const row of rows) paragraph(row.label + ': ' + row.text)
    const templateWarnings=geometry.warnings.filter(w=>w.includes('90°'))
    if (templateWarnings.length) paragraph('複核：' + templateWarnings.join('; '), [135, 72, 19])
    if (area.notes) paragraph('區域備註：' + area.notes)
    if (shape.notes) paragraph('形狀備註：' + shape.notes)
  }
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i); pdf.setFont('NotoTC'); pdf.setFontSize(8); pdf.setTextColor(100)
    pdf.text('Field record - review before fabrication / ' + i + ' / ' + pages, 14, 289)
  }
  return new Uint8Array(pdf.output('arraybuffer'))
}
