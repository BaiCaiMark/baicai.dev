import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function getBackup(page:Page) {
  const wait=page.waitForEvent('download')
  await page.getByRole('button',{name:'Workspace menu'}).click()
  await page.getByRole('button',{name:'Download project backup'}).click()
  const file=await wait
  return JSON.parse(await fs.readFile((await file.path())!,'utf8'))
}
async function tapEdge(page:Page,edge:string) {
  const line=page.locator('[data-shape]').first().locator('[data-edge="'+edge+'"] .sm-edge-hit')
  const point=await line.evaluate(el=>{
    const l=el as SVGLineElement,m=l.getScreenCTM()!
    const p=new DOMPoint((l.x1.baseVal.value+l.x2.baseVal.value)/2,(l.y1.baseVal.value+l.y2.baseVal.value)/2).matrixTransform(m)
    return{x:p.x,y:p.y}
  })
  await page.touchscreen.tap(point.x,point.y)
}
test('batch edge marking colors stay visible and do not modify measurements',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:'＋ Rectangle'}).click()
  const before=await getBackup(page)
  // Unconfirmed starting defaults are suggestions, not already-confirmed finish colors.
  await expect(page.locator('[data-edge="front"]').first()).toHaveAttribute('data-treatment','unset')
  await expect(page.locator('[data-edge="left"]').first()).toHaveAttribute('data-treatment','unset')
  await page.getByRole('button',{name:'Edge marking'}).click()
  const palette=page.getByRole('toolbar',{name:'Paint edge treatment'})
  await expect(palette).toBeVisible()
  await palette.getByRole('button',{name:'Polish',exact:true}).click()
  await tapEdge(page,'right')
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','polish')
  await expect(page.locator('.sm-canvas-floating')).toHaveCount(0)
  await tapEdge(page,'front')
  await expect(page.locator('[data-edge="front"]').first()).toHaveAttribute('data-treatment','polish')
  await palette.getByRole('button',{name:'Miter',exact:true}).click()
  await tapEdge(page,'left')
  await expect(page.locator('[data-edge="left"]').first()).toHaveAttribute('data-treatment','miter')
  await expect(page.locator('[data-edge="left"] .sm-edge-highlight').first()).toHaveCSS('stroke','rgb(205, 105, 40)')
  await palette.getByRole('button',{name:'No Polish',exact:true}).click()
  await tapEdge(page,'right')
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','no-polish')
  await expect(page.locator('[data-edge="right"] .sm-edge-highlight').first()).toHaveCSS('stroke','rgb(255, 0, 0)')
  await palette.getByRole('button',{name:'Done'}).click()
  await expect(palette).toHaveCount(0)
  const after=await getBackup(page)
  const a=after.areas[0].shapes[0],b=before.areas[0].shapes[0]
  expect(a.dimensions).toEqual(b.dimensions)
  expect(a.allowances).toEqual(b.allowances)
  expect(a.openEdges).toEqual(b.openEdges)
  expect(a.treatments.right).toBe('no-polish')
  expect(a.treatments.front).toBe('polish')
  expect(a.treatments.left).toBe('miter')
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','polish')
  await page.getByRole('button',{name:'Redo',exact:true}).click()
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','no-polish')
  await page.getByRole('button',{name:'Workspace menu'}).click()
  await expect(page.locator('.sm-v2-status > span:last-child')).toHaveText('Saved in this browser')
  await page.reload()
  await page.locator('.sm-recent button').first().click()
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','no-polish')
  await expect(page.locator('[data-edge="left"]').first()).toHaveAttribute('data-treatment','miter')
})

test('direct edge editor color works without changing cabinet overhang',async({page})=>{
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:'＋ Rectangle'}).click()
  const before=await getBackup(page)
  await page.locator('[data-edge="right"]').first().press('Enter')
  const editor=page.locator('.sm-direct-editor').first()
  await editor.getByRole('button',{name:'Miter',exact:true}).click()
  await expect(page.locator('[data-edge="right"]').first()).toHaveAttribute('data-treatment','miter')
  const after=await getBackup(page)
  expect(after.areas[0].shapes[0].allowances).toEqual(before.areas[0].shapes[0].allowances)
  expect(after.areas[0].shapes[0].dimensions).toEqual(before.areas[0].shapes[0].dimensions)
})
