import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function backup(page:Page){
  const wait=page.waitForEvent('download')
  await page.getByRole('button',{name:'Backup',exact:true}).click()
  const file=await wait
  return JSON.parse(await fs.readFile((await file.path())!,'utf8'))
}

test('new L defaults both front-facing OPEN edges to 1.5 and hides direct-mode move handle',async({page})=>{
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
  await expect(page.locator('.sm-part-caption')).toContainText('FINISHED ?')
  await page.locator('[data-edge="back"]').first().press('Enter')
  await page.locator('.sm-direct-editor').getByRole('textbox',{name:/Cabinet/}).fill('60')
  await page.getByRole('button',{name:'Close direct editor'}).click()
  // A cabinet reading alone is not allowed to masquerade as the finished dimension.
  await expect(page.locator('[data-edge="back"] .sm-edge-value')).toContainText('?')
  for(const [edge,n] of [['left','39'],['right','24'],['front','24']] as const){
    await page.locator('[data-edge="'+edge+'"]').first().press('Enter')
    await page.locator('.sm-direct-editor').getByRole('textbox',{name:/Cabinet/}).fill(n)
    await page.getByRole('button',{name:'Close direct editor'}).click()
  }
  await expect(page.locator('path.sm-top')).toHaveCount(1)
  await expect(page.locator('.sm-part-caption')).toContainText('FINISHED countertop')
  await expect(page.locator('[data-edge="right"] .sm-edge-value')).toContainText('25.5')
  // The side edge must expose the frequently used 1.5 preset too.
  await page.locator('[data-edge="right"]').first().press('Enter')
  const editor=page.locator('.sm-direct-editor')
  await expect(editor.getByRole('button',{name:'1.5″'})).toBeVisible()
  await editor.getByRole('button',{name:'1.5″'}).click()
  await expect(editor.getByRole('button',{name:'1.5″'})).toHaveAttribute('aria-pressed','true')
  await editor.getByRole('button',{name:'OPEN',exact:true}).click()
  await expect(editor.getByRole('button',{name:'OPEN',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(editor.getByRole('button',{name:'1.5″'})).toHaveAttribute('aria-pressed','true')
  const result=(await backup(page)).areas[0].shapes[0]
  expect(result.allowances.right.input).toBe('1.5')
  expect(result.allowances.right.origin).toBe('allowance')
})

test('existing legacy L offers one-tap OPEN defaults but never overwrites custom',async({page})=>{
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ L-shape'}).click()
  const panel=page.locator('.sm-quick-panel')
  await panel.getByRole('button',{name:'Custom…'}).click()
  await panel.getByRole('textbox',{name:'Custom overhang'}).fill('3/4')
  await panel.getByRole('button',{name:'Done'}).click()
  // An old L without OPEN choices should inherit defaults but keep a manual Front overhang.
  const existing=(await backup(page)).areas[0].shapes[0]
  expect(existing.openEdges).toBeUndefined()
  expect(existing.allowances.front.input).toBe('3/4')
  expect(existing.allowances.front.origin).toBe('allowance')
  await page.getByRole('button',{name:'✎ 試用圖上輸入'}).click()
  await page.getByRole('button',{name:'套用 OPEN 預設'}).click()
  const updated=(await backup(page)).areas[0].shapes[0]
  expect(updated.openEdges.front).toBe(true)
  expect(updated.openEdges.innerX).toBe(true)
  expect(updated.allowances.front.input).toBe('3/4')
  expect(updated.allowances.front.origin).toBe('allowance')
  expect(updated.allowances.innerX.input).toBe('1.5')
})

test('the selected part moves by dragging its interior without a separate handle',async({page})=>{
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
