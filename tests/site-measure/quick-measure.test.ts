import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRectangleQuickDefaults, newProject, newShape, quantity, setTreatment, treatmentOf, value, projectSchema } from '../../app/tools/site-measure/core/model'
import { bounds, calculate, measurementRows } from '../../app/tools/site-measure/core/geometry'
import { formatLength } from '../../app/tools/site-measure/core/units'

test('one common vanity rectangle can be measured with two lengths and a single polish action',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  applyRectangleQuickDefaults(s,p)
  assert.deepEqual(['back','right','front','left'].map(e=>Number((value(s.allowances[e as 'back'|'right'|'front'|'left'])!/25.4).toFixed(4))),[0,0,1.5,0])
  assert.equal(treatmentOf(s,'front'),'polish')
  assert.equal(treatmentOf(s,'left'),'no-polish')
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  setTreatment(s,'right','polish',p)
  assert.equal(value(s.allowances.right),25.4)
  const g=calculate(s)
  assert.ok(g.top)
  assert.equal(formatLength(bounds(g.top!).width,'in'),'61″')
  assert.equal(formatLength(bounds(g.top!).height,'in'),'22.5″')
  const rows=measurementRows(s,'in',g)
  assert.equal(rows.find(r=>r.label.startsWith('Finished length'))?.text,'60″ + 1″ = 61″')
  assert.equal(rows.find(r=>r.label.startsWith('Finished depth'))?.text,'21″ + 1.5″ = 22.5″')
  assert.ok(rows.find(r=>r.label==='Treatment Right end')?.text.includes('Polish'))
})
test('stove adjacent polish edges allow zero and one eighth overhang without invented values',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  applyRectangleQuickDefaults(s,p)
  setTreatment(s,'right','polish',p)
  s.allowances.right=quantity('0','in','allowance')
  setTreatment(s,'right','no-polish',p)
  assert.equal(s.allowances.right.input,'0') // manual value is protected
  setTreatment(s,'right','polish',p)
  assert.equal(s.allowances.right.input,'0')
  s.allowances.right=quantity('1/8','in','allowance')
  assert.equal(value(s.allowances.right),25.4/8)
})
test('miter never silently adds 2 or 3 cm and must be explicitly dimensioned',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  applyRectangleQuickDefaults(s,p)
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  setTreatment(s,'right','miter',p)
  assert.equal(treatmentOf(s,'right'),'miter')
  assert.equal(s.allowances.right.input,'')
  assert.equal(calculate(s).top,null)
  s.allowances.right=quantity('0','in','allowance')
  assert.ok(calculate(s).top)
  assert.ok(measurementRows(s,'in').some(r=>r.text.includes('joining compensation not calculated')))
})
test('old schema v2 backups retain unknown edge treatments and original allowances',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  p.areas[0].shapes.push(s)
  const roundtrip=projectSchema.parse(JSON.parse(JSON.stringify(p)))
  assert.equal(roundtrip.areas[0].shapes[0].treatments,undefined)
  assert.equal(roundtrip.areas[0].shapes[0].allowances.left.input,'')
  applyRectangleQuickDefaults(s,p)
  const migrated=projectSchema.parse(JSON.parse(JSON.stringify(p)))
  assert.equal(migrated.areas[0].shapes[0].treatments?.front,'polish')
  assert.equal(migrated.areas[0].shapes[0].allowances.back.input,'0')
})
test('custom measurements are never overwritten by treatment preset switching',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  applyRectangleQuickDefaults(s,p)
  s.allowances.right=quantity('1/8','in','allowance')
  setTreatment(s,'right','polish',p)
  assert.equal(s.allowances.right.input,'1/8')
  setTreatment(s,'right','no-polish',p)
  assert.equal(s.allowances.right.input,'1/8')
})

test('treatment record appears in PDF rows even for direct finished measurements',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  s.basis='finished'
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  setTreatment(s,'front','polish',p)
  assert.equal(measurementRows(s,'in').find(row=>row.label==='Treatment Front edge')?.text,'Polish')
})
