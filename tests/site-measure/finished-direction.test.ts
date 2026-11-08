import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCanvasOpenDefaults, newProject, newShape, newReference, quantity, type Edge } from '../../app/tools/site-measure/core/model'
import { calculate, measurementRows, referenceGeometry } from '../../app/tools/site-measure/core/geometry'
import { dimensionTerms, finishedEdgeReading, finishedFormula } from '../../app/tools/site-measure/core/worksheet'
import { formatLength } from '../../app/tools/site-measure/core/units'

test('rectangle finished direction appears immediately even before the other axis is measured',()=>{
  const project=newProject(),shape=newShape('rectangle','in')
  applyCanvasOpenDefaults(shape,project)
  shape.dimensions.width=quantity('60')
  assert.equal(formatLength(finishedEdgeReading(shape,'back'),'in'),'60″')
  assert.equal(finishedEdgeReading(shape,'right'),null)
  shape.allowances.right=quantity('1','in','allowance')
  assert.equal(formatLength(finishedEdgeReading(shape,'back'),'in'),'61″')
  assert.equal(formatLength(finishedEdgeReading(shape,'front'),'in'),'61″')
  assert.equal(calculate(shape).top,null)
  shape.dimensions.height=quantity('21')
  assert.equal(formatLength(finishedEdgeReading(shape,'right'),'in'),'22.5″')
  assert.equal(formatLength(finishedEdgeReading(shape,'left'),'in'),'22.5″')
  assert.ok(calculate(shape).top)
  assert.deepEqual(dimensionTerms(shape,'back'),{parameter:'width',start:'left',end:'right',endSign:1})
  assert.deepEqual(dimensionTerms(shape,'right'),{parameter:'height',start:'back',end:'front',endSign:1})
})

test('L independent directional formulas agree with true finished polygon under offsets',()=>{
  const p=newProject(),s=newShape('l','in')
  applyCanvasOpenDefaults(s,p)
  s.dimensions.width=quantity('60')
  s.dimensions.height=quantity('39')
  s.dimensions.legX=quantity('24')
  s.dimensions.legY=quantity('24')
  s.allowances.right=quantity('1')
  s.allowances.left=quantity('3/4')
  s.allowances.back=quantity('1/8')
  s.allowances.innerY=quantity('1/4')
  const g=calculate(s)
  assert.ok(g.top)
  const edges:Edge[]=['back','right','innerX','innerY','front','left']
  for(const edge of edges){
    const n=finishedEdgeReading(s,edge)
    assert.ok(n!==null,edge)
    const i=edges.indexOf(edge),a=g.top![i],b=g.top![(i+1)%edges.length]
    assert.ok(Math.abs(n!-Math.hypot(b.x-a.x,b.y-a.y))<1e-6,edge)
  }
  assert.deepEqual(dimensionTerms(s,'front'),{parameter:'legY',start:'left',end:'innerY',endSign:-1})
  assert.equal(dimensionTerms(s,'innerX'),null)
})

test('two independent sink centers retain X-only left/right readings without demanding Y',()=>{
  const project=newProject(),s=newShape('rectangle','in')
  applyCanvasOpenDefaults(s,project)
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  const left=newReference('sink','in');left.fromX='left';left.x=quantity('15')
  const right=newReference('sink','in');right.fromX='right';right.x=quantity('15')
  s.references.push(left,right)
  const rows=measurementRows(s,'in')
  const first=rows.find(r=>r.label.startsWith('Sink 1 Center'))
  const second=rows.find(r=>r.label.startsWith('Sink 2 Center'))
  assert.ok(first?.text.includes('X from left 15'))
  assert.ok(second?.text.includes('X from right 15'))
  assert.ok(!first?.text.includes('Y '))
  assert.ok(!second?.text.includes('Y '))
  assert.equal(left.y.input,'')
  assert.equal(right.y.input,'')
  for(const ref of s.references){
    const marker=referenceGeometry(ref,s,calculate(s))
    assert.equal(marker.point,null)
    assert.ok(marker.lines.length>0)
    assert.ok(!marker.warnings.some(x=>x.includes('Y unknown')))
  }
})

test('visual dimension arithmetic uses real input, hides zero offsets and never invents the opposite edge',()=>{
  const p=newProject(),s=newShape('rectangle','in')
  applyCanvasOpenDefaults(s,p)
  s.dimensions.width=quantity('60');s.dimensions.height=quantity('21')
  s.allowances.right=quantity('1','in','allowance')
  assert.equal(finishedFormula(s,'back','in'),'60 + 1')
  assert.equal(finishedFormula(s,'right','in'),'21 + 1.5')
  assert.equal(finishedFormula(s,'front','in'),null)
  assert.equal(finishedFormula(s,'left','in'),null)
  s.allowances.right=quantity('0','in','allowance')
  assert.equal(finishedFormula(s,'back','in'),null)
  s.dimensions.width=quantity('')
  assert.equal(finishedFormula(s,'back','in'),null)
  assert.equal(finishedFormula(s,'right','in'),'21 + 1.5')
})
