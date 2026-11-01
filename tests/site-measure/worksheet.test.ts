import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import 'fake-indexeddb/auto'
import { edgeOrder, parseBackup, projectSchema, quantity, sampleProject, worksheetSample } from '../../app/tools/site-measure/core/model'
import { calculate, exportSnapshot } from '../../app/tools/site-measure/core/geometry'
import { edgeControl, edgeLength, fieldMeasurementText, parseFieldMeasurement, worksheetLayout } from '../../app/tools/site-measure/core/worksheet'
import { ProjectStore } from '../../app/tools/site-measure/core/storage'
import { createDxf } from '../../app/tools/site-measure/core/export-dxf'
import { createPdf } from '../../app/tools/site-measure/core/export-pdf'

test('every rectangle edge maps to its actual length or depth',()=>{
  const s=sampleProject().areas[1].shapes[0]
  assert.deepEqual(edgeOrder(s).map(e=>edgeControl(s,e).parameter),['width','height','width','height'])
})
test('L actual edges map to 4 independent and 2 derived dimensions',()=>{
  const s=sampleProject().areas[0].shapes[1]
  assert.deepEqual(edgeOrder(s).map(e=>edgeControl(s,e).parameter),['width','legX',null,null,'legY','height'])
  assert.ok(Math.abs(edgeLength(s,'innerX')!-70.5*25.4)<1e-6)
  assert.ok(Math.abs(edgeLength(s,'innerY')!-46.5*25.4)<1e-6)
  for(const rotation of [0,90,180,270] as const)for(const mirrored of [false,true])assert.equal(edgeControl({...s,rotation,mirrored},'right').parameter,'legX')
})
test('independent summed field reading is not a geometry constraint',()=>{
  const p=worksheetSample(),s=p.areas[0].shapes[0],before=calculate(s).top
  const r=s.fieldRecords.find(r=>r.kind==='measurement')!
  if(r.kind!=='measurement')throw Error()
  assert.ok(Math.abs(parseFieldMeasurement(r.measurement).total!-38.25*25.4)<1e-6)
  r.measurement=quantity('200 + 1 9/16')
  assert.deepEqual(calculate(s).top,before)
  assert.match(fieldMeasurementText(r.measurement,'in'),/201.5625/)
})
test('bad field expressions stay unknown without changing geometry',()=>{
  for(const input of ['','12 +','12 - 3','1 + -2','1/0','1e3','12 + window.alert(1)'])assert.equal(parseFieldMeasurement(quantity(input)).total,null)
})
test('multi-part layout uses columns and saved visual placement never changes mm geometry',()=>{
  const p=worksheetSample(),s=p.areas[0].shapes
  const layout=worksheetLayout(s)
  assert.equal(layout[0].y,layout[1].y);assert.notEqual(layout[0].x,layout[1].x)
  const before=calculate(s[0]).top
  s[0].layout={x:900,y:450}
  assert.equal(worksheetLayout(s)[0].x,900);assert.deepEqual(calculate(s[0]).top,before)
})
test('real v0.1 backup migrates losslessly without mutating source',()=>{
  const raw=fs.readFileSync('tests/site-measure/fixtures/v01-project.json','utf8'),old=JSON.parse(raw)
  const migrated=parseBackup(raw)
  assert.equal(migrated.schemaVersion,2);assert.equal(old.schemaVersion,1)
  migrated.areas.forEach((area,i)=>area.shapes.forEach((shape,j)=>{
    assert.deepEqual(shape.dimensions,old.areas[i].shapes[j].dimensions)
    assert.deepEqual(shape.allowances,old.areas[i].shapes[j].allowances)
    assert.deepEqual(shape.references,old.areas[i].shapes[j].references)
    assert.deepEqual(shape.fieldRecords,[])
  }))
  assert.deepEqual(parseBackup(JSON.stringify(migrated)),migrated)
})
test('existing IndexedDB v1 record opens and upgrades only on an atomic save',async()=>{
  const old=JSON.parse(fs.readFileSync('tests/site-measure/fixtures/v01-project.json','utf8'))
  const db=new ProjectStore('preview2-'+crypto.randomUUID())
  try{
    await db.projects.put({id:old.id,project:old,version:4,updatedAt:old.updatedAt})
    const row=await db.load(old.id);assert.equal(row.project.schemaVersion,2)
    assert.equal((await db.projects.get(old.id))!.project.schemaVersion,1)
    await db.save(row.project,4)
    assert.equal((await db.projects.get(old.id))!.project.schemaVersion,2)
    assert.equal((await db.recovery.get(old.id))!.project.schemaVersion,1)
  }finally{await db.delete()}
})
test('reference readings and edge notes survive PDF/DXF model and project round trip',()=>{
  const p=worksheetSample(),copy=projectSchema.parse(JSON.parse(JSON.stringify(p))),shot=exportSnapshot(copy)
  assert.match(shot.entries[0].rows.map(r=>r.text).join(),/38\.25/)
  assert.match(shot.entries[0].rows.map(r=>r.text).join(),/Wall may be curved/)
  assert.match(createDxf(shot).text,/Cabinet check/)
  const font=new Uint8Array(fs.readFileSync('public/fonts/site-measure/NotoSansTC-Regular.ttf'))
  const pdf=createPdf(shot,font)
  fs.writeFileSync('artifacts/site-measure/preview2-sample.pdf',pdf)
  fs.writeFileSync('artifacts/site-measure/preview2-sample.dxf',createDxf(shot).text)
})
test('record ids are validated and future schemas cannot discard fields',()=>{
  const p=worksheetSample(),s=p.areas[0].shapes[0]
  s.fieldRecords[0].id=s.id
  assert.throws(()=>projectSchema.parse(p))
  assert.throws(()=>parseBackup(JSON.stringify({...worksheetSample(),schemaVersion:99})))
})
