'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CadViewer, MeasureEvent } from '@cadview/core'
import styles from './viewer.module.css'

type DrawingFormat = 'DXF' | 'DWG' | 'PDF'
type LayerItem = { name: string; visible: boolean }
type Theme = 'dark' | 'light'

function getFormat(file: File): DrawingFormat | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'dxf') return 'DXF'
  if (extension === 'dwg') return 'DWG'
  if (extension === 'pdf') return 'PDF'
  return null
}

function humanSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// DXF $INSUNITS is the authoritative declared drawing unit; never assume
// inches/mm when a file does not declare a recognised unit.
function formatDistance(distance: number, insUnits: number) {
  const mmPerUnit: Record<number, number> = {
    1: 25.4, // inches
    2: 304.8, // feet
    4: 1, // mm
    5: 10, // cm
    6: 1000, // metres
  }
  const factor = mmPerUnit[insUnits]
  if (!factor) return `${distance.toFixed(3)} drawing units (units unknown)`
  const mm = distance * factor
  return `${(mm / 25.4).toFixed(3)} in / ${mm.toFixed(2)} mm`
}

export default function DrawingViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const viewerRef = useRef<CadViewer | null>(null)
  const pdfUrlRef = useRef<string | null>(null)
  const measureModeRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<MeasureEvent | null>(null)
  const [insUnits, setInsUnits] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [name, setName] = useState('')
  const [format, setFormat] = useState<DrawingFormat | null>(null)
  const [size, setSize] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerItem[]>([])
  const [showLayers, setShowLayers] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')
  const [message, setMessage] = useState('Choose a file on your device. Nothing is uploaded.')
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // @cadview/core currently handles both touch *and* pointer events for the
    // same fingers. This causes duplicate pan during pinch-to-zoom on iOS.
    // Handle ALL touch pointers here, blocking the engine's overlapping legacy
    // touch handlers. Keep the engine's mouse/trackpad handling unchanged.
    type TouchPointer = {
      startX: number
      startY: number
      x: number
      y: number
      moved: boolean
      multiTouch: boolean
    }
    const pointers = new Map<number, TouchPointer>()
    const stopLegacyTouch = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault()
      event.stopImmediatePropagation()
    }
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      const multiTouch = pointers.size > 0
      if (multiTouch) {
        for (const touch of pointers.values()) touch.multiTouch = true
      }
      pointers.set(event.pointerId, {
        startX: event.clientX, startY: event.clientY,
        x: event.clientX, y: event.clientY,
        moved: false, multiTouch,
      })
      event.stopImmediatePropagation()
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      // Always suppress the engine's pointer handling for touch, even after a
      // canceled gesture, or its own pan would be applied a second time.
      event.stopImmediatePropagation()
      const touch = pointers.get(event.pointerId)
      if (!touch) return
      const viewer = viewerRef.current
      const previous = [...pointers.values()].map(pointer => ({ x: pointer.x, y: pointer.y }))
      const dx = event.clientX - touch.x
      const dy = event.clientY - touch.y
      touch.x = event.clientX
      touch.y = event.clientY
      if (Math.hypot(touch.x - touch.startX, touch.y - touch.startY) > 10) touch.moved = true
      if (!viewer) return

      if (pointers.size === 1) {
        // Drag with one finger, including in Measure mode. A stationary tap
        // continues to select a measurement point on pointerup.
        if (touch.moved) viewer.handlePan(dx, dy)
      } else if (pointers.size === 2) {
        const current = [...pointers.values()]
        const oldDistance = Math.hypot(previous[0].x - previous[1].x, previous[0].y - previous[1].y)
        const newDistance = Math.hypot(current[0].x - current[1].x, current[0].y - current[1].y)
        if (oldDistance < 2 || newDistance < 2) return
        const rect = canvas.getBoundingClientRect()
        const oldX = (previous[0].x + previous[1].x) / 2 - rect.left
        const oldY = (previous[0].y + previous[1].y) / 2 - rect.top
        const newX = (current[0].x + current[1].x) / 2 - rect.left
        const newY = (current[0].y + current[1].y) / 2 - rect.top
        // Zoom about the PREVIOUS centroid, then translate by its motion.
        // This keeps the same CAD point underneath the fingers as they spread.
        viewer.handleZoom(oldX, oldY, newDistance / oldDistance)
        viewer.handlePan(newX - oldX, newY - oldY)
      }
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      event.stopImmediatePropagation()
      const touch = pointers.get(event.pointerId)
      pointers.delete(event.pointerId)
      if (touch && !touch.moved && !touch.multiTouch && measureModeRef.current) {
        const rect = canvas.getBoundingClientRect()
        viewerRef.current?.handleClick(event.clientX - rect.left, event.clientY - rect.top)
      }
    }
    const onCancel = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      pointers.delete(event.pointerId)
      event.stopImmediatePropagation()
    }
    canvas.addEventListener('pointerdown', onDown, true)
    canvas.addEventListener('pointermove', onMove, true)
    canvas.addEventListener('pointerup', onUp, true)
    canvas.addEventListener('pointercancel', onCancel, true)
    canvas.addEventListener('touchstart', stopLegacyTouch, { capture: true, passive: false })
    canvas.addEventListener('touchmove', stopLegacyTouch, { capture: true, passive: false })
    canvas.addEventListener('touchend', stopLegacyTouch, { capture: true, passive: false })
    canvas.addEventListener('touchcancel', stopLegacyTouch, { capture: true, passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onDown, true)
      canvas.removeEventListener('pointermove', onMove, true)
      canvas.removeEventListener('pointerup', onUp, true)
      canvas.removeEventListener('pointercancel', onCancel, true)
      canvas.removeEventListener('touchstart', stopLegacyTouch, true)
      canvas.removeEventListener('touchmove', stopLegacyTouch, true)
      canvas.removeEventListener('touchend', stopLegacyTouch, true)
      canvas.removeEventListener('touchcancel', stopLegacyTouch, true)
      viewerRef.current?.destroy()
      viewerRef.current = null
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!fullScreen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => {
      viewerRef.current?.resize()
      viewerRef.current?.fitToView()
    })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullScreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener('keydown', onKeyDown)
      cancelAnimationFrame(frame)
      requestAnimationFrame(() => viewerRef.current?.resize())
    }
  }, [fullScreen])

  async function ensureViewer(): Promise<CadViewer> {
    if (viewerRef.current) return viewerRef.current
    const canvas = canvasRef.current
    if (!canvas) throw new Error('The drawing viewport is not available.')
    // Only fetch the DXF engine when a CAD drawing is opened; PDF stays native.
    const { CadViewer: Engine } = await import('@cadview/core')
    const viewer = new Engine(canvas, { theme, initialTool: 'pan' })
    viewer.on('measure', result => setMeasurement(result))
    viewerRef.current = viewer
    return viewer
  }

  const releasePdf = useCallback(() => {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
    pdfUrlRef.current = null
    setPdfUrl(null)
  }, [])

  const reset = useCallback(() => {
    releasePdf()
    viewerRef.current?.clearDocument()
    viewerRef.current?.setTool('pan')
    measureModeRef.current = false
    setMeasuring(false)
    setMeasurement(null)
    setInsUnits(0)
    setFullScreen(false)
    setName('')
    setFormat(null)
    setSize('')
    setLayers([])
    setShowLayers(false)
    setError('')
    setMessage('Choose a file on your device. Nothing is uploaded.')
    if (inputRef.current) inputRef.current.value = ''
  }, [releasePdf])

  async function openFile(file: File) {
    if (busy) return
    const kind = getFormat(file)
    if (!kind) {
      setError('Unsupported format. Please choose a DXF, DWG or PDF file.')
      return
    }
    setBusy(true)
    setError('')
    setShowLayers(false)
    measureModeRef.current = false
    setMeasuring(false)
    setMeasurement(null)
    setInsUnits(0)
    viewerRef.current?.setTool('pan')
    setMessage(kind === 'DWG' ? 'Converting DWG locally on this device…' : 'Opening drawing…')

    try {
      if (kind === 'PDF') {
        viewerRef.current?.clearDocument()
        releasePdf()
        const url = URL.createObjectURL(file)
        pdfUrlRef.current = url
        setPdfUrl(url)
        setLayers([])
        setMessage('PDF preview. Use “Open PDF” if the preview is limited on iPhone.')
      } else {
        releasePdf()
        const viewer = await ensureViewer()
        viewer.clearDocument()

        if (kind === 'DWG') {
          // Keep the DWG module outside the normal DXF/PDF download path.
          // Self-hosted WASM files keep the original drawing on this device.
          const moduleUrl = `${window.location.origin}/cad-viewer-wasm/dwgdxf.js`
          const converter = await import(/* webpackIgnore: true */ moduleUrl) as {
            default: (args: { module_or_path: string }) => Promise<unknown>
            convertDwgToDxf: (input: Uint8Array) => Uint8Array
          }
          await converter.default({ module_or_path: `${window.location.origin}/cad-viewer-wasm/dwgdxf_bg.wasm` })
          const converted = converter.convertDwgToDxf(new Uint8Array(await file.arrayBuffer()))
          if (!converted.length) throw new Error('DWG conversion produced an empty drawing.')
          const dxf = new File([new Uint8Array(converted)], 'converted.dxf', { type: 'application/dxf' })
          await viewer.loadFile(dxf)
        } else {
          await viewer.loadFile(file)
        }

        if (!viewer.getEntities().length) {
          throw new Error('No supported drawing entities were found in this file.')
        }
        viewer.resize()
        viewer.fitToView()
        setInsUnits(viewer.getDocument()?.header.insUnits ?? 0)
        setLayers(viewer.getLayers().map(layer => ({
          name: layer.name,
          visible: !layer.isOff && !layer.isFrozen,
        })))
        setMessage(kind === 'DWG'
          ? 'DWG converted locally. Some CAD objects, fonts or dimensions may differ.'
          : 'DXF loaded. Check the original CAD file for critical dimensions.')
      }

      setName(file.name)
      setSize(humanSize(file.size))
      setFormat(kind)
    } catch (reason) {
      viewerRef.current?.clearDocument()
      releasePdf()
      setLayers([])
      setName('')
      setFormat(null)
      setMessage('Unable to open this file.')
      setError(reason instanceof Error ? reason.message : 'An unexpected file error occurred.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function toggleLayer(name: string, visible: boolean) {
    viewerRef.current?.setLayerVisible(name, visible)
    setLayers(current => current.map(layer => layer.name === name ? { ...layer, visible } : layer))
  }

  function changeTheme(next: Theme) {
    setTheme(next)
    viewerRef.current?.setTheme(next)
  }

  function toggleMeasure() {
    const next = !measuring
    measureModeRef.current = next
    viewerRef.current?.setTool(next ? 'measure' : 'pan')
    setMeasuring(next)
    setMeasurement(null)
  }

  return (
    <div className={`${styles.root} ${fullScreen ? styles.fullscreenRoot : ''}`}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Work / Drawing tools</p>
          <h1 className={styles.title}>Drawing Viewer</h1>
          <p className={styles.subtitle}>DXF · DWG · PDF — View drawings without installing an app.</p>
        </div>
        <div className={styles.actions}>
          <input
            ref={inputRef}
            type="file"
            className={styles.fileInput}
            aria-label="Choose a drawing file"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) void openFile(file)
            }}
          />
          <button
            type="button"
            className={styles.openButton}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Opening…' : 'Open file'}
          </button>
          {format && <button type="button" className={styles.secondaryButton} onClick={reset} disabled={busy}>Close</button>}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.fileDetails}>
          {format ? (
            <><span className={styles.badge}>{format}</span><strong title={name}>{name}</strong><span>{size}</span></>
          ) : (
            <><span className={styles.badge}>LOCAL</span><span>No file selected</span></>
          )}
        </div>
        <div className={styles.controls}>
          {format && format !== 'PDF' && (
            <>
              <button type="button" onClick={() => viewerRef.current?.fitToView()} disabled={busy}>{fullScreen ? 'Fit' : 'Fit all'}</button>
              <button type="button" className={measuring ? styles.activeTool : ''} aria-pressed={measuring} onClick={toggleMeasure} disabled={busy}>
                {measuring ? '✓ Measure' : 'Measure'}
              </button>
              <button
                type="button"
                aria-expanded={showLayers}
                onClick={() => setShowLayers(value => !value)}
                disabled={busy}
              >Layers ({layers.length})</button>
              <button type="button" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')} disabled={busy}>
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </>
          )}
          {format === 'PDF' && pdfUrl && (
            <a className={styles.pdfLink} href={pdfUrl} target="_blank" rel="noopener noreferrer">Open PDF ↗</a>
          )}
          {format && (
            <button type="button" aria-pressed={fullScreen} onClick={() => setFullScreen(current => !current)} disabled={busy}>
              {fullScreen ? 'Exit' : 'Full screen'}
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.viewerFrame}
        onDragOver={event => { event.preventDefault(); setDragging(true) }}
        onDragLeave={event => { event.preventDefault(); setDragging(false) }}
        onDrop={event => {
          event.preventDefault()
          setDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) void openFile(file)
        }}
      >
        <div className={`${styles.canvasSurface} ${theme === 'light' ? styles.lightSurface : ''}`}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="CAD drawing viewport" />
        </div>
        {format === 'PDF' && pdfUrl && (
          <iframe className={styles.pdfFrame} title={`PDF: ${name}`} src={pdfUrl} />
        )}
        {!format && (
          <div className={`${styles.emptyState} ${dragging ? styles.dropActive : ''}`}>
            <div className={styles.emptyIcon} aria-hidden="true">⌗</div>
            <h2>{busy ? 'Reading your drawing…' : 'Your drawing, ready when you are.'}</h2>
            <p>Open a DXF, DWG or PDF from Files, or drop one here.</p>
            <p className={styles.emptyHint}>Tap Open file above to get started.</p>
          </div>
        )}
        {busy && <div className={styles.busyOverlay} role="status">Processing on your device…</div>}
        {format && format !== 'PDF' && measuring && (
          <div className={styles.measureOverlay} role="status" aria-live="polite">
            <strong>{measurement ? formatDistance(measurement.distance, insUnits) : 'Measure: tap two points'}</strong>
            <span>{measurement ? 'Tap again to start a new measurement.' : 'Snap to corners for exact values. Drag to pan · pinch to zoom.'}</span>
          </div>
        )}
        {showLayers && format && format !== 'PDF' && (
          <aside className={styles.layerPanel} aria-label="Drawing layers">
            <div className={styles.layerHeader}>
              <strong>Layers</strong>
              <button type="button" onClick={() => setShowLayers(false)} aria-label="Close layers">×</button>
            </div>
            {layers.length === 0 ? <p>No named layers</p> : (
              <div className={styles.layerList}>
                {layers.map(layer => (
                  <label key={layer.name} className={styles.layerItem}>
                    <input type="checkbox" checked={layer.visible} onChange={event => toggleLayer(layer.name, event.target.checked)} />
                    <span>{layer.name}</span>
                  </label>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <div className={styles.status} aria-live="polite">
        <span className={styles.statusDot} aria-hidden="true" />
        <span>{message}</span>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.safetyNote}>
        Read-only · Your files stay on this device. Some DWG/DXF fonts, dimensions and unsupported entities may not display exactly as in CAD.
        Do not use this preview alone for fabrication or CNC cutting.
      </p>
    </div>
  )
}
