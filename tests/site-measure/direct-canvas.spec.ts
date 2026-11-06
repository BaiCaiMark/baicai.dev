import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function backup(page: Page) {
  const wait=page.waitForEvent('download')
  await page.getByRole('button',{name:'Backup',exact:true}).click()
  const file=await wait
  return JSON.parse(await fs.readFile((await file.path())!,'utf8'))
}
async function tapLabel(page:Page,edge:string) {
  const label=page.locator('[data-shape]').first().locator('[data-edge="'+edge+'"] [data-dimension]')
  const point=await label.evaluate(el=>{
    const q=el as SVGRectElement,m=q.getScreenCTM()!
    const p=new DOMPoint(q.x.baseVal.value+q.width.baseVal.value/2,q.y.baseVal.value+q.height.baseVal.value/2).matrixTransform(m)
    return{x:p.x,y:p.y}
  })
  await page.touchscreen.tap(point.x,point.y)
}
async function dim(page:Page,edge:string) {
  await page.locator('[data-edge="'+edge+'"] [data-dimension]').first().press('Enter')
  await expect(page.locator('.sm-dimension-editor')).toBeVisible()
}
async function line(page:Page,edge:string) {
  await page.locator('[data-edge="'+edge+'"]').first().press('Enter')
  await expect(page.locator('.sm-direct-editor:not(.sm-dimension-editor)')).toBeVisible()
}
async function close(page:Page){await page.getByRole('button',{name:'Close dimension editor'}).or(page.getByRole('button',{name:'Close direct editor'})).click()}

test('bathroom 60+1 and 21+1.5 edit from dimension labels, not edge settings',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await expect(page.locator('.sm-quick-panel')).toHaveCount(0)
  await tapLabel(page,'back')
  const editor=page.locator('.sm-dimension-editor')
  await expect(editor).toBeVisible()
  await editor.getByRole('textbox',{name:'Cabinet size'}).fill('60')
  await editor.locator('[aria-label="Right presets"]').getByRole('button',{name:'1',exact:true}).click()
  await expect(editor.locator('.sm-dimension-result')).toContainText('61')
  await close(page)
  // Width finishes independently of the still unknown depth.
  await expect(page.locator('[data-edge="back"] .sm-edge-value')).toContainText('61')
  await expect(page.locator('[data-edge="right"] .sm-edge-value')).toContainText('?')
  await dim(page,'right')
  await editor.getByRole('textbox',{name:'Cabinet size'}).fill('21')
  await expect(editor.locator('.sm-dimension-result')).toContainText('22.5')
  await close(page)
  await expect(page.locator('path.sm-top')).toHaveCount(1)
  await expect(page.locator('[data-edge="right"] .sm-edge-value')).toContainText('22.5')
  await line(page,'front')
  await expect(page.locator('.sm-dimension-editor')).toHaveCount(0)
  await expect(page.locator('.sm-direct-editor').getByRole('textbox',{name:'Cabinet size'})).toHaveCount(0)
  await page.getByRole('button',{name:'Polish',exact:true}).click()
  await close(page)
  const shape=(await backup(page)).areas[0].shapes[0]
  expect(shape.dimensions.width.input).toBe('60')
  expect(shape.dimensions.height.input).toBe('21')
  expect(shape.allowances.right.input).toBe('1')
  expect(shape.allowances.front.input).toBe('1.5')
  expect(shape.treatments.front).toBe('polish')
  await expect(page.locator('.sm-direct-edge-name')).toHaveCount(0)
})

test('L profile four independent dimensions from labels, physical line for Note',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.locator('.sm-template-picker summary').click()
  await page.getByRole('button',{name:'Deep Right',exact:true}).click()
  await expect(page.locator('.sm-direct-edge-name')).toHaveCount(0)
  for(const [edge,input] of [['back','70'],['left','22 1/2'],['right','7'],['front','40']] as const) {
    await dim(page,edge)
    await page.locator('.sm-dimension-editor').getByRole('textbox',{name:'Cabinet size'}).fill(input)
    await close(page)
  }
  await expect(page.locator('path.sm-top')).toHaveCount(1)
  await line(page,'left')
  const editor=page.locator('.sm-direct-editor')
  await editor.getByRole('button',{name:'Polish',exact:true}).click()
  await editor.getByRole('button',{name:'＋ Note'}).click()
  await editor.getByRole('textbox',{name:/Note on/}).fill('左側牆斜 1/4″，請複核')
  await close(page)
  const shape=(await backup(page)).areas[0].shapes[0]
  expect(shape.dimensions.width.input).toBe('70')
  expect(shape.dimensions.height.input).toBe('22 1/2')
  expect(shape.dimensions.legX.input).toBe('7')
  expect(shape.dimensions.legY.input).toBe('40')
  expect(shape.treatments.left).toBe('polish')
  expect(shape.fieldRecords.some((r:{kind:string;text:string})=>r.kind==='note'&&r.text.includes('1/4'))).toBe(true)
})

test('sink center remains directly editable',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await page.getByRole('button',{name:'＋ Sink',exact:true}).click()
  const editor=page.locator('.sm-direct-editor')
  await expect(editor).toContainText('Sink Center')
  await editor.getByRole('textbox',{name:'Sink from left/right'}).fill('30')
  await editor.getByRole('textbox',{name:'Sink from back/front'}).fill('11')
  await close(page)
  await page.getByRole('button',{name:'Edit Sink Center location'}).press('Enter')
  await expect(editor.getByRole('textbox',{name:'Sink from left/right'})).toHaveValue('30')
})

test('portrait tablet keeps dimension editor next to tapped label',async({page})=>{
  await page.setViewportSize({width:800,height:1100})
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await tapLabel(page,'back')
  await expect(page.locator('.sm-dimension-editor')).toBeVisible()
  const box=await page.locator('.sm-canvas-floating').boundingBox()
  expect(box).toBeTruthy()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x+box!.width).toBeLessThanOrEqual(800)
  await page.locator('.sm-dimension-editor').getByRole('textbox',{name:'Cabinet size'}).fill('60')
  await close(page)
  await line(page,'right')
  await expect(page.locator('.sm-direct-editor')).toContainText('Edge')
  await expect(page.locator('.sm-dimension-editor')).toHaveCount(0)
})

test('phone width auto-reveals the whole dimension popup after a label is selected',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await dim(page,'back')
  await expect.poll(async()=>page.locator('.sm-canvas-floating').evaluate(el=>{
    const box=el.getBoundingClientRect()
    return box.bottom <= window.visualViewport!.height + window.visualViewport!.offsetTop - 2
  })).toBe(true)
  const editor=page.locator('.sm-dimension-editor')
  await editor.getByRole('textbox',{name:'Cabinet size'}).fill('60')
  await editor.locator('[aria-label="Right presets"]').getByRole('button',{name:'1',exact:true}).click()
  await expect(editor.locator('.sm-dimension-result')).toContainText('61')
})
