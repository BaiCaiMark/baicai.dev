'use client'
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type ChangeEvent } from 'react'
import MeasureCanvas from './components/MeasureCanvas'
import QuantityField from './components/QuantityField'
import { calculate, exportSnapshot, measurementRows } from './core/geometry'
import { historyReducer, initialHistory } from './core/history'
import { applyDefault, edgeLabels, edgeOrder, importCopy, newProject, newReference, newShape, paramLabels, parseBackup, quantity, requiredParams, sampleProject, setBasis, statusLabels, uid, type Edge, type Param, type Project, type Quantity, type Shape } from './core/model'
import { ProjectStore } from './core/storage'
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
  const [saveState, setSaveState] = useState('尚未開啟工程'), [error, setError] = useState('')
  const [busy, setBusy] = useState(false), [download, setDownload] = useState<Download | null>(null)
  const [exportOpen, setExportOpen] = useState(false), [defaultsOpen, setDefaultsOpen] = useState(false)
  const db = useRef<ProjectStore | null>(null), versions = useRef(new Map<string, number>())
  const latest = useRef(project), saved = useRef(new Map<string, Project>()), chain = useRef<Promise<unknown>>(Promise.resolve())
  useLayoutEffect(() => { latest.current = project }, [project])
  const importer = useRef<HTMLInputElement>(null)
  const area = project?.areas.find(a => a.id === areaId) ?? project?.areas[0]
  const shape = area?.shapes.find(s => s.id === shapeId) ?? area?.shapes[0]
  const end = () => dispatch({ type: 'end' })
  const edit = (recipe: (p: Project) => void, group?: string) => dispatch({ type: 'edit', recipe, group })
  const editShape = (recipe: (s: Shape) => void, group?: string) => {
    if (!area || !shape) return
    edit(p => { const s = p.areas.find(a => a.id === area.id)?.shapes.find(s => s.id === shape.id); if (s) recipe(s) }, group)
  }
  useEffect(() => {
    const store = new ProjectStore(); db.current = store
    let active = true
    store.list().then(items => { if (active) { setProjects(items); setReady(true) } }).catch(e => {
      if (active) { setError('本機儲存無法開啟：' + errorText(e) + '。可繼續編輯並下載工程備份。'); setReady(true) }
    })
    return () => { active = false; store.close(); db.current = null }
  }, [])
  const persist = useCallback((p: Project): Promise<boolean> => {
    const job = chain.current.catch(() => undefined).then(async () => {
      if (saved.current.get(p.id) === p) return true
      try {
        if (!db.current) throw new Error('本機資料庫尚未就緒')
        if (latest.current === p) setSaveState('儲存中…')
        const version = await db.current.save(p, versions.current.get(p.id) ?? null)
        versions.current.set(p.id, version); saved.current.set(p.id, p)
        if (latest.current === p) { setSaveState('已儲存於此瀏覽器'); setSavedProject(p); setError('') }
        setProjects(await db.current.list())
        return true
      } catch (e) {
        if (latest.current?.id === p.id) { setSaveState('未儲存'); setError('保存失敗：' + errorText(e) + '。目前編輯仍留在畫面，可下載備份。') }
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
    if (version !== undefined) { versions.current.set(p.id, version); saved.current.set(p.id, p) }
    setAreaId(p.areas[0].id); setShapeId(p.areas[0].shapes[0]?.id ?? null)
    setError(''); setExportOpen(false); setSaveState(version === undefined ? '尚未儲存' : '已儲存於此瀏覽器')
    setSavedProject(version === undefined ? null : p)
    dispatch({ type: 'load', project: p })
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
      if (file.size > 5_000_000) throw new Error('工程檔超過 5 MB')
      await switchProject(importCopy(parseBackup(await file.text())))
    } catch (e) { setError('匯入失敗：' + errorText(e)) }
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
        if (!result.included.length) throw new Error('沒有可匯出的完整輪廓；請先補齊尺寸與各邊伸出量')
        setDownload(blobDownload(result.text, 'application/dxf', filename(project.name) + '.dxf'))
      }
    } catch (e) { setError('匯出失敗：' + errorText(e)) } finally { setBusy(false) }
  }
  const addShape = (template: Shape['template']) => {
    if (!area || !project) return
    if (area.shapes.length >= 60 || project.areas.reduce((n, a) => n + a.shapes.length, 0) >= 200) { setError('此版本最多每區 60 個、每工程 200 個形狀'); return }
    const s = newShape(template, project.unit, area.shapes.length + 1)
    edit(p => { p.areas.find(a => a.id === area.id)!.shapes.push(s) }); setShapeId(s.id)
  }
  const dimension = (id: string, key: Param) => {
    setShapeId(id)
    requestAnimationFrame(() => {
      const field = document.getElementById('sm-dim-' + key) as HTMLInputElement | null
      field?.focus(); field?.select(); field?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }
  const updateQ = (key: Param, q: Quantity) => editShape(s => { s.dimensions[key] = q }, shape!.id + '-dim-' + key)
  const applyPreset = (edge: Edge, kind: 'end' | 'front') => editShape(s => { Object.assign(s, applyDefault(s, edge, project!, kind)) })
  const geometry = shape ? calculate(shape) : null
  const all = project ? exportSnapshot(project) : null
  const excluded = all?.entries.filter(e => !e.geometry.top) ?? []
  const dirty = !!project && savedProject !== project
  return <div className="sm-studio" data-active={!!project} lang="zh-Hant">
    <header className="sm-heading">
      <div><p className="sm-eyebrow">FIELD MEASUREMENT · V0.1 PREVIEW</p><h1>Site Measure Studio</h1><p>量到的尺寸，成為可交接的圖。</p></div>
      <span className="sm-local-pill">本機工程 · 無需帳號</span>
    </header>
    <div className="sm-toolbar">
      <details className="sm-project-menu"><summary>工程 Projects</summary><div className="sm-project-popover">
        <button disabled={!ready} onClick={() => void switchProject(newProject())}>＋ 新建工程</button>
        <button disabled={!ready} onClick={() => void switchProject(sampleProject())}>載入示範工程</button>
        <button onClick={() => importer.current?.click()}>匯入工程檔（建立副本）</button>
        <h2>此瀏覽器的工程</h2>
        {projects.length ? projects.map(p => <button key={p.id} onClick={() => void open(p.id)}>{p.name}<small>{new Date(p.updatedAt).toLocaleString()}</small></button>) : <p>尚無已保存工程。</p>}
        {project ? <button onClick={async () => { try { const previous = await db.current?.previous(project.id); if (previous) await switchProject(importCopy(previous)) } catch(e) { setError(errorText(e)) } }}>上一保存版本 → 開啟為副本</button> : null}
      </div></details>
      {project ? <>
        <input className="sm-project-name" aria-label="工程名稱" value={project.name} maxLength={120} onChange={e => edit(p => { p.name = e.target.value || '未命名工程' }, 'project-name')} onBlur={end} />
        <label className="sm-unit">單位 <select aria-label="顯示單位" value={project.unit} onChange={e => edit(p => { p.unit = e.target.value as Unit })}><option value="in">inch</option><option value="mm">mm</option></select></label>
        <button onClick={() => dispatch({ type: 'undo' })} disabled={!history.past.length} aria-label="復原 Undo">↶ Undo</button>
        <button onClick={() => dispatch({ type: 'redo' })} disabled={!history.future.length} aria-label="重做 Redo">↷ Redo</button>
        <button onClick={backup}>工程備份</button>
        <button className="sm-primary" onClick={() => setExportOpen(!exportOpen)}>匯出 PDF / DXF</button>
      </> : null}
      <span className={'sm-save-state ' + (saveState === '未儲存' ? 'sm-error-text' : '')} role="status">{dirty && saveState.startsWith('已儲存') ? '等待儲存…' : saveState}</span>
    </div>
    <input ref={importer} type="file" accept=".json,.site-measure.json,application/json" hidden onChange={importFile} />
    {error ? <div className="sm-error" role="alert"><p>{error}</p>{project ? <div className="sm-actions">
      <button onClick={backup}>立即下載工程備份</button><button onClick={() => void persist(project)}>重試保存</button>
      <button onClick={() => void switchProject(importCopy(project), undefined, true)}>另存新工程副本</button>
    </div> : null}<button className="sm-dismiss" aria-label="關閉訊息" onClick={() => setError('')}>×</button></div> : null}
    {download ? <p className="sm-download" role="status">已建立檔案。若下載未開始，<a href={download.url} download={download.name}>點此下載 {download.name}</a>。</p> : null}
    {!project ? <section className="sm-welcome">
      <span className="sm-welcome-mark" aria-hidden="true">⌜</span><h2>把量尺筆記，變成精確圖面。</h2>
      <p>建立工程，選擇形狀，輸入櫃體或成品尺寸。伸出量、定位與待確認資訊一起留下。</p>
      <div className="sm-actions"><button className="sm-primary" disabled={!ready} onClick={() => void switchProject(newProject())}>建立量尺工程</button><button disabled={!ready} onClick={() => void switchProject(sampleProject())}>先試示範工程</button><button onClick={() => importer.current?.click()}>匯入備份</button></div>
      {projects.length ? <div className="sm-recent"><h3>繼續量尺</h3>{projects.slice(0, 5).map(p => <button key={p.id} onClick={() => void open(p.id)}>{p.name}<span>開啟 →</span></button>)}</div> : null}
      <p className="sm-muted">工程保存在目前瀏覽器。請定期下載備份；清除網站資料會移除本機工程。Preview 與正式網域的儲存各自獨立。</p>
    </section> : <>
      {exportOpen ? <section className="sm-export-panel"><div><h2>交接圖面</h2><p>PDF 保留所有量尺資訊；DXF 只輸出完整輪廓。兩者皆須加工前複核。</p>
        {excluded.length ? <p className="sm-error-text">DXF 將排除：{excluded.map(e => e.area.name + ' / ' + e.shape.name).join('、')}</p> : <p>所有形狀的必要幾何數值均已填入；確認狀態仍隨圖記錄。</p>}
        <p className="sm-muted">90° 為正交模板；參考線不是開孔。PDF 中文字型首次匯出需載入。</p></div>
        <div className="sm-actions"><button disabled={busy} onClick={() => void exportFile('pdf')}>{busy ? '處理中…' : '下載 PDF'}</button><button disabled={busy || !all?.entries.some(e => e.geometry.top)} onClick={() => void exportFile('dxf')}>下載 DXF</button></div>
      </section> : null}
      <div className="sm-area-bar" aria-label="工程區域">
        <div className="sm-area-tabs">{project.areas.map(a => <button key={a.id} aria-pressed={a.id === area?.id} onClick={() => { setAreaId(a.id); setShapeId(a.shapes[0]?.id ?? null) }}>{a.name}<span>{a.shapes.length}</span></button>)}</div>
        <button onClick={() => { if (project.areas.length >= 30) return; const id = uid(); edit(p => { p.areas.push({ id, name: 'Area ' + (p.areas.length + 1), notes: '', shapes: [] }) }); setAreaId(id); setShapeId(null) }}>＋ 區域</button>
        <button aria-expanded={defaultsOpen} onClick={() => setDefaultsOpen(!defaultsOpen)}>專案伸出量預設</button>
      </div>
      {defaultsOpen ? <section className="sm-defaults"><div><h2>重複使用的伸出量</h2><p>數值只在點選指定邊時套用。修改預設不會改變舊形狀；不另加門板厚度。</p></div>
        {(['end', 'front'] as const).map(key => <QuantityField key={key} label={key === 'end' ? '典型端部' : '典型前緣'} quantity={project.defaults[key]} unit={project.unit} allowance onEnd={end} onChange={q => edit(p => { p.defaults[key] = q; p.defaults.revision++ }, 'default-' + key)} />)}
      </section> : null}
      {area ? <>
        <div className="sm-area-heading"><input aria-label="區域名稱" maxLength={120} value={area.name} onChange={e => edit(p => { p.areas.find(a => a.id === area.id)!.name = e.target.value || '未命名區域' }, 'area-name')} onBlur={end} />
          <div className="sm-actions"><button onClick={() => addShape('rectangle')}>＋ Rectangle</button><button onClick={() => addShape('l')}>＋ L-shape</button></div>
        </div>
        <div className="sm-workspace">
          <div className="sm-drawing"><div className="sm-shape-tabs">{area.shapes.map(s => <button key={s.id} aria-pressed={s.id === shape?.id} onClick={() => setShapeId(s.id)}>{s.template === 'l' ? '⌜' : '▭'} {s.name}{calculate(s).top ? '' : ' · 待量'}</button>)}</div>
            <MeasureCanvas key={area.id} area={area} selected={shape?.id ?? null} unit={project.unit} onSelect={setShapeId} onDimension={dimension} />
          </div>
          <aside className="sm-inspector" aria-label="形狀量尺輸入">
            {shape && geometry ? <>
              <div className="sm-inspector-title"><input aria-label="形狀名稱" maxLength={120} value={shape.name} onChange={e => editShape(s => { s.name = e.target.value || '未命名形狀' }, 'shape-name')} onBlur={end} />
                <span>{shape.template === 'l' ? 'L-SHAPE' : 'RECTANGLE'}</span></div>
              <section className="sm-input-section"><h2>1 · 輸入量到的尺寸</h2>
                <div className="sm-segmented"><button aria-pressed={shape.basis === 'cabinet'} onClick={() => editShape(s => setBasis(s, 'cabinet'))}>櫃體 ＋ 伸出量</button><button aria-pressed={shape.basis === 'finished'} onClick={() => editShape(s => setBasis(s, 'finished'))}>直接量成品</button></div>
                <p className="sm-muted">{shape.basis === 'cabinet' ? '以櫃體為基準；不自動加入門板厚度。' : '以直接實測的成品尺寸生成，不再加入伸出量。'}</p>
                {shape.template === 'l' ? <p className="sm-muted">W／H 為總外框；A 為橫腿深，B 為直腿寬。A &lt; H、B &lt; W。</p> : null}
                <div className="sm-fields">{requiredParams(shape).map(key => <QuantityField key={shape.id + key} id={'sm-dim-' + key} label={paramLabels[key]} quantity={shape.dimensions[key]} unit={project.unit} onChange={q => updateQ(key, q)} onEnd={end} />)}</div>
                <div className="sm-orientation"><button onClick={() => editShape(s => { s.rotation = ((s.rotation + 90) % 360) as Shape['rotation'] })}>↻ {shape.rotation}°</button><button aria-pressed={shape.mirrored} onClick={() => editShape(s => { s.mirrored = !s.mirrored })}>鏡像 {shape.mirrored ? '開' : '關'}</button>
                  <select aria-label="直角確認狀態" value={shape.angleStatus} onChange={e => editShape(s => { s.angleStatus = e.target.value as Shape['angleStatus'] })}>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>90° {label}</option>)}</select></div>
                <p className="sm-muted">邊的名稱跟隨模板；旋轉／鏡像後仍以 E1–E6 識別。</p>
              </section>
              {shape.basis === 'cabinet' ? <section className="sm-input-section"><h2>2 · 指定各邊伸出量</h2>
                <p className="sm-muted">每邊需明確指定。無伸出可選 0；空白仍是未知。</p>
                <button className="sm-zero-all" onClick={() => editShape(s => { edgeOrder(s).forEach(e => { if (!s.allowances[e].input.trim()) s.allowances[e] = quantity('0', project.unit, 'allowance') }) })}>將未填邊明確設為 0</button>
                {edgeOrder(shape).map(edge => <div key={edge} className="sm-allowance-row"><QuantityField label={edgeLabels[edge]} quantity={shape.allowances[edge]} unit={project.unit} allowance onEnd={end} onChange={q => editShape(s => { s.allowances[edge] = q }, shape.id + '-edge-' + edge)} />
                  <div className="sm-edge-actions"><button onClick={() => editShape(s => { s.allowances[edge] = quantity('0', project.unit, 'allowance') })}>0 無伸出</button><button onClick={() => applyPreset(edge, 'end')}>套用端部</button><button onClick={() => applyPreset(edge, 'front')}>套用前緣</button></div>
                </div>)}
              </section> : null}
              <section className="sm-result"><h2>成品與待確認資訊</h2>
                {geometry.errors.length ? <ul className="sm-error-text">{geometry.errors.map(e => <li key={e}>{e}</li>)}</ul> : null}
                {measurementRows(shape, project.unit, geometry).filter(r => r.label.includes('成品長 =') || r.label.includes('成品深 =') || r.label.includes('成品外框')).map(r => <p key={r.label}><span>{r.label}</span><strong>{r.text}</strong></p>)}
                <details><summary>查看所有尺寸與來源</summary><dl>{measurementRows(shape, project.unit, geometry).map((r,i) => <div key={i}><dt>{r.label}</dt><dd>{r.text}</dd></div>)}</dl></details>
                <p className="sm-muted">{geometry.warnings[0]}。加工前仍須複核。</p>
              </section>
              <section className="sm-input-section"><h2>3 · 定位參考</h2><p className="sm-muted">填 X 或 Y 即可留下參考線；兩者齊全才有中心點。左／右／前／後以原模板為準，跟隨旋轉與鏡像；X+ 往右、Y+ 往前。不是開孔。</p>
                <div className="sm-actions"><button disabled={shape.references.length>=30} onClick={() => editShape(s => { s.references.push(newReference('sink', project.unit)) })}>＋ Sink</button><button disabled={shape.references.length>=30} onClick={() => editShape(s => { s.references.push(newReference('cooktop', project.unit)) })}>＋ Cooktop</button></div>
                {shape.references.map(ref => <div className="sm-reference-editor" key={ref.id}><div className="sm-row"><strong>{ref.kind === 'sink' ? 'Sink 水槽' : 'Cooktop 爐具'}</strong><button aria-label="移除定位參考" onClick={() => editShape(s => { s.references = s.references.filter(r => r.id !== ref.id) })}>移除</button></div>
                  <label>定位基準 <select aria-label="定位基準" value={ref.basis} onChange={e => editShape(s => { s.references.find(r=>r.id===ref.id)!.basis=e.target.value as 'cabinet'|'countertop' })}><option value="countertop">Countertop 成品外框</option><option value="cabinet">Cabinet 櫃體外框</option></select></label>
                  <div className="sm-row"><label>X 從 <select aria-label="X 量測方向" value={ref.fromX} onChange={e=>editShape(s=>{s.references.find(r=>r.id===ref.id)!.fromX=e.target.value as 'left'|'right'})}><option value="left">左端</option><option value="right">右端</option></select></label><label>Y 從 <select aria-label="Y 量測方向" value={ref.fromY} onChange={e=>editShape(s=>{s.references.find(r=>r.id===ref.id)!.fromY=e.target.value as 'back'|'front'})}><option value="back">後側</option><option value="front">前側</option></select></label></div>
                  <div className="sm-fields">{(['x','y'] as const).map(axis=><QuantityField key={axis} label={(ref.kind==='sink'?'Sink':'Cooktop')+' '+axis.toUpperCase()} quantity={ref[axis]} unit={project.unit} onEnd={end} onChange={q=>editShape(s=>{s.references.find(r=>r.id===ref.id)![axis]=q},ref.id+axis)} />)}</div>
                </div>)}
              </section>
              <section className="sm-input-section"><h2>4 · 現場備註</h2><label htmlFor="sm-notes">形狀備註</label><textarea id="sm-notes" maxLength={4000} value={shape.notes} placeholder="Backsplash、牆面、特殊施工細節…" onChange={e=>editShape(s=>{s.notes=e.target.value},'shape-notes')} onBlur={end} />
                <label htmlFor="sm-area-notes">區域備註</label><textarea id="sm-area-notes" maxLength={4000} value={area.notes} onChange={e=>edit(p=>{p.areas.find(a=>a.id===area.id)!.notes=e.target.value},'area-notes')} onBlur={end} />
              </section>
              <details className="sm-remove"><summary>移除這個形狀</summary><p>可使用 Undo 復原。</p><button onClick={()=>{edit(p=>{const a=p.areas.find(a=>a.id===area.id)!;a.shapes=a.shapes.filter(s=>s.id!==shape.id)});setShapeId(null)}}>確認移除 {shape.name}</button></details>
            </> : <div className="sm-inspector-empty"><h2>新增一個形狀</h2><p>先選 Rectangle 或 L-shape，所有尺寸由你輸入，不填猜測值。</p></div>}
          </aside>
        </div>
      </> : null}
      <footer className="sm-footnote">工程只保存在此瀏覽器，請定期下載工程備份。圖面為量尺記錄；幾何完整不代表加工核准。</footer>
    </>}
  </div>
}
