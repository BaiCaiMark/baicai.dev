import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const root=path.resolve('artifacts/site-measure')
const toolbar=(p:Page)=>p.getByRole('toolbar',{name:'Selected part actions'})
async function sample(p:Page){await p.goto('/tools/site-measure');await p.getByRole('button',{name:'Try sample Kitchen',exact:true}).click();await expect(p.locator('.sm-save-state')).toHaveText('Saved in this browser')}
async function backup(p:Page,name:string){const wait=p.waitForEvent('download');await p.getByRole('button',{name:'Backup',exact:true}).click();const file=path.join(root,name);await(await wait).saveAs(file);return JSON.parse(fs.readFileSync(file,'utf8'))}
async function interior(p:Page,name:string){
  const shape=p.getByRole('button',{name:'Part '+name,exact:true});await shape.scrollIntoViewIfNeeded()
  const point=await shape.evaluate(el=>{
    const s=el as SVGPathElement,b=s.getBBox(),m=s.getScreenCTM()!
    for(let y=1;y<10;y++)for(let x=1;x<10;x++){
      const local=new DOMPoint(b.x+b.width*x/10,b.y+b.height*y/10)
      if(!s.isPointInFill(local))continue
      const q=local.matrixTransform(m),hit=document.elementFromPoint(q.x,q.y)
      if(hit===el)return{x:q.x,y:q.y}
    }
    throw Error('No exposed interior for '+el.getAttribute('aria-label'))
  })
  await p.touchscreen.tap(point.x,point.y);if(await p.locator('.sm-quick-panel').count())await p.getByRole('button',{name:'Done',exact:true}).click();return point
}
async function edge(p:Page,part:string,name:string){
  const line=p.getByRole('button',{name:part+' '+name,exact:true}).locator('.sm-edge-hit')
  const q=await line.evaluate(el=>{const l=el as SVGLineElement,q=new DOMPoint((l.x1.baseVal.value+l.x2.baseVal.value)/2,(l.y1.baseVal.value+l.y2.baseVal.value)/2).matrixTransform(l.getScreenCTM()!);return{x:q.x,y:q.y}})
  await p.touchscreen.tap(q.x,q.y);await expect(p.locator('.sm-quick-panel')).toBeVisible();await p.getByRole('button',{name:/^More details/}).click();await expect(p.locator('.sm-context-heading h2')).toHaveText(name)
}
test('one scaled canvas: interior selection, move, correct transformed edge, duplicate, delete and Undo/Redo',async({page})=>{
  await sample(page);const before=await backup(page,'p3-before-actions.json')
  await expect(page.locator('svg.sm-canvas')).toHaveCount(1);await expect(page.locator('.sm-part-paper')).toHaveCount(0)
  const width=async(name:string)=>page.getByRole('button',{name:'Part '+name,exact:true}).evaluate(el=>{const p=el as SVGGraphicsElement;return p.getBBox().width*p.getScreenCTM()!.a})
  expect(await width('Kitchen L')/await width('Stove Left')).toBeCloseTo(4,5)
  const point=await interior(page,'Kitchen L');await expect(toolbar(page)).toBeVisible();await expect(page.locator('.sm-context')).toHaveCount(0)
  await toolbar(page).getByRole('button',{name:'Move',exact:true}).click()
  const view=await page.locator('svg.sm-canvas').getAttribute('viewBox')
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+65,point.y+35,{steps:8});await page.mouse.up()
  await expect(page.locator('svg.sm-canvas')).toHaveAttribute('viewBox',view!)
  const moved=await backup(page,'p3-moved.json')
  const {layout:oldLayout,...old}=before.areas[0].shapes[0],{layout:newLayout,...current}=moved.areas[0].shapes[0]
  expect(current).toEqual(old);expect(newLayout).not.toEqual(oldLayout)
  await toolbar(page).getByRole('button',{name:'Done moving',exact:true}).click()
  await toolbar(page).getByRole('button',{name:'Rotate',exact:true}).click();await toolbar(page).getByRole('button',{name:'Mirror',exact:true}).click()
  await page.getByRole('button',{name:'Fit All',exact:true}).click()
  await edge(page,'Kitchen L','Right end');await expect(page.locator('#sm-edge-measurement')).toHaveValue('25.5');await page.getByRole('button',{name:'Done',exact:true}).click()
  await edge(page,'Kitchen L','Inside horizontal run');await expect(page.locator('#sm-edge-measurement')).toHaveCount(0);await expect(page.locator('.sm-derived')).toContainText('70.5');await page.getByRole('button',{name:'Done',exact:true}).click()
  await toolbar(page).getByRole('button',{name:'Duplicate',exact:true}).click();await expect(page.locator('[data-shape]')).toHaveCount(4)
  const copied=await backup(page,'p3-duplicate.json'),parts=copied.areas[0].shapes,copy=parts[3]
  expect(copy.id).not.toBe(parts[0].id);expect(copy.dimensions).toEqual(parts[0].dimensions);expect(copy.fieldRecords[0].id).not.toBe(parts[0].fieldRecords[0].id)
  await edge(page,copy.name,'Back run');await page.locator('#sm-edge-measurement').fill('95');await page.getByRole('button',{name:'Done',exact:true}).click()
  const edited=await backup(page,'p3-independent-copy.json');expect(edited.areas[0].shapes[0].dimensions.width.input).toBe('96');expect(edited.areas[0].shapes[3].dimensions.width.input).toBe('95')
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await toolbar(page).getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('[data-shape]')).toHaveCount(4)
  await toolbar(page).getByRole('button',{name:'Cancel deletion',exact:true}).click();await toolbar(page).getByRole('button',{name:'Delete',exact:true}).click();await toolbar(page).getByRole('button',{name:'Delete part',exact:true}).click()
  await expect(page.locator('[data-shape]')).toHaveCount(3);await expect(page.locator('.sm-part-message')).toContainText('Undo restores')
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-shape]')).toHaveCount(4)
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('[data-shape]')).toHaveCount(3)
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Undo',exact:true}).click()
  const restored=await backup(page,'p3-restored.json');expect(restored.areas).toEqual(before.areas)
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Redo',exact:true}).click()
  await expect(page.locator('.sm-save-state')).toHaveText('Saved in this browser');await page.reload();await page.locator('.sm-recent button').first().click()
  const reopened=await backup(page,'p3-reopened.json');expect(reopened.areas[0].shapes[0].layout).toEqual(newLayout);expect(reopened.areas[0].shapes[0].dimensions).toEqual(old.dimensions)
})
test('create three unknown Parts and arrange only their visual positions in one Area',async({page})=>{
  await page.goto('/tools/site-measure');await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click();await page.getByRole('button',{name:'＋ L-shape',exact:true}).click();await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await page.getByRole('button',{name:'Fit All',exact:true}).click();await expect(page.locator('svg.sm-canvas')).toHaveCount(1);await expect(page.locator('.sm-template-guide')).toHaveCount(3)
  const before=await backup(page,'p3-new-parts.json')
  await interior(page,'L-shape 2');await toolbar(page).getByRole('button',{name:'Move',exact:true}).click()
  const point=await page.getByRole('button',{name:'Part L-shape 2',exact:true}).evaluate(el=>{const q=new DOMPoint(35,40).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!);return{x:q.x,y:q.y}})
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+45,point.y-25,{steps:6});await page.mouse.up();await toolbar(page).getByRole('button',{name:'Done moving',exact:true}).click()
  const after=await backup(page,'p3-arranged-new.json')
  expect(after.areas[0].shapes[1].layout).not.toEqual(before.areas[0].shapes[1].layout)
  after.areas[0].shapes.forEach((s:{dimensions:unknown},i:number)=>expect(s.dimensions).toEqual(before.areas[0].shapes[i].dimensions))
  await expect(page.locator('path.sm-top')).toHaveCount(0)
})
test('touch Move cancellation and two-finger zoom do not commit placement or edge edits',async({page,context})=>{
  await sample(page);const before=await backup(page,'p3-before-touch.json'),point=await interior(page,'Kitchen L')
  await toolbar(page).getByRole('button',{name:'Move',exact:true}).click();const cdp=await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+30,y:point.y+25,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
  const b=(await page.locator('svg.sm-canvas').boundingBox())!,x=b.x+b.width/2,y=b.y+b.height/2,view=await page.locator('svg.sm-canvas').getAttribute('viewBox'),touches=(d:number)=>[{x:x-d,y,id:0},{x:x+d,y,id:1}]
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(35)});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(80)});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect(page.locator('svg.sm-canvas')).not.toHaveAttribute('viewBox',view!);await expect(page.locator('.sm-context')).toHaveCount(0)
  const beforePan=await page.locator('svg.sm-canvas').getAttribute('viewBox')
  const blank=await page.locator('svg.sm-canvas').evaluate(el=>{
    const b=el.getBoundingClientRect()
    for(let y=10;y<b.height-30;y+=25)for(let x=10;x<b.width-50;x+=25)if(document.elementFromPoint(b.x+x,b.y+y)===el)return{x:b.x+x,y:b.y+y}
    throw Error('No blank canvas location')
  })
  await page.mouse.move(blank.x,blank.y);await page.mouse.down();await page.mouse.move(blank.x+35,blank.y+15,{steps:5});await page.mouse.up()
  await expect(page.locator('svg.sm-canvas')).not.toHaveAttribute('viewBox',beforePan!)
  const after=await backup(page,'p3-after-touch.json');expect(after.areas).toEqual(before.areas)
})
test('pinch anchor remains stable after zoom and editor resize of the shared SVG',async({page,context})=>{
  await sample(page);await page.getByRole('button',{name:'Zoom in',exact:true}).click()
  await page.getByRole('button',{name:'Kitchen L Back run',exact:true}).press('Enter')
  await expect(page.locator('.sm-quick-panel')).toBeVisible();await expect(page.getByLabel('Length',{exact:true})).toHaveValue('96')
  const svg=page.locator('svg.sm-canvas');await svg.scrollIntoViewIfNeeded();const b=(await svg.boundingBox())!,x=b.x+b.width/2,y=b.y+b.height/2
  const anchor=()=>svg.evaluate((el,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!.inverse());return{x:q.x,y:q.y}},{x,y})
  const before=await anchor(),cdp=await context.newCDPSession(page),points=(d:number)=>[{x:x-d,y,id:0},{x:x+d,y,id:1}]
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(30)});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(65)});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  const after=await anchor();expect(Math.abs(before.x-after.x)).toBeLessThan(.01);expect(Math.abs(before.y-after.y)).toBeLessThan(.01)
  await expect(page.getByLabel('Length',{exact:true})).toHaveValue('96')
})
test('tablet/desktop selections keep the toolbar and every Part in the shared workspace',async({page})=>{
  await sample(page)
  for(const [width,height] of [[1366,900],[1024,768],[768,1024],[390,844]]){
    await page.setViewportSize({width,height});await page.getByRole('button',{name:'Fit All',exact:true}).click();await interior(page,'Island')
    await expect(toolbar(page).getByRole('button',{name:'Duplicate',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.screenshot({path:path.join(root,'preview3-canvas-'+width+'.png'),fullPage:true})
  }
})
