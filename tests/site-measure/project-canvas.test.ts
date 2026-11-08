import test from 'node:test'
import assert from 'node:assert/strict'
import { adoptSharedCanvas, projectCanvasItems } from '../../app/tools/site-measure/core/project-canvas'
import { worksheetSample, parseBackup, projectSchema, newProject, newShape } from '../../app/tools/site-measure/core/model'
import { worksheetLayout } from '../../app/tools/site-measure/core/worksheet'
import { exportSnapshot } from '../../app/tools/site-measure/core/geometry'

test('v2 legacy Rooms migrate to one shared canvas without mutating source or measurements', () => {
  const old = worksheetSample()
  const original = JSON.stringify(old)
  const before = exportSnapshot(old)
  const firstRoomLayout = worksheetLayout(old.areas[0].shapes)
  const upgraded = adoptSharedCanvas(old)
  assert.equal(JSON.stringify(old), original)
  assert.notEqual(upgraded, old)
  assert.equal(upgraded.canvasLayout, 'shared-v1')
  assert.deepEqual(projectCanvasItems(upgraded.areas).filter(item => item.areaId === upgraded.areas[0].id).map(item => ({x:item.x,y:item.y})), firstRoomLayout.map(item => ({x:item.x,y:item.y})))
  assert.equal(projectCanvasItems(upgraded.areas).length, 5)
  let previousBottom = -Infinity
  for (const area of upgraded.areas) {
    const items = projectCanvasItems([area])
    if (!items.length) continue
    const top = Math.min(...items.map(item => item.y))
    if (previousBottom > -Infinity) assert.ok(top >= previousBottom + 239, 'Room groups must not overlap after migration')
    previousBottom = Math.max(...items.map(item => item.y + item.height))
  }
  const after = exportSnapshot(upgraded)
  assert.deepEqual(after.entries.map(e => ({id:e.shape.id,rows:e.rows,geometry:e.geometry})), before.entries.map(e => ({id:e.shape.id,rows:e.rows,geometry:e.geometry})))
  assert.doesNotThrow(() => projectSchema.parse(upgraded))
  assert.deepEqual(parseBackup(JSON.stringify(upgraded)), upgraded)
  assert.equal(adoptSharedCanvas(upgraded), upgraded, 'reopening is idempotent')
})
test('a new Room adds Parts to the same project-wide canvas rather than a separate page', () => {
  const p = adoptSharedCanvas(newProject())
  const bedroom = {id:crypto.randomUUID(),name:'Bathroom',notes:'',shapes:[newShape('rectangle','in')]}
  p.areas.push(bedroom)
  const part = bedroom.shapes[0]
  const items = projectCanvasItems(p.areas)
  assert.equal(items.length, 1)
  assert.equal(items[0].areaId, bedroom.id)
  part.layout = {x:500,y:720}
  assert.deepEqual(projectCanvasItems(p.areas)[0].shape.layout, {x:500,y:720})
  assert.equal(adoptSharedCanvas(p), p)
})
