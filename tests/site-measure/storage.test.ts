import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { ProjectStore, SaveConflict } from '../../app/tools/site-measure/core/storage'
import { sampleProject } from '../../app/tools/site-measure/core/model'

test('atomic save, reopen, recovery and concurrent tab conflict', async () => {
  const db=new ProjectStore('test-'+crypto.randomUUID()), p=sampleProject()
  try {
    assert.equal(await db.save(p,null),1)
    const first=await db.load(p.id);assert.deepEqual(first.project,p)
    p.name='Edited';p.revision++;assert.equal(await db.save(p,1),2)
    assert.equal((await db.previous(p.id)).name,'示範工程 · Sample only')
    await assert.rejects(db.save({...p,name:'Stale tab'},1),SaveConflict)
    assert.equal((await db.load(p.id)).project.name,'Edited')
    await assert.rejects(db.save(p,null),SaveConflict)
    assert.equal((await db.list()).length,1)
  } finally { await db.delete() }
})
test('failed write rolls back project and recovery atomically', async () => {
  const db=new ProjectStore('test-'+crypto.randomUUID()), p=sampleProject()
  try {
    await db.save(p,null)
    const fail=()=>{throw new DOMException('Quota exceeded','QuotaExceededError')}
    db.projects.hook('updating',fail)
    await assert.rejects(db.save({...p,name:'Unsaved'},1))
    assert.equal((await db.load(p.id)).project.name,p.name)
    assert.equal(await db.recovery.count(),0)
    db.projects.hook('updating').unsubscribe(fail)
    assert.equal(await db.save({...p,name:'Retry'},1),2)
  } finally { await db.delete() }
})
test('invalid schema cannot replace an existing project',async()=>{
  const db=new ProjectStore('test-'+crypto.randomUUID()),p=sampleProject()
  try {
    await db.save(p,null)
    await assert.rejects(db.save({...p,schemaVersion:2} as never,1))
    assert.deepEqual((await db.load(p.id)).project,p)
  }finally{await db.delete()}
})
