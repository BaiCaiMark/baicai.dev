import test from 'node:test'
import assert from 'node:assert/strict'
import { dimensionLabelLayout } from '../../app/tools/site-measure/components/dimension-label'
import { worksheetPart } from '../../app/tools/site-measure/core/worksheet'
import { worksheetSample, edgeOrder } from '../../app/tools/site-measure/core/model'

const p=(x:number,y:number)=>({x,y})

test('dimension annotations follow the segment while text never turns upside-down',()=>{
  assert.equal(dimensionLabelLayout(p(0,0),p(200,0),false).angle,0)
  assert.equal(dimensionLabelLayout(p(200,0),p(0,0),false).angle,0)
  assert.equal(dimensionLabelLayout(p(0,0),p(0,200),false).angle,-90)
  assert.equal(dimensionLabelLayout(p(0,200),p(0,0),false).angle,-90)
  assert.equal(dimensionLabelLayout(p(0,0),p(200,200),false).angle,45)
  assert.equal(dimensionLabelLayout(p(200,200),p(0,0),false).angle,45)
  assert.equal(dimensionLabelLayout(p(0,0),p(200,-200),false).angle,-45)
  assert.equal(dimensionLabelLayout(p(200,-200),p(0,0),false).angle,-45)
})

test('every L and rectangular edge stays legible at all supported rotation/mirror settings',()=>{
  for (const shape of worksheetSample().areas[0].shapes) {
    for (const rotation of [0,90,180,270] as const) for (const mirrored of [false,true]) {
      const s={...shape,rotation,mirrored}
      const {points}=worksheetPart(s)
      for (const [index] of edgeOrder(s).entries()) {
        const label=dimensionLabelLayout(points[index],points[(index+1)%points.length],true)
        assert.ok(label.angle>=-90&&label.angle<90,JSON.stringify({rotation,mirrored,index,label}))
        assert.ok(Number.isFinite(label.angle))
      }
    }
  }
})

test('short edges use a leader instead of covering the adjacent edge',()=>{
  assert.equal(dimensionLabelLayout(p(0,0),p(40,0),false).lift,46)
  assert.equal(dimensionLabelLayout(p(0,0),p(40,0),true).lift,60)
  assert.equal(dimensionLabelLayout(p(0,0),p(220,0),true).lift,0)
  assert.deepEqual(
    (({width,height})=>({width,height}))(dimensionLabelLayout(p(0,0),p(40,0),true)),
    {width:144,height:48}
  )
})
