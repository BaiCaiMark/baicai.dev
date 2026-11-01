import test from 'node:test'
import assert from 'node:assert/strict'
import { parseLength, numeric } from '../../app/tools/site-measure/core/units'
import { applyDefault, edgeOrder, importCopy, newShape, parseBackup, quantity, sampleProject, setBasis, value } from '../../app/tools/site-measure/core/model'
import { area, bounds, calculate, exportSnapshot, offsetOrthogonal, referenceGeometry, transformPoint, validPolygon } from '../../app/tools/site-measure/core/geometry'
import { historyReducer, initialHistory } from '../../app/tools/site-measure/core/history'

for (const [text, unit, expected] of [['60', 'in', 1524], ['22.5', 'in', 571.5], ['22 1/2', 'in', 571.5], ['30', 'in', 762], ['1/16', 'in', 1.5875], ['.5', 'mm', 0.5], ['0', 'in', 0]] as const) {
  test('parse ' + text + ' ' + unit, () => assert.ok(Math.abs(parseLength(text, unit)! - expected) < 1e-7))
}
for (const input of ['', ' ', '-1', 'Infinity', 'NaN', '1e3', '1/0', '22 3/2', '1foo', '1,234', '100001']) {
  test('reject input ' + JSON.stringify(input), () => assert.equal(parseLength(input, 'mm'), null))
}
test('inch fractions reject zero denominator and improper fractions', () => {
  for (const s of ['1/0', '3/2', '22 2/0', '22 3/2']) assert.equal(parseLength(s, 'in'), null)
})
test('unknown is not zero', () => { assert.equal(value(quantity()), null); assert.equal(value(quantity('0')), 0) })
test('finished rectangle exactly 1524 by 571.5', () => {
  const s = newShape('rectangle', 'in'); s.basis = 'finished'
  s.dimensions.width = quantity('60'); s.dimensions.height = quantity('22 1/2')
  const g = calculate(s); assert.deepEqual(bounds(g.top!), { x: 0, y: 0, width: 1524, height: 571.5 })
  assert.equal(g.top!.length, 4); assert.ok(validPolygon(g.top!))
})
test('cabinet plus allowances and provenance', () => {
  const p = sampleProject(), s = p.areas[1].shapes[0], g = calculate(s)
  assert.ok(Math.abs(bounds(g.top!).width - 1524) < 1e-6); assert.ok(Math.abs(bounds(g.top!).height - 571.5) < 1e-6)
  assert.equal(s.dimensions.width.origin, 'measured'); assert.equal(s.allowances.right.origin, 'default')
  s.allowances.right.status = 'confirmed'; assert.equal(s.allowances.right.origin, 'default')
})
test('missing allowance does not become zero', () => {
  const s = sampleProject().areas[1].shapes[0]; s.allowances.back = quantity('')
  const g = calculate(s); assert.equal(g.top, null); assert.ok(g.base); assert.match(g.errors.join(), /unknown/)
})
test('blank or invalid dimension cannot produce an outline', () => {
  const s = sampleProject().areas[1].shapes[0]
  for (const text of ['', '0', '-10', 'garbage']) { s.dimensions.width = quantity(text); assert.equal(calculate(s).top, null) }
})
test('project defaults are stable snapshots', () => {
  const p = sampleProject(); const s = applyDefault(p.areas[1].shapes[0], 'right', p, 'end')
  const before = calculate(s).top
  p.defaults.end.input = '8'; p.defaults.revision++
  assert.equal(value(s.allowances.right), 25.4); assert.deepEqual(calculate(s).top, before)
  assert.equal(value(applyDefault(s, 'right', p, 'end').allowances.right), 203.2)
})
test('finished mode never adds retained cabinet allowances', () => {
  const s = sampleProject().areas[1].shapes[0]; s.basis = 'finished'
  assert.equal(bounds(calculate(s).top!).width, 59 * 25.4)
})
test('L has six valid edges and known area', () => {
  const s = sampleProject().areas[0].shapes[1], g = calculate(s)
  const w = 96 * 25.4, h = 72 * 25.4, a = 25.5 * 25.4, b = a
  assert.equal(g.top!.length, 6); assert.ok(validPolygon(g.top!))
  assert.ok(Math.abs(area(g.top!) - (w * a + b * (h - a))) < 1e-6)
})
test('incomplete and contradictory L dimensions rejected', () => {
  const s = sampleProject().areas[0].shapes[1]
  s.dimensions.legX = quantity(''); assert.equal(calculate(s).top, null)
  s.dimensions.legX = quantity('72'); assert.equal(calculate(s).top, null)
  s.dimensions.legX = quantity('80'); assert.equal(calculate(s).top, null)
})
test('L six independent allowances preserve edge identities', () => {
  const s = sampleProject().areas[0].shapes[1]; s.basis = 'cabinet'
  edgeOrder(s).forEach(e => { s.allowances[e] = quantity('0', 'mm', 'allowance') })
  s.allowances.innerX = quantity('38.1', 'mm', 'allowance')
  s.allowances.right = quantity('25.4', 'mm', 'allowance')
  const g = calculate(s)
  assert.ok(g.top); assert.ok(validPolygon(g.top!))
  assert.ok(Math.abs(g.top![1].x - 97 * 25.4) < 1e-6)
  assert.ok(Math.abs(g.top![2].y - (25.5 * 25.4 + 38.1)) < 1e-7)
  assert.equal(s.allowances.innerX.input, '38.1')
})
test('unsupported topology change rejected', () => {
  const s = sampleProject().areas[0].shapes[1]; s.basis = 'cabinet'
  edgeOrder(s).forEach(e => { s.allowances[e] = quantity('0', 'mm', 'allowance') })
  s.allowances.innerY = quantity('10000', 'mm', 'allowance')
  assert.equal(calculate(s).top, null)
})
test('invalid polygons and zero edges rejected', () => {
  assert.equal(validPolygon([{x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}]), false)
  assert.equal(validPolygon([{x:0,y:0},{x:0,y:0},{x:10,y:10},{x:0,y:10}]), false)
  assert.equal(offsetOrthogonal([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}], [0,0,0,0])!.length, 4)
})
for (const rotation of [0, 90, 180, 270] as const) for (const mirrored of [false, true]) {
  test('rotation/mirror preserves lengths ' + rotation + '/' + mirrored, () => {
    const s = sampleProject().areas[0].shapes[1], points = calculate(s).top!
    const transformed = points.map(p => transformPoint(p, {rotation, mirrored}))
    assert.ok(Math.abs(Math.abs(area(transformed)) - area(points)) < 1e-6)
    points.forEach((p,i) => {
      const q=points[(i+1)%points.length], a=transformed[i],b=transformed[(i+1)%points.length]
      assert.ok(Math.abs(Math.hypot(q.x-p.x,q.y-p.y)-Math.hypot(b.x-a.x,b.y-a.y))<1e-7)
    })
  })
}
test('sink X only creates reference line, no center point or Y', () => {
  const s = sampleProject().areas[1].shapes[0], g = calculate(s), r = referenceGeometry(s.references[0], s, g)
  assert.equal(r.point, null); assert.equal(r.lines[0].a.x, 762); assert.equal(r.lines[0].b.x, 762)
  assert.match(r.warnings.join(), /Y unknown/)
})
test('reference supports right/front direction and cabinet basis', () => {
  const s = sampleProject().areas[1].shapes[0], r = s.references[0]
  r.fromX = 'right'; r.fromY = 'front'; r.y = quantity('5'); r.basis = 'cabinet'
  const g = referenceGeometry(r, s, calculate(s))
  assert.equal(g.point!.x, (59-30)*25.4); assert.equal(g.point!.y, (21-5)*25.4)
})
test('reference out of outline does not fabricate a center', () => {
  const s=sampleProject().areas[0].shapes[1], r=sampleProject().areas[1].shapes[0].references[0]
  r.x=quantity('80');r.y=quantity('60')
  const rg=referenceGeometry(r,s,calculate(s));assert.equal(rg.point,null);assert.match(rg.warnings.join(),/outside/)
})
test('unit display does not mutate source or geometry', () => {
  const p=sampleProject(), before=JSON.stringify(p), s=p.areas[1].shapes[0], g=calculate(s).top
  for(let n=0;n<100;n++) numeric(value(s.dimensions.width)!, n%2?'in':'mm')
  assert.equal(JSON.stringify(p),before);assert.deepEqual(calculate(s).top,g)
})
test('project backup validates and preserves original input and provenance', () => {
  const p=sampleProject();assert.deepEqual(parseBackup(JSON.stringify(p)),p)
  const imported=importCopy(p);assert.notEqual(imported.id,p.id);assert.equal(p.name,'示範工程 · Sample only')
})
test('import rejects malformed, future version, duplicate ids and excessive file', () => {
  assert.throws(()=>parseBackup('{bad'));assert.throws(()=>parseBackup(JSON.stringify({...sampleProject(),schemaVersion:999})))
  const p=sampleProject();p.areas[0].id=p.id;assert.throws(()=>parseBackup(JSON.stringify(p)))
  assert.throws(()=>parseBackup(' '.repeat(5_000_001)))
})
test('snapshot stays fixed after subsequent editing', () => {
  const p=sampleProject(), shot=exportSnapshot(p);p.areas[1].shapes[0].dimensions.width.input='12'
  assert.equal(shot.entries[2].shape.dimensions.width.input,'59')
})
test('undo/redo groups typing, increments revisions, preserves semantics', () => {
  let h=historyReducer(initialHistory,{type:'load',project:sampleProject()})
  for(const input of ['6','60']) h=historyReducer(h,{type:'edit',group:'width',recipe:p=>{p.areas[1].shapes[0].dimensions.width.input=input}})
  assert.equal(h.past.length,1);h=historyReducer(h,{type:'undo'})
  assert.equal(h.present!.areas[1].shapes[0].dimensions.width.input,'59');assert.equal(h.present!.revision,3)
  h=historyReducer(h,{type:'redo'});assert.equal(h.present!.areas[1].shapes[0].dimensions.width.input,'60')
})


test('basis switching retains measurements and blocks contradictory finished geometry',()=>{
  const s=sampleProject().areas[1].shapes[0]
  setBasis(s,'finished');assert.equal(s.dimensions.width.input,'');assert.equal(s.alternateDimensions.width.input,'59')
  s.dimensions.width=quantity('61');s.dimensions.height=quantity('22.5')
  assert.equal(calculate(s).top,null);assert.match(calculate(s).errors.join(),/conflicts/)
  s.dimensions.width=quantity('60');assert.ok(calculate(s).top)
  setBasis(s,'cabinet');assert.equal(s.dimensions.width.input,'59');assert.ok(calculate(s).top)
})
test('unit marks cannot silently change millimeter input or concatenate digits',()=>{
  assert.equal(parseLength('60"','mm'),null)
  assert.equal(parseLength('1"2','in'),null)
  assert.equal(parseLength('60"','in'),1524)
})
