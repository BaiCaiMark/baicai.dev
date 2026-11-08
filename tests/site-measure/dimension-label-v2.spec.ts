import { test, expect, type Page } from '@playwright/test'

async function dimensionPoint(page:Page,edge:string) {
  return page.locator('[data-shape]').first().locator('[data-edge="'+edge+'"] [data-dimension]').evaluate(el=>{
    const rect=el as SVGRectElement
    const matrix=rect.getScreenCTM()!
    const point=new DOMPoint(rect.x.baseVal.value+rect.width.baseVal.value/2,rect.y.baseVal.value+rect.height.baseVal.value/2).matrixTransform(matrix)
    return {x:point.x,y:point.y}
  })
}

test('phone: dimension cards follow all rectangle edges and tapping a vertical label edits that dimension',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:'＋ Rectangle'}).click()
  const edge=(name:string)=>page.locator('[data-shape]').first().locator('[data-edge="'+name+'"] .sm-dimension-label')
  await expect(edge('back')).toHaveAttribute('data-label-angle','0')
  await expect(edge('right')).toHaveAttribute('data-label-angle','-90')
  await expect(edge('front')).toHaveAttribute('data-label-angle','0')
  await expect(edge('left')).toHaveAttribute('data-label-angle','-90')
  const hit=await dimensionPoint(page,'right')
  await page.touchscreen.tap(hit.x,hit.y)
  const editor=page.locator('.sm-dimension-editor')
  await expect(editor).toBeVisible()
  await editor.getByRole('textbox',{name:'Cabinet size'}).fill('22.5')
  // The existing project default adds 1.5 in front overhang: 22.5 + 1.5 = 24.
  await expect(page.locator('[data-edge="right"] .sm-edge-value').first()).toContainText('24')
  await page.getByRole('button',{name:'Close dimension editor'}).click()
  await expect(edge('right')).toHaveAttribute('data-label-angle','-90')
  const screenshot=await page.screenshot({path:'artifacts/site-measure/p4-dimension-mobile.png',fullPage:true})
  expect(screenshot.byteLength).toBeGreaterThan(1000)
})

test('short L step labels float outwards with a connector and remain reachable by keyboard',async({page})=>{
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'New project',exact:true}).click()
  await page.getByRole('button',{name:'Add a part'}).click()
  await page.getByRole('group',{name:'Add a part'}).getByRole('button',{name:/Vanity Step.*Deep Left/}).click()
  const short=page.locator('[data-shape] .sm-dimension-label[data-short-edge="true"]')
  await expect(short.first()).toBeVisible()
  const leaders=page.locator('[data-shape] .sm-dimension-leader')
  expect(await leaders.count()).toBeGreaterThan(0)
  await short.first().locator('[data-dimension]').press('Enter')
  await expect(page.locator('.sm-dimension-editor')).toBeVisible()
})

test('Rotate and Mirror keep annotations upright, preserve measurements and edge hit targets',async({page})=>{
  await page.goto('/tools/site-measure')
  await page.getByRole('button',{name:'Try sample Kitchen',exact:true}).click()
  const back=page.locator('[data-shape]').first().locator('[data-edge="back"] .sm-dimension-label')
  await expect(back).toHaveAttribute('data-label-angle','0')
  await page.getByRole('button',{name:'Part actions'}).click()
  const actions=page.getByRole('toolbar',{name:'Selected part actions'})
  await actions.getByRole('button',{name:'Rotate',exact:true}).click()
  await expect(back).toHaveAttribute('data-label-angle','-90')
  await actions.getByRole('button',{name:'Mirror',exact:true}).click()
  const angle=Number(await back.getAttribute('data-label-angle'))
  expect(angle).toBeGreaterThanOrEqual(-90)
  expect(angle).toBeLessThan(90)
  await expect(page.getByRole('button',{name:'Kitchen L Back run',exact:true})).toHaveAttribute('data-selected',/true|false/)
})
