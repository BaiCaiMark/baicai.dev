'use client'
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { bounds, calculate, referenceGeometry, transformPoint, type Bounds, type Point } from '../core/geometry'
import { edgeOrder, requiredParams, value, type Area, type Param, type Shape } from '../core/model'
import { formatLength, type Unit } from '../core/units'

type Props = { area: Area; selected: string | null; unit: Unit; onSelect: (id: string) => void; onDimension: (id: string, key: Param) => void }
type Touch = { x: number; y: number }
const path = (points: Point[]) => points.map((p, i) => (i ? 'L' : 'M') + p.x + ',' + p.y).join(' ') + ' Z'
function arrangeShapes(shapes: Shape[]) {
  let y = 600
  const result = []
  for (const shape of shapes) {
    const g = calculate(shape), points = g.top ?? g.base
    const bb = points ? bounds(points.map(p => transformPoint(p, shape))) : { x: 0, y: 0, width: 1000, height: 500 }
    result.push({ shape, g, bb, x: 240 - bb.x, y: y - bb.y })
    y += bb.height + 600
  }
  return result
}
export default function MeasureCanvas({ area, selected, unit, onSelect, onDimension }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, Touch>())
  const gesture = useRef<{ center: Touch; distance: number; box: Bounds } | null>(null)
  const start = useRef<{ x: number; y: number; shape: string | null; param: Param | null } | null>(null)
  const moved = useRef(false)
  const [manual, setManual] = useState<Bounds | null>(null)
  const layout = useMemo(() => arrangeShapes(area.shapes), [area.shapes])
  const fitted = useMemo(() => {
    if (!layout.length) return { x: 0, y: 0, width: 2200, height: 1500 }
    const width = Math.max(...layout.map(i => i.bb.width)) + 600
    const height = layout.reduce((a, i) => a + i.bb.height + 600, 600)
    return { x: 0, y: 0, width, height }
  }, [layout])
  const liveBox = useRef(fitted)
  const center = () => {
    const touches = [...pointers.current.values()]
    return {
      center: { x: touches.reduce((s, p) => s + p.x, 0) / touches.length, y: touches.reduce((s, p) => s + p.y, 0) / touches.length },
      distance: touches.length > 1 ? Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y) : 0,
    }
  }
  const resetGesture = () => { gesture.current = pointers.current.size ? { ...center(), box: liveBox.current } : null }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      const target = e.target as Element
      start.current = { x: e.clientX, y: e.clientY, shape: target.closest('[data-shape]')?.getAttribute('data-shape') ?? null, param: target.closest('[data-param]')?.getAttribute('data-param') as Param | null }
      moved.current = false
    } else moved.current = true
    resetGesture()
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const base = gesture.current, now = center(), rect = e.currentTarget.getBoundingClientRect()
    if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 7) moved.current = true
    const ratio = base.distance > 0 && now.distance > 0 ? base.distance / now.distance : 1
    const width = Math.min(200_000, Math.max(100, base.box.width * ratio))
    const factor = width / base.box.width, height = base.box.height * factor
    // preserveAspectRatio=none gives an exact mapping; the viewBox is aspect-fitted below.
    const anchorX = base.box.x + (base.center.x - rect.left) / rect.width * base.box.width
    const anchorY = base.box.y + (base.center.y - rect.top) / rect.height * base.box.height
    const next = { x: anchorX - (now.center.x - rect.left) / rect.width * width, y: anchorY - (now.center.y - rect.top) / rect.height * height, width, height }
    liveBox.current = next; setManual(next)
  }
  const up = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (e.type !== 'pointercancel' && !moved.current && start.current?.shape) {
      onSelect(start.current.shape)
      if (start.current.param) onDimension(start.current.shape, start.current.param)
    }
    resetGesture()
  }
  // SVG meet preserves true proportions. Client coordinates are converted with its inverse CTM.
  // Fit viewBox uses the physical container ratio to avoid letterbox gesture drift.
  const [ratio, setRatio] = useState(1.4)
  const fit = { ...fitted }
  if (fit.width / fit.height < ratio) { const w = fit.height * ratio; fit.x -= (w - fit.width) / 2; fit.width = w }
  else { const h = fit.width / ratio; fit.y -= (h - fit.height) / 2; fit.height = h }
  const effective = manual ?? fit
  useLayoutEffect(() => { liveBox.current = effective }, [effective])
  const zoom = (factor: number) => {
    const b = liveBox.current, w = Math.min(200000, Math.max(100, b.width * factor)), h = b.height * w / b.width
    setManual({ x: b.x + (b.width - w) / 2, y: b.y + (b.height - h) / 2, width: w, height: h })
  }
  const observer = useRef<ResizeObserver | null>(null)
  return <div className="sm-canvas-shell" ref={node => {
    observer.current?.disconnect()
    if (node) { const measure = () => setRatio(node.clientWidth / Math.max(node.clientHeight, 1)); measure(); observer.current = new ResizeObserver(measure); observer.current.observe(node) }
    return () => observer.current?.disconnect()
  }}>
    <div className="sm-canvas-tools">
      <button type="button" onClick={() => zoom(0.8)} aria-label="放大">＋</button>
      <button type="button" onClick={() => zoom(1.25)} aria-label="縮小">−</button>
      <button type="button" onClick={() => setManual(null)}>Fit All</button>
      <span>點尺寸編輯 · 拖空白平移 · 雙指縮放</span>
    </div>
    <svg ref={svg} className="sm-canvas" role="img" aria-label={area.name + ' 量尺畫布'} viewBox={effective.x + ' ' + effective.y + ' ' + effective.width + ' ' + effective.height}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
