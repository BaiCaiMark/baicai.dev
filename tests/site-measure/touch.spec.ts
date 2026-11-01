import { test, expect, type Page, type CDPSession } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
const root=path.resolve('artifacts/site-measure')
async function sample(p:Page){await p.goto('/tools/site-measure');await p.getByRole('button',{name:'Try sample Kitchen',exact:true}).click();await expect(p.locator('.sm-save-state')).toHaveText('Saved in this browser')}
async function backup(p:Page,name:string){const event=p.waitForEvent('download');await p.getByRole('button',{name:'Backup',exact:true}).click();const file=path.join(root,name);await(await event).saveAs(file);return JSON.parse(fs.readFileSync(file,'utf8'))}
async function handle(p:Page){const h=p.getByRole('button',{name:'Drag Kitchen L',exact:true});const b=await h.locator('rect').evaluate(el=>el.getBoundingClientRect().toJSON());expect(b.width).toBeCloseTo(44,1);expect(b.height).toBeCloseTo(44,1);return{x:b.x+b.width/2,y:b.y+b.height/2}}
async function touch(c:CDPSession,type:'touchStart'|'touchEnd'|'touchMove'|'touchCancel',points:{x:number;y:number;id:number}[]){await c.send('Input.dispatchTouchEvent',{type,touchPoints:points})}
async function linePoint(p:Page,part:string,edge:string,t=.5,offset=0,scroll=true){
  const line=p.getByRole('button',{name:part+' '+edge,exact:true}).locator('.sm-edge-hit')
  if(scroll)await p.locator('svg.sm-canvas').scrollIntoViewIfNeeded()
  return line.evaluate((el,{t,offset})=>{
    const l=el as SVGLineElement,m=l.getScreenCTM()!,a=new DOMPoint(l.x1.baseVal.value,l.y1.baseVal.value).matrixTransform(m),b=new DOMPoint(l.x2.baseVal.value,l.y2.baseVal.value).matrixTransform(m)
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)
    return{x:a.x+dx*t-dy/length*offset,y:a.y+dy*t+dx/length*offset}
  },{t,offset})
}
async function edge(p:Page,part:string,name:string,t=.5,offset=0){const q=await linePoint(p,part,name,t,offset);await p.touchscreen.tap(q.x,q.y);await expect(p.locator('.sm-context-heading h2')).toHaveText(name)}
const done=(p:Page)=>p.getByRole('button',{name:'Done',exact:true})
test('interior select → handle touch drag → release is exactly one reversible layout action',async({page,context})=>{
  await sample(page);const before=await backup(page,'p31-before-drag.json')
  const interior=await page.getByRole('button',{name:'Part Kitchen L',exact:true}).evaluate(el=>{const q=new DOMPoint(55,55).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!);return{x:q.x,y:q.y}})
  await page.touchscreen.tap(interior.x,interior.y);await expect(page.locator('.sm-context')).toHaveCount(0)
  const q=await handle(page),cdp=await context.newCDPSession(page)
  await touch(cdp,'touchStart',[{...q,id:0}])
  for(let i=1;i<=6;i++)await touch(cdp,'touchMove',[{x:q.x+i*8,y:q.y+i*3,id:0}])
  await touch(cdp,'touchEnd',[])
  const after=await backup(page,'p31-after-drag.json')
  const {layout:oldLayout,...old}=before.areas[0].shapes[0],{layout:newLayout,...current}=after.areas[0].shapes[0]
  expect(newLayout).not.toEqual(oldLayout);expect(current).toEqual(old)
  await expect(page.locator('.sm-context')).toHaveCount(0)
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  expect((await backup(page,'p31-undo-drag.json')).areas).toEqual(before.areas)
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled()
  await page.getByRole('button',{name:'Redo',exact:true}).click()
  expect((await backup(page,'p31-redo-drag.json')).areas).toEqual(after.areas)
  await expect(page.locator('.sm-save-state')).toHaveText('Saved in this browser')
  await page.reload();await page.locator('.sm-recent button').first().click()
  expect((await backup(page,'p31-reopened-drag.json')).areas).toEqual(after.areas)
})
test('handle cancel and second-finger takeover never commit placement; blank pan and selected pinch work',async({page,context})=>{
  await sample(page);const before=await backup(page,'p31-before-cancel.json'),cdp=await context.newCDPSession(page)
  let q=await handle(page)
  await touch(cdp,'touchStart',[{...q,id:0}]);await touch(cdp,'touchMove',[{x:q.x+25,y:q.y+15,id:0}]);await touch(cdp,'touchCancel',[])
  q=await handle(page)
  await touch(cdp,'touchStart',[{...q,id:0}]);await touch(cdp,'touchMove',[{x:q.x+25,y:q.y+15,id:0}])
  await touch(cdp,'touchStart',[{x:q.x+25,y:q.y+15,id:0},{x:q.x+65,y:q.y+15,id:1}])
  const svg=page.locator('svg.sm-canvas'),view=await svg.getAttribute('viewBox')
  await touch(cdp,'touchMove',[{x:q.x,y:q.y+25,id:0},{x:q.x+90,y:q.y+25,id:1}]);await touch(cdp,'touchEnd',[])
  await expect(svg).not.toHaveAttribute('viewBox',view!)
  const blank=await svg.evaluate(el=>{const r=el.getBoundingClientRect();for(let y=30;y<r.height-40;y+=30)for(let x=30;x<r.width-60;x+=30)if(document.elementFromPoint(r.x+x,r.y+y)===el)return{x:r.x+x,y:r.y+y};throw Error('No blank canvas')})
  const beforePan=await svg.getAttribute('viewBox')
  await touch(cdp,'touchStart',[{...blank,id:0}]);await touch(cdp,'touchMove',[{x:blank.x+35,y:blank.y+15,id:0}]);await touch(cdp,'touchEnd',[])
  await expect(svg).not.toHaveAttribute('viewBox',beforePan!)
  expect((await backup(page,'p31-after-cancel.json')).areas).toEqual(before.areas)
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();await expect(page.locator('.sm-context')).toHaveCount(0)
})
test('nearest L corner edges and offset touch targets stay semantic through zoom, rotation and mirror',async({page})=>{
  await sample(page);const before=await backup(page,'p31-before-edge.json')
  for(const zoom of ['Fit All','Zoom in','Zoom out']){
    await page.getByRole('button',{name:zoom,exact:true}).click()
    await edge(page,'Kitchen L','Inside horizontal run',.96,3);await done(page).click()
    await edge(page,'Kitchen L','Inside vertical run',.04,3);await done(page).click()
    await edge(page,'Kitchen L','Back run',.3,20);await done(page).click()
    await handle(page)
  }
  expect((await backup(page,'p31-after-edge.json')).areas).toEqual(before.areas)
  // Keep outlines separate: overlapping physical edges cannot express which hidden Part was intended.
  await page.locator('.sm-part-strip').getByRole('button',{name:'Island',exact:true}).click()
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Drag Island',exact:true}).press('Shift+ArrowRight')
  await page.locator('.sm-part-strip').getByRole('button',{name:'Kitchen L',exact:true}).click()
  for(const action of ['Rotate','Mirror']){
    await page.getByRole('toolbar',{name:'Selected part actions'}).getByRole('button',{name:action,exact:true}).click()
    await page.getByRole('button',{name:'Fit All',exact:true}).click()
    await edge(page,'Kitchen L','Right end',.5,15);await expect(page.locator('#sm-edge-measurement')).toHaveValue('25.5');await done(page).click()
  }
  // Explicit dimension labels retain their edge even outside the line corridor.
  const label=page.getByRole('button',{name:'Kitchen L Back run',exact:true}).locator('.sm-label-bg')
  await label.tap();await expect(page.locator('.sm-context-heading h2')).toHaveText('Back run')
})
test('inch shortcuts preserve focus, insertion caret and selected text; native entry and mm remain',async({page})=>{
  await sample(page);await edge(page,'Kitchen L','Right end')
  const input=page.locator('#sm-edge-measurement'),keys=page.locator('.sm-edge-editor > .sm-field .sm-entry-keys')
  await input.fill('25');await input.evaluate(el=>(el as HTMLInputElement).setSelectionRange(2,2))
  await keys.getByRole('button',{name:'1/2',exact:true}).tap()
  await expect(input).toBeFocused();await expect(input).toHaveValue('25 1/2')
  expect(await input.evaluate(el=>(el as HTMLInputElement).selectionStart)).toBe(6)
  await input.fill('25 1/2');await input.evaluate(el=>(el as HTMLInputElement).setSelectionRange(3,6))
  await keys.getByRole('button',{name:'3/4',exact:true}).tap()
  await expect(input).toHaveValue('25 3/4');await expect(input).toBeFocused()
  expect(await input.evaluate(el=>(el as HTMLInputElement).selectionStart)).toBe(6)
  for(const fraction of ['1/4','1/8','1/16']){
    await input.fill('');await keys.getByRole('button',{name:fraction,exact:true}).tap();await expect(input).toHaveValue(fraction);await expect(input).toBeFocused()
  }
  await input.fill('25.5');await page.getByLabel('Display units',{exact:true}).selectOption('mm')
  await expect(input).toHaveValue('647.7');await expect(keys).toHaveCount(0)
  await page.getByLabel('Display units',{exact:true}).selectOption('in');await expect(input).toHaveValue('25.5')
  await input.fill('59 7/16');await input.press('Enter');await expect(input).toHaveValue('59 7/16')
})
test('primary overhang stays unknown until explicit input; solver uses perpendicular allowances',async({page})=>{
  await sample(page);await page.getByRole('button',{name:/^Bathroom 1/}).click()
  await edge(page,'Vanity 59 + 1','Right end')
  const overhang=page.getByRole('textbox',{name:'Overhang on Right end',exact:true})
  await expect(overhang).toBeVisible();await expect(overhang).toHaveValue('1')
  expect(await overhang.evaluate(el=>!!el.closest('details'))).toBe(false)
  await expect(page.locator('.sm-finished strong')).toHaveText('22.5″')
  await overhang.fill('2')
  await expect(page.locator('.sm-finished strong')).toHaveText('22.5″')
  await done(page).click();await edge(page,'Vanity 59 + 1','Back run')
  await expect(page.locator('.sm-finished strong')).toHaveText('61″');await done(page).click()
  await edge(page,'Vanity 59 + 1','Right end')
  await overhang.fill('');await expect(page.locator('.sm-finished strong')).toContainText('Unknown')
  await expect(page.locator('path.sm-top')).toHaveCount(0)
  const unknown=await backup(page,'p31-unknown.json');expect(unknown.areas[1].shapes[0].allowances.right.input).toBe('')
  await page.getByRole('button',{name:'No overhang · 0',exact:true}).click()
  await expect(overhang).toHaveValue('0');await expect(page.locator('path.sm-top')).toHaveCount(1)
  await done(page).click();await edge(page,'Vanity 59 + 1','Back run');await expect(page.locator('.sm-finished strong')).toHaveText('59″')
  await page.locator('summary').filter({hasText:/^Part settings$/}).click();await page.getByRole('button',{name:'Direct finished size',exact:true}).click()
  await expect(page.locator('.sm-selected-allowance')).toHaveCount(0)
})
test('keyboard handle and edge controls work; editor opening does not zoom or cover the selected midpoint',async({page})=>{
  await sample(page)
  const h=page.getByRole('button',{name:'Drag Kitchen L',exact:true}),before=await backup(page,'p31-keyboard-before.json')
  await h.press('ArrowRight');const after=await backup(page,'p31-keyboard-after.json')
  expect(after.areas[0].shapes[0].layout.x).toBeGreaterThan(before.areas[0].shapes[0].layout.x)
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  const scale=()=>page.locator('svg.sm-canvas').evaluate(el=>(el as SVGGraphicsElement).getScreenCTM()!.a)
  const original=await scale()
  await page.getByRole('button',{name:'Kitchen L Right end',exact:true}).press('Enter')
  await expect(page.locator('#sm-edge-measurement')).toBeFocused()
  expect(await scale()).toBeCloseTo(original,5)
  await page.locator('#sm-edge-measurement').fill('26');expect(await scale()).toBeCloseTo(original,5)
  const point=await linePoint(page,'Kitchen L','Right end'),editor=(await page.locator('.sm-context').boundingBox())!,canvas=(await page.locator('svg.sm-canvas').boundingBox())!
  expect(point.x).toBeGreaterThan(canvas.x);expect(point.x).toBeLessThan(editor.x)
  await done(page).press('Enter');await expect(page.locator('.sm-context')).toHaveCount(0)
})
test('portrait and landscape reduced visual viewport keep Done and active input accessible',async({page})=>{
  await sample(page)
  for(const [width,height] of [[1024,768],[768,1024],[390,844]]){
    await page.setViewportSize({width,height});await page.getByRole('button',{name:'Fit All',exact:true}).click()
    await page.getByRole('button',{name:'Kitchen L Back run',exact:true}).press('Enter')
    // Model keyboard occlusion without pretending to test a physical Android keyboard.
    await page.evaluate(()=>{
      Object.defineProperty(window.visualViewport!,'height',{configurable:true,value:Math.round(innerHeight*.58)})
      window.visualViewport!.dispatchEvent(new Event('resize'))
    })
    await expect.poll(()=>done(page).evaluate(el=>{const r=el.getBoundingClientRect(),v=visualViewport!;return r.top>=v.offsetTop&&r.bottom<=v.offsetTop+v.height})).toBe(true)
    await expect.poll(()=>page.locator('#sm-edge-measurement').evaluate(el=>{const r=el.getBoundingClientRect(),v=visualViewport!;return r.top>=v.offsetTop&&r.bottom<=v.offsetTop+v.height})).toBe(true)
    await expect.poll(async()=>{
      const q=await linePoint(page,'Kitchen L','Back run',.5,0,false),panel=(await page.locator('.sm-context').boundingBox())!
      const visible=await page.evaluate(()=>({top:visualViewport!.offsetTop,bottom:visualViewport!.offsetTop+visualViewport!.height}))
      return q.y>=visible.top&&q.y<=visible.bottom&&!(q.x>=panel.x&&q.x<=panel.x+panel.width&&q.y>=panel.y&&q.y<=panel.y+panel.height)
    }).toBe(true)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.screenshot({path:path.join(root,'preview31-keyboard-'+width+'.png')})
    await done(page).click()
    await page.evaluate(()=>{Reflect.deleteProperty(window.visualViewport!,'height');window.visualViewport!.dispatchEvent(new Event('resize'))})
  }
})

