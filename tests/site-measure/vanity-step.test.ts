import test from 'node:test'
import assert from 'node:assert/strict'
import { calculate, bounds, transformPoint } from '../../app/tools/site-measure/core/geometry'
import { newProject, newVanityStep, edgeOrder, quantity, projectSchema, setTreatment, value } from '../../app/tools/site-measure/core/model'
import { displayOutline, worksheetPart } from '../../app/tools/site-measure/core/worksheet'
import { exportSnapshot } from '../../app/tools/site-measure/core/geometry'

function fill(s: ReturnType<typeof newVanityStep>) {
  s.dimensions.width = quantity('70')
  s.dimensions.height = quantity('22.5')
  s.dimensions.legX = quantity('7')
  s.dimensions.legY = quantity('40')
}

test('DXF step vanity mirror presets are visibly accurate guides but never invent measurements',()=>{
  const p=newProject()
  for(const side of ['left','right'] as const){
    const shape=newVanityStep(p,side)
    assert.equal(shape.template,'l')
    assert.equal(shape.profile,'vanity-step')
    assert.equal(shape.mirrored,side==='right')
    assert.equal(shape.basis,'cabinet')
    assert.equal(shape.references.length,0) // Source DXF contains no sink cutout/reference
    assert.equal(shape.treatments,undefined) // Source contour does not specify polished edges
    assert.ok(edgeOrder(shape).every(e=>shape.allowances[e].input==='0'&&shape.allowances[e].status==='unconfirmed'))
    assert.ok(calculate(shape).top===null)
    const outline=displayOutline(shape)
    assert.equal(outline.guide,true)
    assert.equal(bounds(outline.points).width,70*25.4)
    assert.equal(bounds(outline.points).height,22.5*25.4)
    const transformed=outline.points.map(pt=>transformPoint(pt,shape))
    const bb=bounds(transformed)
    // At the deepest front edge, the left preset occupies x=0..40, right preset x=30..70.
    const bottom=transformed.filter(pt=>Math.abs(pt.y-bb.y-bb.height)<1e-6)
    assert.equal(Math.min(...bottom.map(pt=>pt.x))-bb.x,(side==='left'?0:30)*25.4)
    assert.equal(Math.max(...bottom.map(pt=>pt.x))-bb.x,(side==='left'?40:70)*25.4)
    assert.ok(worksheetPart(shape).guide)
    p.areas[0].shapes=[shape]
    const json=projectSchema.parse(JSON.parse(JSON.stringify(p)))
    assert.equal(json.areas[0].shapes[0].profile,'vanity-step')
    assert.equal(exportSnapshot(json).entries[0].geometry.top,null)
  }
})

test('measured step geometry has exact 70 × 22.5 with deep 40 and shallow 7, both hands',()=>{
  const p=newProject()
  for(const side of ['left','right'] as const){
    const shape=newVanityStep(p,side)
    fill(shape)
    const g=calculate(shape)
    assert.deepEqual(g.errors,[])
    assert.ok(g.top)
    assert.equal(g.top.length,6)
    const bb=bounds(g.top)
    assert.ok(Math.abs(bb.width-70*25.4)<1e-7)
    assert.ok(Math.abs(bb.height-22.5*25.4)<1e-7)
    const transformed=g.top.map(q=>transformPoint(q,shape))
    const tbox=bounds(transformed)
    const deep=transformed.filter(q=>Math.abs(q.y-tbox.y-tbox.height)<1e-7)
    assert.ok(Math.abs((Math.max(...deep.map(q=>q.x))-Math.min(...deep.map(q=>q.x)))-40*25.4)<1e-7)
    assert.equal(displayOutline(shape).guide,false)
  }
})

test('stepped front-facing horizontal recess uses front default and custom 1/8 is preserved',()=>{
  const p=newProject(),s=newVanityStep(p,'right')
  setTreatment(s,'innerX','polish',p)
  assert.equal(value(s.allowances.innerX),value(p.defaults.front))
  setTreatment(s,'right','polish',p)
  assert.equal(value(s.allowances.right),value(p.defaults.end))
  s.allowances.innerX=quantity('1/8','in','allowance')
  setTreatment(s,'innerX','no-polish',p)
  assert.equal(s.allowances.innerX.input,'1/8')
})
