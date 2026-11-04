import Dexie, { type Table } from 'dexie'
import { projectSchema, type Project } from './model'
export class SaveConflict extends Error {
  constructor() { super('Another tab changed this project. Save a copy or reopen the saved project.'); this.name = 'SaveConflict' }
}
type Record = { id: string; version: number; updatedAt: string; project: Project }
export class ProjectStore extends Dexie {
  projects!: Table<Record, string>
  recovery!: Table<Record, string>
  constructor(name = 'baicai-site-measure-v1') {
    super(name)
    this.version(1).stores({ projects: '&id, updatedAt', recovery: '&id' })
  }
  async list() {
    const records = await this.projects.orderBy('updatedAt').reverse().toArray()
    return records.map(r => ({ id: r.id, name: r.project.name, updatedAt: r.updatedAt }))
  }
  async load(id: string): Promise<{ project: Project; version: number }> {
    const row = await this.projects.get(id)
    if (!row) throw new Error('Project not found')
    return { project: projectSchema.parse(row.project), version: row.version }
  }
  async previous(id: string): Promise<Project> {
    const row = await this.recovery.get(id)
    if (!row) throw new Error('No previous saved version yet')
    return projectSchema.parse(row.project)
  }
  async save(project: Project, expectedVersion: number | null): Promise<number> {
    const checked = projectSchema.parse(project)
    return this.transaction('rw', this.projects, this.recovery, async () => {
      const old = await this.projects.get(project.id)
      if ((old?.version ?? null) !== expectedVersion) throw new SaveConflict()
      if (old) await this.recovery.put(old)
      const version = (old?.version ?? 0) + 1
      await this.projects.put({ id: checked.id, version, updatedAt: checked.updatedAt, project: checked })
      return version
    })
  }
}
