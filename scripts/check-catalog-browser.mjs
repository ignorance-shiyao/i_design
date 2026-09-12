import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

// 对生产构建验证，避免开发服务器的自动更新掩盖漏提交的清单。
const base = process.env.CATALOG_BASE_URL ?? 'http://127.0.0.1:4173/'
const output = resolve(process.env.CATALOG_SCREENSHOTS ?? '/tmp/i-design-f0-browser')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
})
const results = []
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme })
    await context.addInitScript((value) => localStorage.setItem('i-design-theme', value), theme)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}#/design/catalog`)
    await page.locator('.cat-item').first().waitFor()
    assert.deepEqual(await page.locator('.cat-item.is-planned .cat-item__name').allTextContents(), ['悬浮操作按钮', '会话列表'])
    assert.deepEqual(await page.locator('.cat-item.is-excluded .cat-item__name').allTextContents(), ['弹性容器'])
    for (const label of ['页面框架', '可拖拽分栏', '时间选择', '穿梭框', '自动完成', '提及', '颜色选择',
      '图片预览', '走马灯', '日历', '新手引导', '水印', '吸顶', '二维码']) {
      const item = page.locator('.cat-item').filter({ has: page.locator('.cat-item__name', { hasText: new RegExp(`^${label}$`) }) })
      assert.match(await item.getAttribute('class'), /is-ready/, label)
      assert.match(await item.innerText(), /可用/, label)
    }
    await page.screenshot({ path: `${output}/catalog-${theme}.png`, fullPage: true })
    await page.goto(`${base}#/components`)
    await page.locator('.tile').first().waitFor()
    for (const name of ['TimePicker', 'Transfer']) {
      const tile = page.locator('.tile').filter({ has: page.locator('.tile__name', { hasText: new RegExp(`^${name}$`) }) })
      assert.equal(await tile.getAttribute('href'), '#/components/data-entry')
      assert.doesNotMatch(await tile.getAttribute('class'), /is-planned/)
      await tile.click()
      await page.getByRole('heading', { name: name === 'TimePicker' ? /时间选择/ : /穿梭框/ }).first().waitFor()
      await page.goto(`${base}#/components`)
      await page.locator('.tile').first().waitFor()
    }
    await page.screenshot({ path: `${output}/overview-${theme}.png`, fullPage: true })
    assert.deepEqual(errors, [])
    results.push({ theme, planned: ['悬浮操作按钮', '会话列表'], corrected: 14, links: ['TimePicker', 'Transfer'], pageErrors: errors })
    await context.close()
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, colorScheme: 'dark' })
  await page.goto(`${base}#/design/catalog`)
  await page.locator('.cat-item').first().waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '移动端不能出现水平溢出')
  await page.screenshot({ path: `${output}/catalog-mobile-dark.png`, fullPage: true })
  results.push({ viewport: '390×844', horizontalOverflow: false })
  writeFileSync(`${output}/results.json`, `${JSON.stringify(results, null, 2)}\n`)
  console.log(`浏览器验证通过，截图与结果：${output}`)
} finally {
  await browser.close()
}
