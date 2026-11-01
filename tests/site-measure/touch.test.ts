import test from 'node:test'
import assert from 'node:assert/strict'
import { insertFraction, nearestEdge, type ScreenEdge } from '../../app/tools/site-measure/components/touch'
const segment=(edge:ScreenEdge['edge'],ax:number,ay:number,bx:number,by:number,partId='L'):ScreenEdge=>({partId,edge,a:{x:ax,y:ay},b:{x:bx,y:by}})
test('44 CSS pixel edge corridor includes the boundary and excludes distant taps',()=>{
  const edges=[segment('back',0,0,200,0)]
  for(const y of [-22,0,22])assert.equal(nearestEdge({x:100,y},edges)?.edge,'back')
  assert.equal(nearestEdge({x:100,y:22.01},edges),null)
})
test('inside corner chooses distance rather than SVG paint order; exact vertex ties are stable',()=>{
  const edges=[segment('innerX',200,100,60,100),segment('innerY',60,100,60,200)]
  assert.equal(nearestEdge({x:75,y:103},edges)?.edge,'innerX')
  assert.equal(nearestEdge({x:63,y:115},edges)?.edge,'innerY')
  assert.equal(nearestEdge({x:60,y:100},edges)?.edge,'innerX')
})
test('short edges and neighboring Parts compete by actual screen distance',()=>{
  const edges=[segment('right',10,0,10,12,'A'),segment('left',25,0,25,12,'B')]
  assert.equal(nearestEdge({x:12,y:6},edges)?.partId,'A')
  assert.equal(nearestEdge({x:22,y:6},edges)?.partId,'B')
})
test('screen-distance selection survives scaling, rotation and mirror transforms',()=>{
  for(const scale of [.25,1,4])for(const turn of [0,1,2,3])for(const mirror of [-1,1]){
    const transform=(x:number,y:number)=>{x=x*mirror*scale+400;y=y*scale+300;for(let i=0;i<turn;i++)[x,y]=[-y,x];return{x,y}}
    const e={partId:'A',edge:'back' as const,a:transform(0,0),b:transform(200,0)}
    const mid={x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2},dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,length=Math.hypot(dx,dy)
    assert.equal(nearestEdge({x:mid.x-dy/length*21,y:mid.y+dx/length*21},[e])?.edge,'back')
    assert.equal(nearestEdge({x:mid.x-dy/length*23,y:mid.y+dx/length*23},[e]),null)
  }
})
test('fraction shortcut inserts a token at the caret, replacing only the selected text',()=>{
  for(const fraction of ['1/2','1/4','3/4','1/8','1/16']){
    assert.deepEqual(insertFraction('25',2,2,fraction),{text:'25 '+fraction,caret:3+fraction.length})
    assert.deepEqual(insertFraction('',0,0,fraction),{text:fraction,caret:fraction.length})
    assert.deepEqual(insertFraction('25 1/4 + 12',3,6,fraction),{text:'25 '+fraction+' + 12',caret:3+fraction.length})
  }
  assert.deepEqual(insertFraction('25 + 12',5,5,'1/2'),{text:'25 + 1/2 12',caret:9})
})

