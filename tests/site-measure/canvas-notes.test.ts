import test from 'node:test'
import assert from 'node:assert/strict'
import { newProject, projectSchema, parseBackup, sampleProject } from '../../app/tools/site-measure/core/model'
import { canvasNoteAt, movedCanvasNote, canvasNoteLines, NOTE_MAX_LINES } from '../../app/tools/site-measure/core/canvas-notes'
import { exportSnapshot } from '../../app/tools/site-measure/core/geometry'

test('P5.1 Canvas Note round-trip preserves untouched v2 and legacy v1 backups', () => {
  const legacy=sampleProject()
  delete legacy.canvasNotes // Emulate a backup written before P5.1.
  assert.equal(legacy.canvasNotes,undefined)
  assert.equal(parseBackup(JSON.stringify(legacy)).canvasNotes,undefined)
  assert.equal(parseBackup(JSON.stringify({...legacy,schemaVersion:1})).canvasNotes,undefined)
  const note=canvasNoteAt('note-001','Wall not straight · check cabinet level',{x:200,y:300})
  const p=newProject()
  p.canvasNotes=[note]
  const after=parseBackup(JSON.stringify(p))
  assert.deepEqual(after.canvasNotes,[note])
  assert.doesNotThrow(()=>projectSchema.parse(p))
  assert.equal(projectSchema.safeParse({...p,canvasNotes:[note,note]}).success,false)
  assert.equal(projectSchema.safeParse({...p,canvasNotes:[{...note,text:''}]}).success,false)
  assert.equal(projectSchema.safeParse({...p,canvasNotes:[{...note,targetX:Infinity}]}).success,false)
  assert.equal(projectSchema.safeParse({...p,canvasNotes:[{...note,x:20000}]}).success,false)
  assert.equal(projectSchema.safeParse({...p,canvasNotes:[{...note,text:'a'.repeat(801)}]}).success,false)
})
test('Canvas Note label move keeps the original target and leaves manufacturing geometry untouched',()=>{
  const p=sampleProject()
  const before=exportSnapshot(p)
  const note=canvasNoteAt('note-001','Verify backsplash',{x:480,y:190})
  const changed=movedCanvasNote(note,note.x+85,note.y-20)
  assert.equal(changed.targetX,note.targetX)
  assert.equal(changed.targetY,note.targetY)
  assert.deepEqual(note,{...changed,x:note.x,y:note.y})
  p.canvasNotes=[changed]
  const after=exportSnapshot(p)
  assert.deepEqual(after.entries.map(e=>e.geometry),before.entries.map(e=>e.geometry))
  assert.deepEqual(after.entries.map(e=>e.rows),before.entries.map(e=>e.rows))
  assert.deepEqual(after.entries.map(e=>e.shape.dimensions),before.entries.map(e=>e.shape.dimensions))
  assert.equal(after.project.canvasNotes?.[0].text,'Verify backsplash')
})
test('notes do not overflow the visible card; full text remains in storage',()=>{
  const raw='Unusually long field note describing an irregular wall that must be checked before cutting.\n現場有不平整牆面，需要再次確認尺寸。\nOther observations continue on new lines.'
  const lines=canvasNoteLines(raw)
  assert.ok(lines.length<=NOTE_MAX_LINES)
  assert.ok(lines.every(line=>Array.from(line).length<=27))
  assert.equal(canvasNoteAt('one',raw,{x:0,y:0}).text,raw)
  const chinese=canvasNoteLines('左邊牆壁有不規則的凹凸，需要現場再次確認尺寸')
  assert.ok(chinese.every(line=>Array.from(line).length<=13))
})
