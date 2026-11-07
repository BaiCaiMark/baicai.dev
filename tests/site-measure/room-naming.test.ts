import test from 'node:test'
import assert from 'node:assert/strict'
import {nextPartNameForArea, newProject, newShape, type Area} from '../../app/tools/site-measure/core/model'

test('fresh Kitchen parts are named Kitchen 1, Kitchen 2 regardless of geometry template',()=>{
  const area=newProject().areas[0]
  assert.equal(nextPartNameForArea(area),'Kitchen 1')
  const a=newShape('rectangle','in');a.name=nextPartNameForArea(area);area.shapes.push(a)
  assert.equal(nextPartNameForArea(area),'Kitchen 2')
  const b=newShape('l','in');b.name=nextPartNameForArea(area);area.shapes.push(b)
  assert.equal(nextPartNameForArea(area),'Kitchen 3')
  assert.deepEqual(area.shapes.map(s=>s.name),['Kitchen 1','Kitchen 2'])
})

test('Bathroom numbering remains local to each area and skips custom names',()=>{
  const kitchen=newProject().areas[0]
  kitchen.shapes.push({...newShape('rectangle','in'),name:'Kitchen 8'})
  const bathroom:Area={id:'area-bath',name:'Bathroom',notes:'',shapes:[]}
  assert.equal(nextPartNameForArea(kitchen),'Kitchen 9')
  assert.equal(nextPartNameForArea(bathroom),'Bathroom 1')
  const first=newShape('rectangle','in');first.name='Bathroom 1';bathroom.shapes.push(first)
  const custom=newShape('rectangle','in');custom.name='Master Vanity';bathroom.shapes.push(custom)
  assert.equal(nextPartNameForArea(bathroom),'Bathroom 2')
  bathroom.shapes.push({...newShape('l','in'),name:'bathroom 7'})
  assert.equal(nextPartNameForArea(bathroom),'Bathroom 8')
  assert.equal(custom.name,'Master Vanity')
})

test('renaming a room only affects future auto-generated part names',()=>{
  const area=newProject().areas[0]
  area.shapes.push({...newShape('rectangle','in'),name:'Kitchen 1'})
  area.name='Ensuite'
  assert.equal(nextPartNameForArea(area),'Ensuite 1')
  assert.equal(area.shapes[0].name,'Kitchen 1')
})
