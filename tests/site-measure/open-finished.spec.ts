import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function backup(page:Page) {
  const wait=page.waitForEvent('download')
  await page.getByRole('button',{name:'Backup',exact:true}).click()
  const file=await wait
  return JSON.parse(await fs.readFile((await file.path())!,'utf8'))
}
async function dimension(page:Page,edge:string,input:string){
  await page.locator('[data-edge="'+edge+'"] [data-dimension]').first().press('Enter')
  await page.locator('.sm-dimension-editor').getByRole('textbox',{name:'Cabinet size'}).fill(input)
  await page.getByRole('button',{name:'Close dimension editor'}).click()
}
test('L profile has front OPEN defaults, clean finished dimensions and no move handle',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ L-shape'}).click()
  await expect(page.locator('.sm-move-handle')).toHaveCount(0)
  const shape=(await backup(page)).areas[0].shapes[0]
  expect(shape.openEdges.front).toBe(true)
  expect(shape.openEdges.innerX).toBe(true)
  expect(shape.openEdges.left).toBe(false)
  expect(shape.allowances.front.input).toBe('1.5')
  expect(shape.allowances.innerX.input).toBe('1.5')
  expect(shape.allowances.left.input).toBe('0')
  expect(shape.allowances.front.origin).toBe('default')
  await expect(page.locator('.sm-part-caption')).toContainText('Finished · incomplete')
  await dimension(page,'back','60')
  await expect(page.locator('[data-edge="back"] .sm-edge-value')).toContainText('60')
  await expect(page.locator('[data-edge="right"] .sm-edge-value')).toContainText('?')
  for(const [edge,n] of [['left','39'],['right','24'],['front','24']] as const)await dimension(page,edge,n)
  await expect(page.locator('path.sm-top')).toHaveCount(1)
  await expect(page.locator('.sm-part-caption')).toHaveText('Finished')
  await expect(page.locator('[data-edge="right"] .sm-edge-value')).toContainText('25.5')
  await page.locator('[data-edge="back"] [data-dimension]').first().press('Enter')
  const editor=page.locator('.sm-dimension-editor')
  await editor.locator('[aria-label="Right presets"]').getByRole('button',{name:'1.5'}).click()
  await page.getByRole('button',{name:'Close dimension editor'}).click()
  await page.locator('[data-edge="right"]').first().press('Enter')
  await page.getByRole('button',{name:'OPEN',exact:true}).click()
  await page.getByRole('button',{name:'Close direct editor'}).click()
  const result=(await backup(page)).areas[0].shapes[0]
  expect(result.allowances.right.input).toBe('1.5')
  expect(result.allowances.right.origin).toBe('allowance')
  await expect(page.locator('.sm-direct-edge-name')).toHaveCount(0)
})

test('legacy L can adopt OPEN defaults without replacing custom dimensions',async({page})=>{
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ L-shape'}).click()
  const panel=page.locator('.sm-quick-panel')
  await panel.getByRole('button',{name:'Custom…'}).click()
  await panel.getByRole('textbox',{name:'Custom overhang'}).fill('3/4')
  await panel.getByRole('button',{name:'Done'}).click()
  const existing=(await backup(page)).areas[0].shapes[0]
  expect(existing.openEdges).toBeUndefined()
  expect(existing.allowances.front.input).toBe('3/4')
  await page.getByRole('button',{name:'✎ 試用圖上輸入'}).click()
  await page.getByRole('button',{name:'套用 OPEN 預設'}).click()
  const updated=(await backup(page)).areas[0].shapes[0]
  expect(updated.openEdges.front).toBe(true)
  expect(updated.openEdges.innerX).toBe(true)
  expect(updated.allowances.front.input).toBe('3/4')
  expect(updated.allowances.innerX.input).toBe('1.5')
})

test('selected part still moves by dragging interior without a dedicated handle',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ L-shape'}).click()
  const before=(await backup(page)).areas[0].shapes[0]
  await expect(page.locator('.sm-move-handle')).toHaveCount(0)
  const start=await page.locator('path.sm-template-guide').evaluate(el=>{
    const q=new DOMPoint(80,80).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!)
    return{x:q.x,y:q.y}
  })
  await page.mouse.move(start.x,start.y)
  await page.mouse.down()
  await page.mouse.move(start.x+60,start.y+36,{steps:8})
  await page.mouse.up()
  const after=(await backup(page)).areas[0].shapes[0]
  expect(after.layout).not.toEqual(before.layout)
  expect(after.dimensions).toEqual(before.dimensions)
  expect(after.allowances).toEqual(before.allowances)
})
