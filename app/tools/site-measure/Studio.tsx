'use client'
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type ChangeEvent } from 'react'
import MeasureCanvas from './components/MeasureCanvas'
import PartEditor from './components/PartEditor'
import QuickMeasurePanel from './components/QuickMeasurePanel'
import { DirectEdgeEditor, DirectSinkEditor } from './components/CanvasDirectEditor'
import CanvasSinkEditor from './components/CanvasSinkEditor'
import CanvasDimensionEditor from './components/CanvasDimensionEditor'
import OfflineStatus from './OfflineStatus'
import QuantityField from './components/QuantityField'
import { calculate, exportSnapshot } from './core/geometry'
import { historyReducer, initialHistory } from './core/history'
import { applyCanvasOpenDefaults, applyRectangleQuickDefaults, markTreatment, nextPartNameForArea, duplicateShape, importCopy, newProject, newShape, newVanityStep, newReference, parseBackup, worksheetSample, uid, type Edge, type Project, type Shape, type Treatment } from './core/model'
import { worksheetLayout } from './core/worksheet'
import { ProjectStore } from './core/storage'
import { adoptSharedCanvas, projectCanvasItems } from './core/project-canvas'
import type { Unit } from './core/units'

type SavedItem = { id: string; name: string; updatedAt: string }
type Download = { url: string; name: string }
function errorText(error: unknown) { return error instanceof Error ? error.message : String(error) }
function filename(name: string) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').slice(0, 90) || 'measurement' }
function blobDownload(data: BlobPart, type: string, name: string): Download {
  const blob = new Blob([data], { type }), url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  return { url, name }
}
export default function Studio() {
  const [history, dispatch] = useReducer(historyReducer, initialHistory)
  const project = history.present
  const [savedProject, setSavedProject] = useState<Project | null>(null)
  const [ready, setReady] = useState(false), [projects, setProjects] = useState<SavedItem[]>([])
  const [areaId, setAreaId] = useState<string | null>(null), [shapeId, setShapeId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState('No project open'), [error, setError] = useState('')
  const [busy, setBusy] = useState(false), [download, setDownload] = useState<Download | null>(null)
  const [panelOpen,setPanelOpen] = useState(false), [selectedEdge,setSelectedEdge] = useState<Edge | null>(null), [advanced,setAdvanced] = useState(false)
  const [directMode,setDirectMode] = useState(false), [activeRef,setActiveRef] = useState<string|null>(null), [dimensionMode,setDimensionMode] = useState(false)
  const [workspaceOpen,setWorkspaceOpen] = useState(false), [workspaceMenuOpen,setWorkspaceMenuOpen] = useState(false), [addMenuOpen,setAddMenuOpen] = useState(false)
  const [partToolsOpen,setPartToolsOpen] = useState(false)
  const [snapEnabled,setSnapEnabled] = useState(true), [orthoEnabled,setOrthoEnabled] = useState(false)
  const [fitRequest,setFitRequest] = useState(0)
  const [roomFocus,setRoomFocus] = useState<{id:string}|null>(null)
  const [editingAreaId,setEditingAreaId] = useState<string|null>(null)
  const [editingAreaName,setEditingAreaName] = useState('')
  const [areaNameError,setAreaNameError] = useState('')
  const [paintOpen,setPaintOpen] = useState(false), [paintTreatment,setPaintTreatment] = useState<Treatment|null>(null)
  useEffect(()=>{if(new URLSearchParams(window.location.search).get('direct')==='1')queueMicrotask(()=>setDirectMode(true))},[])
  const [moving,setMoving] = useState<string|null>(null), [deleteTarget,setDeleteTarget] = useState<string|null>(null), [partMessage,setPartMessage] = useState('')
  const [renameId,setRenameId] = useState<string|null>(null), [renameDraft,setRenameDraft] = useState('')
  const renameCancelled=useRef(false)
  const [exportOpen, setExportOpen] = useState(false), [defaultsOpen, setDefaultsOpen] = useState(false)
  const db = useRef<ProjectStore | null>(null), versions = useRef(new Map<string, number>())
  const latest = useRef(project), saved = useRef(new Map<string, Project>()), chain = useRef<Promise<unknown>>(Promise.resolve())
  useLayoutEffect(() => { latest.current = project }, [project])
  const importer = useRef<HTMLInputElement>(null)
  const areaDetails = useRef<HTMLDetailsElement>(null)
  const area = project?.areas.find(a => a.id === areaId) ?? project?.areas[0]
  const shape = area?.shapes.find(s => s.id === shapeId)
  const end = () => dispatch({ type: 'end' })
  const startAreaRename = (id: string, name: string) => {
    setEditingAreaId(id)
    setEditingAreaName(name)
    setAreaNameError('')
  }
  const cancelAreaRename = () => { setEditingAreaId(null);setAreaNameError('') }
  const saveAreaRename = () => {
    if (!project || !editingAreaId) return
    const name = editingAreaName.trim()
    if (!name) { setAreaNameError('Room name cannot be empty'); return }
    if (project.areas.some(a => a.id !== editingAreaId && a.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setAreaNameError('A room with this name already exists'); return
    }
    const target = project.areas.find(a => a.id === editingAreaId)
    if (target && target.name !== name) {
      edit(p => { const room=p.areas.find(a => a.id === editingAreaId);if(room)room.name=name })
      end()
    }
    cancelAreaRename()
  }
  const edit = (recipe: (p: Project) => void, group?: string) => dispatch({ type: 'edit', recipe, group })
  const editShape = (recipe: (s: Shape) => void, group?: string) => {
    if (!area || !shape) return
    edit(p => { const s = p.areas.find(a => a.id === area.id)?.shapes.find(s => s.id === shape.id); if (s) recipe(s) }, group)
  }
  useEffect(() => {
    const store = new ProjectStore(); db.current = store
    let active = true
    store.list().then(items => { if (active) { setProjects(items); setReady(true) } }).catch(e => {
      if (active) { setError('Local storage unavailable: ' + errorText(e) + '. Keep editing and download a backup.'); setReady(true) }
    })
    return () => { active = false; store.close(); db.current = null }
  }, [])
  const persist = useCallback((p: Project): Promise<boolean> => {
    const job = chain.current.catch(() => undefined).then(async () => {
      if (saved.current.get(p.id) === p) return true
      try {
        if (!db.current) throw new Error('Local database is not ready')
        if (latest.current === p) setSaveState('Saving…')
        const version = await db.current.save(p, versions.current.get(p.id) ?? null)
        versions.current.set(p.id, version); saved.current.set(p.id, p)
        if (latest.current === p) { setSaveState('Saved in this browser'); setSavedProject(p); setError('') }
        setProjects(await db.current.list())
        return true
      } catch (e) {
        if (latest.current?.id === p.id) { setSaveState('Not saved'); setError('Save failed: ' + errorText(e) + '. Your edits are still on screen. Download a backup.') }
        return false
      }
    })
    chain.current = job
    return job
  }, [])
  useEffect(() => {
    if (!project) return
    const timer = setTimeout(() => { void persist(project) }, 450)
    return () => clearTimeout(timer)
  }, [project, persist])
  useEffect(() => {
    const flush = () => { if (latest.current) void persist(latest.current) }
    const hidden = () => { if (document.visibilityState === 'hidden') flush() }
    const leave = (event: BeforeUnloadEvent) => {
      const p = latest.current
      if (p && saved.current.get(p.id) !== p) { event.preventDefault(); event.returnValue = '' }
    }
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', leave)
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', leave) }
  }, [persist])
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url) }, [download])
  const switchProject = async (p: Project, version?: number, forceCopy = false) => {
    if (!forceCopy && latest.current && !(await persist(latest.current))) return
    const workspaceProject = adoptSharedCanvas(p)
    if (version !== undefined) { versions.current.set(p.id, version); saved.current.set(p.id, p) }
    setAreaId(workspaceProject.areas[0].id); setShapeId(workspaceProject.areas[0].shapes[0]?.id ?? null)
    setMoving(null);setDeleteTarget(null);setPartMessage('');setActiveRef(null);setDimensionMode(false);setRenameId(null)
    setError(''); setExportOpen(false); setPanelOpen(false); setSelectedEdge(null); setSaveState(version === undefined ? 'Not saved yet' : 'Saved in this browser')
    setSavedProject(version === undefined ? null : p)
    setWorkspaceOpen(true); setWorkspaceMenuOpen(false); setAddMenuOpen(false); setPartToolsOpen(false); setDirectMode(true)
    setPaintOpen(false); setPaintTreatment(null); setRoomFocus(null); cancelAreaRename()
    dispatch({ type: 'load', project: workspaceProject })
  }
  const open = async (id: string) => {
    try { if (latest.current && !(await persist(latest.current))) return; if (db.current) { const row = await db.current.load(id); await switchProject(row.project, row.version) } } catch (e) { setError(errorText(e)) }
  }
  const backup = () => {
    if (!project) return
    setDownload(blobDownload(JSON.stringify(project, null, 2), 'application/json', filename(project.name) + '.site-measure.json'))
  }
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    try {
      if (file.size > 5_000_000) throw new Error('Project backup exceeds 5 MB')
      await switchProject(importCopy(parseBackup(await file.text())))
    } catch (e) { setError('Import failed: ' + errorText(e)) }
  }
  const exportFile = async (kind: 'pdf' | 'dxf') => {
    if (!project || busy) return
    setBusy(true); setError('')
    const snapshot = exportSnapshot(project)
    try {
      if (kind === 'pdf') {
        const adapter = await import('./core/export-pdf')
        const bytes = adapter.createPdf(snapshot, await adapter.loadPdfFont())
        setDownload(blobDownload(bytes.buffer as ArrayBuffer, 'application/pdf', filename(project.name) + '.pdf'))
      } else {
        const adapter = await import('./core/export-dxf'), result = adapter.createDxf(snapshot)
        if (!result.included.length) throw new Error('No complete outlines to export. Fill in the required measurements and edge allowances.')
        setDownload(blobDownload(result.text, 'application/dxf', filename(project.name) + '.dxf'))
      }
    } catch (e) { setError('Export failed: ' + errorText(e)) } finally { setBusy(false) }
  }
  const addShape = (template: Shape['template'] | 'vanity-step-left' | 'vanity-step-right') => {
    if (!area || !project) return
    areaDetails.current?.removeAttribute('open')
    if (area.shapes.length >= 60 || project.areas.reduce((n, a) => n + a.shapes.length, 0) >= 200) { setError('Limit: 60 parts per area, 200 per project'); return }
    const s = template.startsWith('vanity-step-')
      ? newVanityStep(project, template === 'vanity-step-left' ? 'left' : 'right', area.shapes.length + 1)
      : newShape(template as Shape['template'], project.unit, area.shapes.length + 1)
    if(directMode)s.name=nextPartNameForArea(area)
    applyRectangleQuickDefaults(s,project)
    if(directMode){
      applyCanvasOpenDefaults(s,project)
      // Suggestions for OPEN and allowance do not imply confirmed manufacturing markings.
      // An edge becomes colored only after an explicit field-treatment choice.
      s.treatments={}
    }
    const existing = projectCanvasItems(project.areas)
    s.layout = {x:100,y:Math.min(10000,Math.max(-90,...existing.map(p=>p.y+p.height))+240)}
    edit(p => { p.areas.find(a => a.id === area.id)!.shapes.push(s) }); setShapeId(s.id); setSelectedEdge(null); setActiveRef(null);setDimensionMode(false);setPanelOpen(!directMode);setAdvanced(false)
    setMoving(null);setDeleteTarget(null);setPartMessage('')
  }
  const selectPart = (id:string,openEditor=false) => {const owner=project?.areas.find(a=>a.shapes.some(s=>s.id===id));if(owner)setAreaId(owner.id);end();setPartToolsOpen(false);setShapeId(id);setSelectedEdge(null);setActiveRef(null);setDimensionMode(false);setPanelOpen(openEditor&&!!id);setAdvanced(false);setMoving(null);setDeleteTarget(null);setPartMessage('')}
  const beginRename=(id:string)=>{
    const owner=project?.areas.find(a=>a.shapes.some(s=>s.id===id))
    const item=owner?.shapes.find(s=>s.id===id)
    if(!item||!owner)return
    end();setAreaId(owner.id);setShapeId(id);setRenameDraft(item.name);setRenameId(id);renameCancelled.current=false
    setSelectedEdge(null);setActiveRef(null);setPanelOpen(false);setMoving(null)
  }
  const finishRename=()=>{
    if(!renameCancelled.current&&area&&renameId){
      const next=renameDraft.trim().slice(0,120)
      if(next&&area.shapes.find(s=>s.id===renameId)?.name!==next){
        edit(p=>{const s=p.areas.find(a=>a.id===area.id)?.shapes.find(s=>s.id===renameId);if(s)s.name=next})
        end()
      }
    }
    renameCancelled.current=false;setRenameId(null)
  }
  const addSinkDirect=()=>{
    if(!shape||!project)return
    if(shape.references.length>=30)return
    const ref=newReference('sink',project.unit)
    editShape(s=>s.references.push(ref))
    setSelectedEdge(null);setActiveRef(ref.id);setDimensionMode(false);setPanelOpen(false);setMoving(null);end()
  }
  const duplicatePart = () => {
    if(!shape||!area||!project)return
    if(area.shapes.length>=60||project.areas.reduce((n,a)=>n+a.shapes.length,0)>=200){setError('Limit: 60 parts per area, 200 per project');return}
    const item=worksheetLayout(area.shapes).find(p=>p.shape.id===shape.id)!
    const copy=duplicateShape(shape,area.shapes.map(s=>s.name),item)
    edit(p=>p.areas.find(a=>a.id===area.id)!.shapes.push(copy));selectPart(copy.id);setPartMessage('Duplicated '+shape.name+'. The copy has independent measurements.')
  }
  const removePart = () => {
    if(!shape||!area||deleteTarget!==shape.id)return
    edit(p=>{const a=p.areas.find(a=>a.id===area.id)!;a.shapes=a.shapes.filter(s=>s.id!==shape.id)})
    setSelectedEdge(null);setPanelOpen(false);setMoving(null);setDeleteTarget(null);setPartMessage('Deleted '+shape.name+'. Undo restores the part and its measurements.')
  }
  const all = project ? exportSnapshot(project) : null
  const excluded = all?.entries.filter(e => !e.geometry.top) ?? []
  const dirty = !!project && savedProject !== project
  const immersive = !!project && workspaceOpen
  useEffect(() => {
    document.documentElement.classList.toggle('sm-v2-open', immersive)
    return () => document.documentElement.classList.remove('sm-v2-open')
  }, [immersive])
  return <div className="sm-studio" data-active={!!project} data-immersive={immersive} lang="en">
    {immersive&&project?<div className="sm-v2-dock" role="toolbar" aria-label="Workspace">
      <div className="sm-v2-left"><button type="button" onClick={()=>{end();setWorkspaceOpen(false);setWorkspaceMenuOpen(false);setAddMenuOpen(false);setPartToolsOpen(false);setPaintOpen(false);setPaintTreatment(null);setPanelOpen(false);setSelectedEdge(null);setActiveRef(null)}} aria-label="Back to projects">← Projects</button><strong title={project.name}>{project.name}</strong></div>
      <div className="sm-v2-right">
        <button type="button" onClick={()=>dispatch({type:'undo'})} disabled={!history.past.length} aria-label="Undo">↶</button>
        <button type="button" onClick={()=>dispatch({type:'redo'})} disabled={!history.future.length} aria-label="Redo">↷</button>
        <button type="button" aria-label="Add a part" aria-expanded={addMenuOpen} onClick={()=>{setAddMenuOpen(v=>!v);setWorkspaceMenuOpen(false);setPartToolsOpen(false)}}>＋</button>
        <button type="button" aria-label="Part actions" disabled={!shape} aria-pressed={partToolsOpen} onClick={()=>{setPartToolsOpen(v=>!v);setAddMenuOpen(false);setWorkspaceMenuOpen(false)}}>Part</button>
        <button type="button" aria-label="Edge marking" aria-pressed={paintOpen} title="Quick edge marking" onClick={()=>{setPaintOpen(v=>!v);setPaintTreatment(null);setSelectedEdge(null);setActiveRef(null);setPanelOpen(false);setPartToolsOpen(false);setAddMenuOpen(false);setWorkspaceMenuOpen(false)}}>✎</button>
        <button type="button" aria-label="Workspace menu" aria-expanded={workspaceMenuOpen} onClick={()=>{setWorkspaceMenuOpen(v=>!v);setAddMenuOpen(false);setPartToolsOpen(false)}}>⋯</button>
      </div>
    </div>:null}
    {immersive&&addMenuOpen&&area?<div className="sm-v2-popover sm-v2-add" role="group" aria-label="Add a part">
      <strong>Add to canvas</strong>
      <button onClick={()=>{addShape('rectangle');setAddMenuOpen(false)}}>＋ Rectangle</button>
      <button onClick={()=>{addShape('l');setAddMenuOpen(false)}}>＋ L-shape</button>
      <button onClick={()=>{addShape('vanity-step-left');setAddMenuOpen(false)}}>＋ Vanity Step · Deep Left</button>
      <button onClick={()=>{addShape('vanity-step-right');setAddMenuOpen(false)}}>＋ Vanity Step · Deep Right</button>
    </div>:null}
    {immersive&&workspaceMenuOpen&&project?<div className="sm-v2-popover sm-v2-menu" role="group" aria-label="Workspace options">
      <strong>Rooms · all Parts share one canvas</strong>
      <div className="sm-v2-room-list">{project.areas.map(a=>editingAreaId===a.id?
        <form key={a.id} className="sm-v2-room-rename" aria-label={'Rename room '+a.name} onSubmit={e=>{e.preventDefault();saveAreaRename()}}>
          <label htmlFor={'sm-v2-room-'+a.id}>Room name</label>
          <input id={'sm-v2-room-'+a.id} aria-label="Room name" autoFocus maxLength={120} value={editingAreaName}
            onFocus={e=>e.currentTarget.select()}
            onChange={e=>{setEditingAreaName(e.target.value);setAreaNameError('')}}
            onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();cancelAreaRename()}}}/>
          {areaNameError?<span className="sm-v2-room-error" role="alert">{areaNameError}</span>:null}
          <div className="sm-v2-room-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={cancelAreaRename}>Cancel</button>
          </div>
        </form>:
        <div className="sm-v2-room-row" key={a.id}>
          <button type="button" aria-pressed={a.id===area?.id} onClick={()=>{setAreaId(a.id);selectPart(a.shapes[0]?.id??'');setRoomFocus({id:a.id});setWorkspaceMenuOpen(false)}}>{a.name}</button>
          <button type="button" aria-label={'Rename room '+a.name} title={'Rename '+a.name} onClick={()=>startAreaRename(a.id,a.name)}>✎</button>
        </div>)}</div>
      <button onClick={()=>{
        if(project.areas.length>=30)return
        const id=uid()
        let n=project.areas.length+1
        while(project.areas.some(a=>a.name.toLocaleLowerCase()==='area '+n))n++
        const name='Area '+n
        edit(p=>p.areas.push({id,name,notes:'',shapes:[]}))
        setAreaId(id);setShapeId(null);startAreaRename(id,name)
      }}>＋ Area</button>
      <strong>Canvas</strong>
      <button onClick={()=>{setFitRequest(n=>n+1);setWorkspaceMenuOpen(false)}}>Fit All · double-tap empty canvas</button>
      <button aria-pressed={snapEnabled} onClick={()=>setSnapEnabled(v=>!v)}>Snap · {snapEnabled?'On':'Off'} (align nearby Parts)</button>
      <button aria-pressed={orthoEnabled} onClick={()=>setOrthoEnabled(v=>!v)}>Ortho · {orthoEnabled?'On':'Off'} (move horizontally / vertically)</button>
      <label className="sm-v2-unit">Units <select aria-label="Display units" value={project.unit} onChange={e=>edit(p=>{p.unit=e.target.value as Unit})}><option value="in">inch</option><option value="mm">mm</option></select></label>
      <button onClick={()=>{setExportOpen(v=>!v);setDefaultsOpen(false);setWorkspaceMenuOpen(false)}}>PDF / DXF Export</button>
      <button onClick={()=>{setDefaultsOpen(v=>!v);setExportOpen(false);setWorkspaceMenuOpen(false)}}>Overhang defaults</button>
      <button onClick={()=>{backup();setWorkspaceMenuOpen(false)}}>Download project backup</button>
      <div className="sm-v2-status"><OfflineStatus /><span role="status">{dirty&&saveState.startsWith('Saved')?'Saving changes…':saveState}</span></div>
    </div>:null}
    <header className="sm-heading"><div><p className="sm-eyebrow">FIELD WORKSHEET · QUICK MEASURE BETA</p><h1>Site Measure Studio</h1></div><span className="sm-local-pill">Local projects · no account needed</span></header>
    <div className="sm-toolbar">
      <OfflineStatus />
      {project?<button className="sm-direct-switch" aria-pressed={directMode} onClick={()=>{end();setDirectMode(v=>!v);setPanelOpen(false);setSelectedEdge(null);setActiveRef(null);setDimensionMode(false)}}>{directMode?'✎ 圖上輸入 · ON':'✎ 試用圖上輸入'}</button>:null}
      <details className="sm-project-menu"><summary>Project</summary><div className="sm-project-popover">
        <button disabled={!ready} onClick={()=>void switchProject(newProject())}>New project</button><button disabled={!ready} onClick={()=>void switchProject(worksheetSample())}>Open sample worksheet</button><button onClick={()=>importer.current?.click()}>Import backup as a copy</button>
        <h2>Saved in this browser</h2>{projects.map(p=><button key={p.id} onClick={()=>void open(p.id)}>{p.name}<small>{new Date(p.updatedAt).toLocaleString()}</small></button>)}
        {project?<button onClick={async()=>{try{const p=await db.current?.previous(project.id);if(p)await switchProject(importCopy(p))}catch(e){setError(errorText(e))}}}>Recover previous save as a copy</button>:null}
      </div></details>
      {project?<>
        <input className="sm-project-name" aria-label="Project name" value={project.name} maxLength={120} onChange={e=>edit(p=>{p.name=e.target.value||'Untitled project'},'project-name')} onBlur={end}/>
        <label className="sm-unit"><span>Units</span><select aria-label="Display units" value={project.unit} onChange={e=>edit(p=>{p.unit=e.target.value as Unit})}><option value="in">inch</option><option value="mm">mm</option></select></label>
        <button onClick={()=>dispatch({type:'undo'})} disabled={!history.past.length} aria-label="Undo">↶</button><button onClick={()=>dispatch({type:'redo'})} disabled={!history.future.length} aria-label="Redo">↷</button>
        <button onClick={backup}>Backup</button><button onClick={()=>setDefaultsOpen(!defaultsOpen)}>Defaults</button><button className="sm-primary" onClick={()=>setExportOpen(!exportOpen)}>Export</button>
      </>:null}
      <span className={'sm-save-state '+(saveState==='Not saved'?'sm-error-text':'')} role="status">{dirty&&saveState.startsWith('Saved')?'Saving changes…':saveState}</span>
    </div>
    <input ref={importer} type="file" accept=".json,.site-measure.json,application/json" hidden onChange={importFile}/>
    {error?<div className="sm-error" role="alert"><p>{error}</p>{project?<div className="sm-actions"><button onClick={backup}>Download backup now</button><button onClick={()=>void persist(project)}>Retry save</button><button onClick={()=>void switchProject(importCopy(project),undefined,true)}>Save as a new copy</button></div>:null}<button aria-label="Dismiss message" onClick={()=>setError('')}>×</button></div>:null}
    {download?<p className="sm-download" role="status">File ready. <a href={download.url} download={download.name}>Download {download.name}</a></p>:null}
    {!project||!workspaceOpen?<section className="sm-welcome"><span className="sm-welcome-mark" aria-hidden="true">⌜</span><h2>Measure the line. Keep the whole story.</h2><p>Add the countertop parts in a room, tap the edge you measured, and enter the number. Keep extra readings and notes without changing the drawing.</p><div className="sm-actions">{project?<button className="sm-primary" onClick={()=>{setWorkspaceOpen(true);setDirectMode(true)}}>Enter Workspace → {project.name}</button>:null}<button className="sm-primary" disabled={!ready} onClick={()=>void switchProject(newProject())}>New project</button><button disabled={!ready} onClick={()=>void switchProject(worksheetSample())}>Try sample Kitchen</button><button onClick={()=>importer.current?.click()}>Import backup</button></div>
      {projects.length?<div className="sm-recent"><h3>Continue a project</h3>{projects.slice(0,5).map(p=><button key={p.id} onClick={()=>void open(p.id)}>{p.name}<span>Open →</span></button>)}</div>:null}
      <p className="sm-muted">Projects stay in this browser. Keep a portable backup. Preview and production use separate local storage.</p>
    </section>:<>
      {exportOpen?<section className="sm-export-panel"><div><h2>Export field worksheet</h2><p>PDF keeps all readings and notes. DXF includes only complete geometry. Review before fabrication.</p>{excluded.length?<p className="sm-error-text">Excluded from DXF: {excluded.map(e=>e.area.name+' / '+e.shape.name).join(', ')}</p>:null}</div><div className="sm-actions"><button disabled={busy} onClick={()=>void exportFile('pdf')}>{busy?'Working…':'Export PDF'}</button><button disabled={busy||!all?.entries.some(e=>e.geometry.top)} onClick={()=>void exportFile('dxf')}>Export DXF</button></div></section>:null}
      {defaultsOpen?<section className="sm-defaults"><div><h2>Project overhang defaults</h2><p>Apply only to a named edge. Changing these values does not change existing parts.</p></div>{(['end','front'] as const).map(key=><QuantityField key={key} label={key==='end'?'Typical end overhang':'Typical front overhang'} quantity={project.defaults[key]} unit={project.unit} allowance onEnd={end} onChange={q=>edit(p=>{p.defaults[key]=q;p.defaults.revision++},'default-'+key)}/>)}</section>:null}
      <div className="sm-area-bar"><div className="sm-area-tabs" aria-label="Areas">{project.areas.map(a=><button key={a.id} aria-pressed={area?.id===a.id} onClick={()=>{setAreaId(a.id);selectPart(a.shapes[0]?.id??'');setRoomFocus({id:a.id})}}>{a.name}<span>{a.shapes.length} parts</span></button>)}</div><button onClick={()=>{if(project.areas.length>=30)return;const id=uid();edit(p=>p.areas.push({id,name:'Area '+(p.areas.length+1),notes:'',shapes:[]}));setAreaId(id);setShapeId(null);setPanelOpen(false);setMoving(null);setDeleteTarget(null)}}>＋ Area</button></div>
      {area?<>
        <div className="sm-area-heading"><details ref={areaDetails} className="sm-area-settings"><summary>{area.name} <span>▾</span></summary><div><label>Area name<input aria-label="Area name" maxLength={120} value={area.name} onChange={e=>edit(p=>{p.areas.find(a=>a.id===area.id)!.name=e.target.value||'Unnamed area'},'area-name')} onBlur={end}/></label><label>Area notes<textarea aria-label="Area notes" maxLength={4000} value={area.notes} onChange={e=>edit(p=>{p.areas.find(a=>a.id===area.id)!.notes=e.target.value},'area-notes')} onBlur={end}/></label></div></details>
          <div className="sm-actions"><button onClick={()=>addShape('rectangle')}>＋ Rectangle</button><button onClick={()=>addShape('l')}>＋ L-shape</button><details className="sm-template-picker"><summary>＋ Vanity Step</summary><div className="sm-template-picker-options"><p>Stepped bathroom vanity · choose the full-depth side.</p><button onClick={e=>{addShape('vanity-step-left');e.currentTarget.closest('details')!.open=false}}>Deep Left</button><button onClick={e=>{addShape('vanity-step-right');e.currentTarget.closest('details')!.open=false}}>Deep Right</button></div></details></div></div>
        <div className="sm-workspace" data-editor={panelOpen&&!!shape}>
          <MeasureCanvas key={project.id} area={area} areas={project.areas} fitRequest={fitRequest} roomFocus={roomFocus} snapEnabled={snapEnabled} orthoEnabled={orthoEnabled} selected={shape?.id??null} selectedEdge={selectedEdge&&shape?{partId:shape.id,edge:selectedEdge}:null} selectedReference={directMode?activeRef:null} directMode={directMode} unit={project.unit} moving={moving===shape?.id?moving:null}
            paintToolbar={immersive&&paintOpen?<div className="sm-paint-toolbar" role="toolbar" aria-label="Paint edge treatment">
              <span className="sm-paint-heading">Mark edge</span>
              {([['polish','Polish'],['no-polish','No Polish'],['miter','Miter']] as const).map(([kind,label])=><button key={kind} type="button" data-treatment={kind} aria-pressed={paintTreatment===kind} onClick={()=>{setPaintTreatment(kind);setSelectedEdge(null);setActiveRef(null)}}><span className="sm-paint-swatch"/>{label}</button>)}
              <button type="button" className="sm-paint-exit" onClick={()=>{setPaintOpen(false);setPaintTreatment(null)}}>Done</button>
              <small>{paintTreatment?'Tap finished edges · '+paintTreatment:'Choose a finish, then tap edges'}</small>
            </div>:null}
            floatingEditor={directMode&&!panelOpen&&shape&&project?(selectedEdge?(dimensionMode?<CanvasDimensionEditor key={shape.id+selectedEdge} project={project} shape={shape} edge={selectedEdge} onChange={editShape} onEnd={end} onClose={()=>{setSelectedEdge(null);setDimensionMode(false)}}/>:<DirectEdgeEditor key={shape.id+selectedEdge} project={project} shape={shape} edge={selectedEdge} onChange={editShape} onEnd={end} onClose={()=>setSelectedEdge(null)} onAdvanced={()=>{setPanelOpen(true);setAdvanced(true);setActiveRef(null)}}/>):activeRef?(shape.references.find(r=>r.id===activeRef)?.kind==='sink'?<CanvasSinkEditor key={activeRef} project={project} shape={shape} refId={activeRef} onChange={editShape} onEnd={end} onClose={()=>setActiveRef(null)} onAdvanced={()=>{setPanelOpen(true);setAdvanced(true);setActiveRef(null)}}/>:<DirectSinkEditor key={activeRef} project={project} shape={shape} refId={activeRef} onChange={editShape} onEnd={end} onClose={()=>setActiveRef(null)} onAdvanced={()=>{setPanelOpen(true);setAdvanced(true);setActiveRef(null)}}/>):null):null}
            toolbar={shape&&(!immersive||partToolsOpen)?<div className="sm-part-toolbar" role="toolbar" aria-label="Selected part actions">
              {renameId===shape.id?
                <><input className="sm-inline-part-name" aria-label="Part name" autoFocus value={renameDraft} maxLength={120} onChange={e=>setRenameDraft(e.target.value)}
                  onBlur={finishRename} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}else if(e.key==='Escape'){renameCancelled.current=true;e.currentTarget.blur()}}}/>
                  <button type="button" aria-label="Save part name" onPointerDown={e=>e.preventDefault()} onClick={finishRename}>Done</button></>
                :<button type="button" className="sm-part-rename" aria-label={'Rename '+shape.name} onClick={()=>beginRename(shape.id)}><span className="sm-rename-text">{shape.name}</span> <span className="sm-rename-pencil" aria-hidden="true">✎</span></button>}
              {deleteTarget===shape.id?<><span>Delete this part?</span><button className="sm-danger" onClick={removePart}>Delete part</button><button onClick={()=>setDeleteTarget(null)}>Cancel deletion</button></>:<>
                <button onClick={()=>{end();setMoving(null);setPanelOpen(true);setSelectedEdge(null);setActiveRef(null);setAdvanced(false)}}>{directMode?'欄位設定':'Measure'}</button>
                {directMode?<button onClick={addSinkDirect}>＋ Sink</button>:null}
                {directMode&&shape.basis==='cabinet'&&!shape.openEdges?<button onClick={()=>{editShape(s=>applyCanvasOpenDefaults(s,project));end();setPanelOpen(false)}}>套用 OPEN 預設</button>:null}
                {!directMode?<button aria-pressed={moving===shape.id} onClick={()=>{end();setMoving(moving===shape.id?null:shape.id);setPanelOpen(false);setSelectedEdge(null)}}>{moving===shape.id?'Done moving':'Move'}</button>:null}
                <button aria-pressed={shape.mirrored} onClick={()=>{editShape(s=>{s.mirrored=!s.mirrored});setMoving(null)}}>Mirror</button>
                <button onClick={()=>{editShape(s=>{s.rotation=((s.rotation+90)%360) as Shape['rotation']});setMoving(null)}}>Rotate</button>
                <button onClick={duplicatePart}>Duplicate</button>
                <button onClick={()=>{setDeleteTarget(shape.id);setPanelOpen(false);setMoving(null)}}>Delete</button>
              </>}
            </div>:null}
            onSelect={id=>selectPart(id,!directMode)}
            onRename={beginRename}
            onEdge={selection=>{
              if(paintOpen&&paintTreatment&&directMode){
                const owner=project.areas.find(a=>a.shapes.some(s=>s.id===selection.partId))
                const current=owner?.shapes.find(s=>s.id===selection.partId)
                if(current?.treatments?.[selection.edge]!==paintTreatment){
                  edit(p=>{const s=p.areas.find(a=>a.id===owner?.id)?.shapes.find(s=>s.id===selection.partId);if(s)markTreatment(s,selection.edge,paintTreatment)})
                  end()
                }
                if(owner)setAreaId(owner.id);setShapeId(selection.partId);setSelectedEdge(null);setActiveRef(null);setPanelOpen(false);return
              }
              end();selectPart(selection.partId);setSelectedEdge(selection.edge);setDimensionMode(false);setActiveRef(null);setPanelOpen(!directMode);setAdvanced(false);setMoving(null);setDeleteTarget(null)
            }}
            onDimension={selection=>{end();selectPart(selection.partId);setSelectedEdge(selection.edge);setDimensionMode(true);setActiveRef(null);setPanelOpen(false);setMoving(null);setDeleteTarget(null)}}
            onReference={(partId,refId)=>{end();selectPart(partId);setActiveRef(refId);setSelectedEdge(null);setDimensionMode(false);setPanelOpen(!directMode);setAdvanced(true);setMoving(null);setDeleteTarget(null)}}
            onPlace={(id,position)=>edit(p=>{const owner=p.areas.find(a=>a.shapes.some(s=>s.id===id));const part=owner?.shapes.find(s=>s.id===id);if(part)part.layout=position})}/>
          {panelOpen&&shape?(advanced?<PartEditor key={shape.id+(selectedEdge??'part')} project={project} shape={shape} edge={selectedEdge} onChange={editShape} onEnd={end} onRemove={()=>{setDeleteTarget(shape.id);setPanelOpen(false);setMoving(null)}} onClose={()=>{end();setPanelOpen(false);setSelectedEdge(null)}}/>:<QuickMeasurePanel key={shape.id+(selectedEdge??'part')} project={project} shape={shape} edge={selectedEdge} onChange={editShape} onEnd={end} onDetails={()=>setAdvanced(true)} onClose={()=>{end();setPanelOpen(false);setSelectedEdge(null)}}/>):null}
        </div>
        <div className="sm-part-strip" aria-label="Parts">{area.shapes.map(s=><button key={s.id} aria-pressed={s.id===shape?.id} onClick={()=>selectPart(s.id)}>{s.name}{calculate(s).top?'':' · incomplete'}</button>)}</div>
        {partMessage?<p className="sm-part-message" role="status">{partMessage}</p>:null}
      </>:null}
      <footer className="sm-footnote">Visual positions are not surveyed distances. Reference readings do not change geometry. Field measurements require fabrication review.</footer>
    </>}
  </div>
}
