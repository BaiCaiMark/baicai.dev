import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import DxfParser from 'dxf-parser'
import { calculate, exportSnapshot } from '../../app/tools/site-measure/core/geometry'
import { edgeOrder, newProject, newReference, newShape, parseBackup, quantity, setEdgeOpen, type Shape } from '../../app/tools/site-measure/core/model'
import { finishedFormula } from '../../app/tools/site-measure/core/worksheet'
import { formatLength } from '../../app/tools/site-measure/core/units'
import { sinkDimensions, sinkChainPoints, sinkDimensionText } from '../../app/tools/site-measure/core/sink-dimensions'
import { createPdf } from '../../app/tools/site-measure/core/export-pdf'
import { createDxf } from '../../app/tools/site-measure/core/export-dxf'

function kitchen(name: string, width: string, height: string, template: Shape['template'] = 'rectangle') {
  const part = newShape(template,'in')
  part.name = name
  part.dimensions = {width:quantity(width),height:quantity(height),legX:quantity('24'),legY:quantity('24')}
  for (const e of edgeOrder(part)) part.allowances[e] = quantity('0')
  return part
}

test('Kitchen 1 sink uses recorded side and datum, including partial measurements',()=>{
  const part=kitchen('Kitchen 1','143 13/16','24')
  part.allowances.right=quantity('1')
  const ref=newReference('sink','in','cabinet')
  ref.x=quantity('71 1/2')
  const chain=sinkDimensions(part,ref,'in')
  assert.equal(sinkDimensionText(chain.right.cabinet,'in'),'143 13/16 − 71 1/2 = 72 5/16″')
  assert.equal(sinkDimensionText(chain.right.finished,'in'),'143 13/16 − 71 1/2 + 1 = 73 5/16″')
  assert.equal(formatLength(chain.left.finished.mm!+chain.right.finished.mm!,'in'),'144 13/16″')
  part.dimensions.width=quantity('')
  assert.equal(sinkDimensions(part,ref,'in').right.finished.mm,null)
  assert.equal(formatLength(sinkDimensions(part,ref,'in').left.finished.mm,'in'),'71 1/2″')
})

test('Island four-edge overhang changes only derived distances, including right-origin and finished-origin records',()=>{
  const p=newProject(), part=kitchen('Island','116 1/4','38')
  p.areas[0].shapes=[part]
  const ref=newReference('sink','in','cabinet')
  ref.x=quantity('71 9/16')
  part.references=[ref]
  for(const side of ['left','right'] as const){
    ref.fromX=side
    for(const [offset,total,same] of [['1','118 1/4″','72 9/16″'],['3/4','117 3/4″','72 5/16″'],['0','116 1/4″','71 9/16″']]){
      for(const edge of edgeOrder(part))part.allowances[edge]=quantity(offset)
      const c=sinkDimensions(part,ref,'in')
      assert.equal(formatLength(c[side].finished.mm,'in'),same)
      assert.equal(formatLength(c.left.finished.mm!+c.right.finished.mm!,'in'),total)
      assert.equal(ref.x.input,'71 9/16');assert.equal(ref.y.input,'')
    }
  }
  ref.basis='countertop'
  part.allowances.right=quantity('1')
  const legacy=parseBackup(JSON.stringify(p)).areas[0].shapes[0]
  const c=sinkDimensions(legacy,legacy.references[0],'in')
  assert.equal(formatLength(c.right.finished.mm,'in'),'71 9/16″')
  assert.equal(formatLength(c.right.cabinet.mm,'in'),'70 9/16″')
  assert.ok(sinkChainPoints(ref,part,calculate(part),.5))
})

test('edge allowances survive Wall, backup and OPEN while display ordering follows rotation',()=>{
  const project=newProject(), part=kitchen('Island','81 1/2','30')
  project.areas[0].shapes=[part]
  part.allowances.left=quantity('1')
  assert.equal(finishedFormula(part,'back','in'),'1 + 81 1/2')
  part.mirrored=true
  assert.equal(finishedFormula(part,'back','in'),'81 1/2 + 1')
  setEdgeOpen(part,'left',false,project)
  assert.equal(part.allowances.left.input,'0')
  const saved=parseBackup(JSON.stringify(project)).areas[0].shapes[0]
  setEdgeOpen(saved,'left',true,project)
  assert.deepEqual(saved.allowances.left,quantity('1'))
  assert.equal(formatLength(72.5625*25.4,'in'),'72 9/16″')
  assert.equal(formatLength(72.53125*25.4,'in'),'72.53125″')
})

test('eight-part field drawing paginates complete parts, with two sinks, a narrow return and an unresolved outline',()=>{
  const project=newProject()
  project.name='Anonymous field regression'
  const a=kitchen('Kitchen 1','143 13/16','24')
  a.allowances.right=quantity('1')
  const ref=newReference('sink','in','cabinet')
  ref.x=quantity('71 1/2');a.references=[ref]
  const island=kitchen('Island','116 1/4','40')
  for(const edge of edgeOrder(island))island.allowances[edge]=quantity('3/4')
  for(const side of ['left','right'] as const){
    const r=newReference('sink','in','cabinet');r.fromX=side;r.x=quantity(side==='left'?'31':'24')
    island.references.push(r)
  }
  const l=kitchen('Kitchen 3','82','68','l');l.allowances.innerY=quantity('1.5')
  const tall=kitchen('Return','60','5');tall.rotation=90
  project.areas[0].shapes=[a,island,l,tall,kitchen('Vanity 1','32','21'),kitchen('Vanity 2','41','21'),kitchen('Shelf','36','8'),kitchen('Pending','38','')]
  const files='artifacts/site-measure'
  fs.mkdirSync(files,{recursive:true})
  const snapshot=exportSnapshot(project)
  const pdf=createPdf(snapshot,fs.readFileSync('public/fonts/site-measure/NotoSansTC-Regular.ttf'))
  fs.writeFileSync(files+'/issue19-eight-parts.pdf',pdf)
  assert.equal((Buffer.from(pdf).toString('latin1').match(/\/Type \/Page\b/g)??[]).length,8)
  const dxf=createDxf(snapshot)
  assert.deepEqual(dxf.excluded,['Kitchen / Pending'])
  const tops=new DxfParser().parseSync(dxf.text)!.entities.filter(e=>e.layer==='SM_TOP') as unknown as {vertices:{x:number;y:number}[]}[]
  const [first,second]=tops[2].vertices.slice(4)
  assert.equal(formatLength(Math.hypot(second.x-first.x,second.y-first.y),'in'),'25 1/2″')
})