>
      {layout.map(({ shape, g, bb, x, y }) => {
        const toView = (p: Point) => { const t = transformPoint(p, shape); return { x: t.x + x, y: t.y + y } }
        const labelSize = effective.width / 54
        const title = { x: bb.x + x, y: bb.y + y - labelSize * 3 }
        const originalW = value(shape.dimensions.width) ?? 1000, originalH = value(shape.dimensions.height) ?? 500
        const anchors: Record<Param, Point> = {
          width: { x: originalW / 2, y: -labelSize * 1.2 }, height: { x: originalW + labelSize * 1.2, y: originalH / 2 },
          legX: { x: originalW + labelSize * 1.2, y: (value(shape.dimensions.legX) ?? 250) / 2 },
          legY: { x: (value(shape.dimensions.legY) ?? 250) / 2, y: originalH + labelSize * 1.2 },
        }
        return <g key={shape.id} data-shape={shape.id} role="button" tabIndex={0} aria-label={'選取 ' + shape.name}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(shape.id) } }}>
          <text x={title.x} y={title.y} fontSize={labelSize} className="sm-shape-title">{shape.name}{g.top ? '' : ' · 未完成'}</text>
          {g.base && shape.basis === 'cabinet' ? <path d={path(g.base.map(toView))} className="sm-cabinet" /> : null}
          {g.top ? <path d={path(g.top.map(toView))} className="sm-top" data-selected={selected === shape.id} /> : null}
          {!g.top ? <text x={title.x} y={title.y + 75} fontSize={labelSize * 0.8} className="sm-placeholder">待量：{g.errors[0]}</text> : null}
          {g.top ? edgeOrder(shape).map((edge, i) => {
            const a = toView(g.top![i]), b = toView(g.top![(i + 1) % g.top!.length])
            return <text key={edge} x={(a.x + b.x) / 2 + 10} y={(a.y + b.y) / 2 + labelSize} fontSize={labelSize * 0.65} className="sm-edge-label">{({back:'E1',right:'E2',front:'E3',left:'E4',innerX:'E5',innerY:'E6'})[edge]}</text>
          }) : null}
          {g.top && (shape.rotation !== 0 || shape.mirrored) ? (() => {
            const o=toView({x:0,y:0}),a=toView({x:labelSize*2,y:0}),b=toView({x:0,y:labelSize*2})
            return <g className="sm-reference"><line x1={o.x} y1={o.y} x2={a.x} y2={a.y}/><line x1={o.x} y1={o.y} x2={b.x} y2={b.y}/><text x={a.x+8} y={a.y+labelSize*.7} fontSize={labelSize*.7}>X+</text><text x={b.x+8} y={b.y+labelSize*.7} fontSize={labelSize*.7}>Y+</text></g>
          })() : null}
          {g.top ? shape.references.map(ref => {
            const rg = referenceGeometry(ref, shape, g)
            return <g key={ref.id} className="sm-reference">
              {rg.lines.map((l, i) => { const a=toView(l.a),b=toView(l.b);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> })}
              {rg.point ? <circle cx={toView(rg.point).x} cy={toView(rg.point).y} r={labelSize / 5} /> : null}
              {rg.lines[0] ? <text x={toView(rg.lines[0].a).x + 15} y={toView(rg.lines[0].a).y + labelSize} fontSize={labelSize * 0.65}>{ref.kind === 'sink' ? 'Sink' : 'Cooktop'}{value(ref.y) === null ? ' · Y 待量' : value(ref.x) === null ? ' · X 待量' : ''}</text> : null}
            </g>
          }) : null}
          {g.base ? requiredParams(shape).map(key => {
            const anchor = toView(anchors[key])
            return <text key={key} x={anchor.x} y={anchor.y} fontSize={labelSize} data-param={key} role="button" tabIndex={0}
              className="sm-dimension" aria-label={'編輯 ' + shape.name + ' ' + key} textAnchor="middle"
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onDimension(shape.id, key) } }}>
              {({width:'W',height:'H',legX:'A',legY:'B'})[key]} {formatLength(value(shape.dimensions[key]), unit)}
            </text>
          }) : null}
        </g>
      })}
    </svg>
    {!area.shapes.length ? <div className="sm-empty"><strong>從一塊檯面開始</strong><p>選 Rectangle 或 L-shape，再輸入量到的尺寸。</p></div> : null}
    <div className="sm-canvas-legend">實線：成品 · 灰虛線：櫃體 · 藍線：定位參考<br />排版位置不代表現場距離 · 尺寸以數值為準</div>
  </div>
}
