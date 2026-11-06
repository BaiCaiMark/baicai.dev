import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCanvasOpenDefaults, newProject, newShape, quantity, type Edge } from '../../app/tools/site-measure/core/model'
import { calculate } from '../../app/tools/site-measure/core/geometry'
import { dimensionTerms, finishedEdgeReading } from '../../app/tools/site-measure/core/worksheet'
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
