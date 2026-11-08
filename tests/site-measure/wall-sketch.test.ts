import test from 'node:test'
import assert from 'node:assert/strict'
import { newProject, parseBackup, projectSchema, sampleProject } from '../../app/tools/site-measure/core/model'
import { appendWallStroke, makeWallSketch, WALL_MAX_POINTS, wallPath } from '../../app/tools/site-measure/core/wall-sketch'
import { exportSnapshot } from '../../app/tools/site-measure/core/geometry'

test('P5.2 schematic wall is independent of measured parts, PDF rows and CNC geometry',()=>{
  const p=sampleProject()
  const before=exportSnapshot(p)
  const wall=makeWallSketch('wall-01','Wall sketch 1',[{x:50,y:20},{x:60,y:80},{x:85,y:90},{x:110,y:100}])
  p.wallSketches=[wall]
  assert.equal(wall.kind,'schematic')
  assert.deepEqual(parseBackup(JSON.stringify(p)).wallSketches,[wall])
  const after=exportSnapshot(p)
  assert.deepEqual(after.entries.map(e=>e.geometry),before.entries.map(e=>e.geometry))
  assert.deepEqual(after.entries.map(e=>e.rows),before.entries.map(e=>e.rows))
  assert.deepEqual(after.entries.map(e=>e.shape),before.entries.map(e=>e.shape))
})
test('invalid wall sketches and tampered backups are rejected',()=>{
  const p=newProject(),w=makeWallSketch('wall','Wall 1',[{x:1,y:1},{x:30,y:45}])
  assert.equal(projectSchema.safeParse({...p,wallSketches:[w,w]}).success,false)
  assert.equal(projectSchema.safeParse({...p,wallSketches:[{...w,points:[{x:1,y:1}]}]}).success,false)
  assert.equal(projectSchema.safeParse({...p,wallSketches:[{...w,points:[{x:1,y:1},{x:Infinity,y:1}]}]}).success,false)
  assert.equal(projectSchema.safeParse({...p,wallSketches:[{...w,kind:'measured'}]}).success,false)
  assert.throws(()=>makeWallSketch('wall','A',[]))
  assert.throws(()=>makeWallSketch('wall','A',[{x:0,y:0},{x:0,y:0}]))
  const legacy=newProject()
  delete legacy.wallSketches
  assert.equal(parseBackup(JSON.stringify(legacy)).wallSketches,undefined)
})
test('field pen stroke decimates duplicates, caps length and keeps every vertex finite',()=>{
  let points=appendWallStroke([],[{x:50,y:50},{x:50.1,y:50.1},{x:63,y:54}])
  assert.equal(points.length,2)
  points=appendWallStroke(points,Array.from({length:WALL_MAX_POINTS+10},(_,i)=>({x:70+i*4,y:80+i*2})))
  assert.equal(points.length,WALL_MAX_POINTS)
  assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
  assert.ok(wallPath(points).startsWith('M'))
  assert.equal(wallPath([]),'')
})
