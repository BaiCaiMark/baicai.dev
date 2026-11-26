import type { jsPDF } from 'jspdf'
import { area, calculate, referenceGeometry, type Point } from './geometry'
import { edgeOrder, treatmentOf, value, type Project } from './model'
import type { projectCanvasItems } from './project-canvas'
import { finishedEdgeReading, finishedFormula } from './worksheet'
import { formatLength } from './units'
import { sinkChainPoints, sinkDimensions, sinkDimensionText } from './sink-dimensions'
import { fieldMeasurementText } from './field'

type Part = ReturnType<typeof projectCanvasItems>[number]

/** Compose each detail in paper millimetres. The saved canvas arrangement is only used for the overview. */
export function drawPartSheets(pdf: jsPDF, project: Project, part: Part) {
  const { shape } = part
  const geometry = calculate(shape)
  const sinks = shape.references.filter(r => r.kind === 'sink')
  const unit = project.unit
  const length = (n: number | null) => n === null ? '?' : formatLength(n, unit)
  const orientation = part.height > part.width * 1.2 ? 'portrait' : 'landscape'
  const title = part.areaName + ' / ' + shape.name
  const notes=[shape.notes,...shape.fieldRecords.map(r=>(r.edge?r.edge+' · ':'')+(r.kind==='note'?r.text:r.label+' '+fieldMeasurementText(r.measurement,unit)))].filter(s=>s.trim())
  const heading = () => {
    pdf.addPage('a4', orientation)
    pdf.setFont('NotoTC')
    pdf.setTextColor(31, 64, 53)
    pdf.setFontSize(14)
    pdf.text(title, 12, 13, {maxWidth:pdf.internal.pageSize.getWidth()-24})
    pdf.setFontSize(9)
    pdf.text((part.guide ? 'INCOMPLETE · ' : '') + 'Field drawing · ' + unit +
      ' · dashed = cabinet · OH = overhang · green = polish · orange = miter', 12, 29)
    pdf.text('Field measurements · verify on site · not to scale', 12, pdf.internal.pageSize.getHeight()-7)
  }
  for (let start = 0; start < Math.max(1,sinks.length); start += 3) {
    heading()
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight()
    pdf.setFontSize(9)
    const noteLines=pdf.splitTextToSize(notes.join(' · '),w-24) as string[]
    if(notes.length && noteLines.length<=2)pdf.text(noteLines,12,35)
    const group = sinks.slice(start,start+3)
    const top = 48, bottom = h-26-group.length*17
    const scale = Math.min((w-82)/Math.max(part.width,1), (bottom-top)/Math.max(part.height,1))
    const paper = (p: Point) => ({x:(w-part.width*scale)/2+p.x*scale,y:top+(bottom-top-part.height*scale)/2+p.y*scale})
    const template = (p: Point) => paper(part.local(p))
    const points = part.points.map(paper)
    const line = (a:Point,b:Point) => pdf.line(a.x,a.y,b.x,b.y)
    const label = (s:string,p:Point,size=8,angle=0) => {
      pdf.setFontSize(size)
      if (angle===90) pdf.text(s,p.x,p.y+pdf.getTextWidth(s)/2,{angle})
      else pdf.text(s,p.x,p.y,{align:'center'})
    }
    const edges = edgeOrder(shape), sign = Math.sign(area(points))
    edges.forEach((edge,i) => {
      const a=points[i], b=points[(i+1)%points.length]
      const finish=treatmentOf(shape,edge)
      pdf.setDrawColor(...(finish==='polish'?[20,133,86]:finish==='miter'?[177,98,37]:[63,75,69]) as [number,number,number])
      pdf.setLineDashPattern(part.guide?[1.3,1]:[],0)
      pdf.setLineWidth(finish==='polish'?0.8:0.45)
      line(a,b)
    })
    if (shape.basis==='cabinet'&&geometry.base) {
      const cabinet = geometry.base.map(template)
      pdf.setDrawColor(107,117,112)
      pdf.setLineWidth(0.22)
      pdf.setLineDashPattern([1.4,1],0)
      cabinet.forEach((p,i)=>line(p,cabinet[(i+1)%cabinet.length]))
    }
    pdf.setLineDashPattern([],0)
    edges.forEach((edge,i)=>{
      const a=points[i],b=points[(i+1)%points.length]
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)
      if (!len) return
      const nx=sign*dy/len,ny=-sign*dx/len
      const offset=(p:Point,d:number)=>({x:p.x+d*nx,y:p.y+d*ny})
      const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2}
      const angle=Math.abs(dy)>Math.abs(dx)?90:0
      if (shape.basis==='cabinet') {
        const overhang=value(shape.allowances[edge])
        if(overhang!==0) label('OH '+length(overhang),offset(mid,-4),8,angle)
      }
      if(shape.template==='rectangle'&&(edge==='front'||edge==='left'))return
      const formula=finishedFormula(shape,edge,unit)
      const finished=length(finishedEdgeReading(shape,edge))
      pdf.setDrawColor(149,161,153)
      pdf.setLineWidth(0.18)
      line(a,offset(a,5)); line(b,offset(b,5)); line(offset(a,4),offset(b,4))
      label(finished,offset(mid,7),9,angle)
      if(formula) label(formula,offset(mid,12),8,angle)
    })
    const referenceColor: [number,number,number] = [48,97,131]
    group.forEach((ref,i)=>{
      const readings=sinkDimensions(shape,ref,unit)
      const tag='S'+(start+i+1)
      pdf.setTextColor(...referenceColor);pdf.setDrawColor(...referenceColor)
      pdf.setLineWidth(0.24);pdf.setLineDashPattern([1,1],0)
      const rg=referenceGeometry(ref,shape,geometry)
      for(const segment of rg.lines)line(template(segment.a),template(segment.b))
      if(rg.point){const p=template(rg.point);pdf.circle(p.x,p.y,1)}
      pdf.setLineDashPattern([],0)
      const chain=sinkChainPoints(ref,shape,geometry,(i+1)/(group.length+1))?.map(template)
      if(chain){
        for(const [index,side] of (['left','right'] as const).entries()){
          const a=chain[index],b=chain[index+1]
          line(a,b)
          line({x:a.x-1,y:a.y+1},{x:a.x+1,y:a.y-1})
          line({x:b.x-1,y:b.y+1},{x:b.x+1,y:b.y-1})
          label(tag+' '+length(readings[side].finished.mm),{x:(a.x+b.x)/2,y:(a.y+b.y)/2-1},8,Math.abs(a.x-b.x)<0.001?90:0)
        }
      }
      const y=h-17-(group.length-i)*17
      pdf.setFontSize(9)
      pdf.text(tag+' · measured from '+ref.fromX+' '+(ref.basis==='cabinet'?'cabinet':'finished')+'  '+length(readings.raw)+(value(ref.y)===null?' · X only':''),12,y)
      for(const [index,side] of (['left','right'] as const).entries()){
        const x=12+index*(w-24)/2
        pdf.setFontSize(8)
        pdf.text(side+' cabinet   '+sinkDimensionText(readings[side].cabinet,unit),x,y+4.5)
        pdf.text(side+' finished   '+sinkDimensionText(readings[side].finished,unit),x,y+9)
      }
    })
  }
  pdf.setFontSize(9)
  if(notes.length && pdf.splitTextToSize(notes.join(' · '),pdf.internal.pageSize.getWidth()-24).length>2){
    heading()
    pdf.setFontSize(10)
    let y=43
    for(const note of notes){
      for(const row of pdf.splitTextToSize(note,pdf.internal.pageSize.getWidth()-24) as string[]){
        if(y>pdf.internal.pageSize.getHeight()-19){heading();pdf.setFontSize(10);y=43}
        pdf.text(row,12,y);y+=5
      }
      y+=3
    }
  }
}
