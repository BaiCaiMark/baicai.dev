import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import DxfParser from 'dxf-parser'
import { sampleProject, newShape } from '../../app/tools/site-measure/core/model'
import { exportSnapshot } from '../../app/tools/site-measure/core/geometry'
import { createDxf, dxfText } from '../../app/tools/site-measure/core/export-dxf'
import { createPdf } from '../../app/tools/site-measure/core/export-pdf'

test('independent DXF parser finds exact closed editable mm geometry and layers',()=>{
  const shot=exportSnapshot(sampleProject()),result=createDxf(shot),parsed=new DxfParser().parseSync(result.text)!
  assert.equal(parsed.header.$INSUNITS,4)
  const tops=parsed.entities.filter(e=>e.type==='LWPOLYLINE'&&e.layer==='SM_TOP') as unknown as {vertices:{x:number;y:number}[];shape:boolean}[]
  assert.equal(tops.length,4);assert.ok(tops.every(e=>e.shape))
  const vanity=tops[2],xs=vanity.vertices.map(v=>v.x),ys=vanity.vertices.map(v=>v.y)
  assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-1524)<1e-6)
  assert.ok(Math.abs(Math.max(...ys)-Math.min(...ys)-571.5)<1e-6)
  assert.ok(parsed.entities.some(e=>e.type==='LINE'&&e.layer==='SM_REFERENCE'))
  assert.ok(parsed.entities.some(e=>e.type==='TEXT'&&e.layer==='SM_NOTES'))
  assert.equal(parsed.entities.some(e=>e.type==='CIRCLE'),false)
})
test('incomplete shapes are explicitly excluded from DXF',()=>{
  const p=sampleProject();p.areas[0].shapes.push(newShape('l','in'))
  const result=createDxf(exportSnapshot(p))
  assert.equal(result.included.length,4);assert.equal(result.excluded.length,1);assert.match(result.text,/EXCLUDED incomplete/)
})
test('DXF note text cannot inject entities or formatting',()=>{
  assert.equal(dxfText('水槽\\P%\n0\nLINE').includes('\n'),false)
  assert.match(dxfText('水槽'),/\\U\+/);assert.match(dxfText('%'),/0025/)
})
test('PDF has embedded Unicode font, vector pages and shared numeric composition',()=>{
  const p=sampleProject(),font=fs.readFileSync('public/fonts/site-measure/NotoSansTC-Regular.ttf')
  const pdf=createPdf(exportSnapshot(p),new Uint8Array(font))
  assert.equal(new TextDecoder().decode(pdf.subarray(0,5)),'%PDF-')
  fs.mkdirSync('artifacts/site-measure',{recursive:true})
  fs.writeFileSync('artifacts/site-measure/sample.pdf',pdf)
  fs.writeFileSync('artifacts/site-measure/sample.dxf',createDxf(exportSnapshot(p)).text)
  fs.writeFileSync('artifacts/site-measure/sample.site-measure.json',JSON.stringify(p,null,2))
  fs.writeFileSync('artifacts/site-measure/sample-rows.json',JSON.stringify(exportSnapshot(p).entries.map(e=>e.rows)))
  assert.ok(pdf.length>10000)
})
test('unsupported PDF glyphs fail visibly instead of losing notes',()=>{
  const p=sampleProject();p.name='Unsupported 🪨'
  assert.throws(()=>createPdf(exportSnapshot(p),new Uint8Array(fs.readFileSync('public/fonts/site-measure/NotoSansTC-Regular.ttf'))),/不支援/)
})
