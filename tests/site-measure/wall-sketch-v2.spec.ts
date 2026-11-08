import {test,expect,type Page} from '@playwright/test'
import fs from 'node:fs/promises'

async function backup(page:Page){
  await page.getByRole('button',{name:'Workspace menu'}).click()
  const wait=page.waitForEvent('download')
  await page.getByRole('button',{name:'Download project backup'}).click()
  const file=await wait
  return JSON.parse(await fs.readFile(await file.path(),'utf8'))
}
async function startWall(page:Page){
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:'＋ Wall sketch · schematic'}).click()
  await expect(page.getByRole('group',{name:'Draw schematic wall'})).toBeVisible()
}
test('P5.2 phone: taps create a wall sketch, persist across reopen, and preserve countertop dimensions',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:'＋ Rectangle'}).click()
  const original=await backup(page)
  await startWall(page)
  const rect=(await page.locator('svg.sm-canvas').boundingBox())!
  for(const [x,y] of [[.26,.42],[.38,.40],[.47,.46],[.66,.45]]){
    await page.touchscreen.tap(rect.x+rect.width*x,rect.y+rect.height*y)
  }
  await expect(page.getByRole('group',{name:'Draw schematic wall'})).toContainText('4 points')
  await page.getByRole('button',{name:'Undo point'}).click()
  await expect(page.getByRole('group',{name:'Draw schematic wall'})).toContainText('3 points')
  await page.getByRole('button',{name:'Finish wall'}).click()
  const wall=page.locator('[data-wall-sketch]')
  await expect(wall).toHaveCount(1)
  await page.screenshot({path:'artifacts/site-measure/p5-wall-sketch-mobile.png',fullPage:true})
  const snapshot=await backup(page)
  expect(snapshot.wallSketches[0].kind).toBe('schematic')
  expect(snapshot.wallSketches[0].points).toHaveLength(3)
  expect(snapshot.areas[0].shapes[0].dimensions).toEqual(original.areas[0].shapes[0].dimensions)
  expect(snapshot.areas[0].shapes[0].allowances).toEqual(original.areas[0].shapes[0].allowances)
  await expect(page.locator('.sm-save-state')).toHaveText('Saved in this browser')
  await page.reload()
  await page.locator('.sm-recent button').first().click()
  await expect(page.locator('[data-wall-sketch]')).toHaveCount(1)
  await page.getByRole('button',{name:'Select schematic wall Wall sketch 1'}).press('Enter')
  await expect(page.getByRole('group',{name:'Schematic wall actions'})).toBeVisible()
  await page.getByRole('button',{name:'Delete wall sketch'}).click()
  await expect(page.locator('[data-wall-sketch]')).toHaveCount(0)
  await page.getByRole('button',{name:'Undo',exact:true}).click()
  await expect(page.locator('[data-wall-sketch]')).toHaveCount(1)
})
test('P5.2 freehand drag creates multiple world points and cancelled draw saves nothing',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await startWall(page)
  const b=(await page.locator('svg.sm-canvas').boundingBox())!
  await page.mouse.move(b.x+b.width*.2,b.y+b.height*.4)
  await page.mouse.down()
  await page.mouse.move(b.x+b.width*.32,b.y+b.height*.45,{steps:8})
  await page.mouse.move(b.x+b.width*.47,b.y+b.height*.37,{steps:8})
  await page.mouse.up()
  const text=await page.getByRole('group',{name:'Draw schematic wall'}).textContent()
  const count=Number(text?.match(/(\d+) points/)?.[1]||0)
  expect(count).toBeGreaterThan(4)
  await page.getByRole('button',{name:'Cancel',exact:true}).click()
  expect((await backup(page)).wallSketches).toHaveLength(0)
  await startWall(page)
  const b2=(await page.locator('svg.sm-canvas').boundingBox())!
  await page.touchscreen.tap(b2.x+b2.width*.2,b2.y+b2.height*.5)
  await page.touchscreen.tap(b2.x+b2.width*.68,b2.y+b2.height*.42)
  await page.getByRole('button',{name:'Finish wall'}).click()
  await expect(page.locator('[data-wall-sketch]')).toHaveCount(1)
  await page.getByRole('button',{name:'Workspace menu'}).click()
  await page.getByRole('button',{name:'PDF / DXF Export'}).click()
  await expect(page.locator('.sm-export-panel')).toContainText('schematic Wall Sketches')
})
