import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import 'fake-indexeddb/auto'
import DxfParser from 'dxf-parser'
import { duplicateShape, edgeOrder, parseBackup, projectSchema, worksheetSample } from '../../app/tools/site-measure/core/model'
import { calculate, exportSnapshot } from '../../app/tools/site-measure/core/geometry'
import { edgeLength, WORKSHEET_SCALE, worksheetLayout, worksheetPart } from '../../app/tools/site-measure/core/worksheet'
import { historyReducer, initialHistory } from '../../app/tools/site-measure/core/history'
import { ProjectStore } from '../../app/tools/site-measure/core/storage'
import { createDxf } from '../../app/tools/site-measure/core/export-dxf'
import { createPdf } from '../../app/tools/site-measure/core/export-pdf'

test('every measured Part shares the same scale through rotation and reflection',()=>{
  for(const shape of worksheetSample().areas[0].shapes)for(const rotation of [0,90,180,270] as const)for(const mirrored of [false,true]){
    const s={...shape,rotation,mirrored},display=worksheetPart(s)
    edgeOrder(s).forEach((edge,i)=>{
      const a=display.points[i],b=display.points[(i+1)%display.points.length]
      assert.ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)/WORKSHEET_SCALE-edgeLength(s,edge)!)<1e-7)
    })
  }
})
test('Preview 2 explicit positions and v0.1 measurements remain unchanged on read',()=>{
  const p=worksheetSample(),before=JSON.stringify(p)
  p.areas[0].shapes[0].layout={x:-120,y:950}
  const legacy=JSON.stringify(p),copy=parseBackup(legacy),layout=worksheetLayout(copy.areas[0].shapes)
  assert.deepEqual({x:layout[0].x,y:layout[0].y},{x:-120,y:950});assert.equal(JSON.stringify(p),legacy)
  const v1=parseBackup(fs.readFileSync('tests/site-measure/fixtures/v01-project.json','utf8'))
  assert.equal(v1.schemaVersion,2);assert.ok(worksheetLayout(v1.areas[0].shapes).every(p=>Number.isFinite(p.x)))
  assert.notEqual(before,legacy)
})
test('duplicate regenerates all identities and owns independent readings and notes',()=>{
  const p=worksheetSample(),s=p.areas[0].shapes[0],before=structuredClone(s)
  s.references=structuredClone(p.areas[1].shapes[0].references)
  s.references.forEach(r=>{r.id=crypto.randomUUID()})
  const source=structuredClone(s),copy=duplicateShape(s,[s.name,s.name+' copy'],{x:310,y:110})
  assert.equal(copy.name,s.name+' copy 2');assert.deepEqual(copy.layout,{x:358,y:158})
  const {id: _id, layout: _layout, name: _name,...measurements}=copy
  void _id;void _layout;void _name
  assert.deepEqual(measurements.dimensions,s.dimensions);assert.deepEqual(calculate(copy),calculate(s))
  assert.notEqual(copy.id,s.id);copy.references.forEach((r,i)=>assert.notEqual(r.id,s.references[i].id));copy.fieldRecords.forEach((r,i)=>assert.notEqual(r.id,s.fieldRecords[i].id))
  copy.dimensions.width.input='1';copy.fieldRecords[0].id='changed'
  assert.deepEqual(s,source);assert.deepEqual(s.dimensions,before.dimensions)
  const fresh=duplicateShape(s,[s.name],{x:310,y:110});p.areas[0].shapes.push(fresh);assert.doesNotThrow(()=>projectSchema.parse(p))
})
test('move changes neither exported native DXF contours nor PDF measurement rows',()=>{
  const p=worksheetSample(),before=exportSnapshot(p),parser=new DxfParser()
  const contours=(text:string)=>parser.parseSync(text)!.entities.filter(e=>e.type==='LWPOLYLINE')
  const original=contours(createDxf(before).text),rows=before.entries.map(e=>e.rows)
  p.areas[0].shapes.forEach((s,i)=>{s.layout={x:900-i*150,y:-200+i*180}})
  const after=exportSnapshot(p)
  assert.deepEqual(contours(createDxf(after).text),original);assert.deepEqual(after.entries.map(e=>e.rows),rows)
  const font=new Uint8Array(fs.readFileSync('public/fonts/site-measure/NotoSansTC-Regular.ttf'))
  fs.writeFileSync('artifacts/site-measure/preview3-layout.pdf',createPdf(after,font))
  fs.writeFileSync('artifacts/site-measure/preview3-layout.dxf',createDxf(after).text)
})
test('move, duplicate and delete form separate reversible history actions',()=>{
  const p=worksheetSample(),original=structuredClone(p.areas[0].shapes)
  let h=historyReducer(initialHistory,{type:'load',project:p})
  h=historyReducer(h,{type:'edit',recipe:p=>{p.areas[0].shapes[0].layout={x:400,y:200}}})
  h=historyReducer(h,{type:'edit',recipe:p=>{p.areas[0].shapes.push(duplicateShape(p.areas[0].shapes[0],[],{x:400,y:200}))}})
  h=historyReducer(h,{type:'edit',recipe:p=>{p.areas[0].shapes.splice(0,1)}})
  for(let i=0;i<3;i++)h=historyReducer(h,{type:'undo'})
  assert.deepEqual(h.present!.areas[0].shapes,original)
  for(let i=0;i<3;i++)h=historyReducer(h,{type:'redo'})
  assert.equal(h.present!.areas[0].shapes.length,3);assert.match(h.present!.areas[0].shapes[2].name,/copy/)
})
test('visual placement and duplicate data survive IndexedDB save/reopen and backup',async()=>{
  const db=new ProjectStore('preview3-'+crypto.randomUUID()),p=worksheetSample()
  p.areas[0].shapes[0].layout={x:-340,y:1200};p.areas[0].shapes.push(duplicateShape(p.areas[0].shapes[0],[],{x:-340,y:1200}))
  try{await db.save(p,null);const saved=await db.load(p.id);assert.deepEqual(saved.project,p);assert.deepEqual(parseBackup(JSON.stringify(saved.project)),p)}finally{await db.delete()}
})
