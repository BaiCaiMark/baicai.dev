import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function tapEdge(page: Page, edge:string) {
  const line=page.locator('[data-shape]').first().locator('[data-edge="'+edge+'"] .sm-edge-hit')
  const point=await line.evaluate(el=>{
    const l=el as SVGLineElement,m=l.getScreenCTM()!
    const p=new DOMPoint((l.x1.baseVal.value+l.x2.baseVal.value)/2,(l.y1.baseVal.value+l.y2.baseVal.value)/2).matrixTransform(m)
    return{x:p.x,y:p.y}
  })
  await page.touchscreen.tap(point.x,point.y)
}
async function close(page:Page){await page.getByRole('button',{name:'Close direct editor'}).click()}

test('bathroom deep-right step is entered by touching four physical lines, no list',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await expect(page.locator('.sm-direct-switch')).toHaveAttribute('aria-pressed','true')
  await page.locator('.sm-template-picker summary').click()
  await page.getByRole('button',{name:'Deep Right',exact:true}).click()
  await expect(page.locator('.sm-quick-panel')).toHaveCount(0)
  await expect(page.locator('.sm-direct-edge-name')).toHaveCount(6)
  const dimensions:[string,string,string][]=[
    ['back','Cabinet 總長','70'],['left','Cabinet 最深處','22 1/2'],
    ['right','Cabinet 淺位深度','7'],['front','Cabinet 深位長度','40'],
  ]
  for(const [edge,label,input] of dimensions){
    await tapEdge(page,edge)
    const editor=page.locator('.sm-direct-editor')
    await expect(editor).toBeVisible()
    await editor.getByRole('textbox',{name:new RegExp(label)}).fill(input)
    await close(page)
  }
  await expect(page.locator('path.sm-top')).toHaveCount(1)
  await expect(page.locator('.sm-quick-panel')).toHaveCount(0)
  await expect(page.locator('.sm-save-state')).toHaveText('Saved in this browser')
  await tapEdge(page,'left')
  const editor=page.locator('.sm-direct-editor')
  await editor.getByRole('button',{name:'Polish',exact:true}).click()
  await editor.getByRole('button',{name:'1″',exact:true}).click()
  await editor.getByRole('button',{name:'＋ Note / 斜牆'}).click()
  await editor.getByRole('textbox',{name:/Note on/}).fill('左邊牆壁斜 1/4″，請現場複核')
  await close(page)
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Backup',exact:true}).click()
  const file=await download
  const raw=JSON.parse(await fs.readFile((await file.path())!,'utf8'))
  const shape=raw.areas[0].shapes[0]
  expect(shape.dimensions.width.input).toBe('70')
  expect(shape.dimensions.height.input).toBe('22 1/2')
  expect(shape.dimensions.legX.input).toBe('7')
  expect(shape.dimensions.legY.input).toBe('40')
  expect(shape.allowances.left.input).toBe('1')
  expect(shape.treatments.left).toBe('polish')
  expect(shape.fieldRecords.some((r:{kind:string;text:string})=>r.kind==='note'&&r.text.includes('1/4'))).toBe(true)
})

test('sink center can be entered from the drawing without the advanced form',async({page})=>{
  await page.goto('/tools/site-measure?direct=1')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'＋ Rectangle',exact:true}).click()
  await page.getByRole('button',{name:'＋ Sink',exact:true}).click()
  const editor=page.locator('.sm-direct-editor')
  await expect(editor).toContainText('Sink Center')
  await editor.getByRole('textbox',{name:'Sink from left/right'}).fill('30')
  await editor.getByRole('textbox',{name:'Sink from back/front'}).fill('11')
  await close(page)
  await expect(page.getByRole('button',{name:'Edit Sink Center location'})).toBeVisible()
  await page.getByRole('button',{name:'Edit Sink Center location'}).press('Enter')
  await expect(editor).toBeVisible()
  await expect(editor.getByRole('textbox',{name:'Sink from left/right'})).toHaveValue('30')
})
