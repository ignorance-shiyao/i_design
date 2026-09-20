/** B17：真实导航/展开/搜索/计价口径，以及真实源码故障注入。 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { auditInPage, MAX_STRETCH_PX, MAX_STRETCH_PCT } from './check-layout.mjs'

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/design/public`
  const modelPattern = '**/packages/common/src/logic/public-pattern.ts*'
  const pagePattern = '**/src/pages/PublicPatternsPage.vue*'
  const nav = (page, name) => page.getByRole('navigation', { name: '公共页面导航' }).getByRole('link', { name, exact: true })
  const site = page => page.getByRole('region', { name: '公共网页示例', exact: true })
  async function scenario(action, { mutate, pattern = modelPattern, query = '' } = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.setDefaultTimeout(5000)
    let changed = false
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    if (mutate) await page.route(pattern, async route => {
      const response = await route.fetch(), source = await response.text(), body = mutate(source)
      changed ||= source !== body
      await route.fulfill({ response, body })
    })
    try {
      await page.goto(base + query, { waitUntil: 'networkidle' })
      await action(page)
      assert.deepEqual(errors, [], '公共页面运行错误')
    } finally {
      await context.close()
      if (mutate) assert.ok(changed, '必须改坏浏览器实际执行的源码')
    }
  }
  async function visual(page, name) {
    const samples = []
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const sample = await page.evaluate(() => ({
        width: innerWidth, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        maxLineEm: Math.max(...[...document.querySelectorAll('.public-page p, .public-page .i-collapse__body')].map(el => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize))),
        heights: [...document.querySelectorAll('.public-cards > .public-card')].map(el => Math.round(el.getBoundingClientRect().height))
      }))
      assert.equal(sample.overflow, 0, '公共页面横向溢出')
      assert.ok(sample.maxLineEm <= 45.1, '公共页面正文行长超限')
      if (width === 1440) {
        const { findings } = await page.evaluate(auditInPage, { maxMeasure: 45, maxStretchPx: MAX_STRETCH_PX, maxStretchPct: MAX_STRETCH_PCT })
        assert.deepEqual(findings, [], '公共页面卡片撑高或正文超限')
      }
      samples.push(sample)
      await page.screenshot({ path: `node_modules/b17-shots/${name}-${width}.png`, fullPage: true })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) {
        await page.getByTitle(theme === 'dark' ? '切换到暗色' : '切换到亮色', { exact: true }).click()
      }
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme, '实际主题没有切换')
      const { violations } = await new AxeBuilder({ page }).include('.public-page').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      assert.deepEqual(violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `${name} ${theme} 无障碍失败`)
      if (theme === 'dark') await page.screenshot({ path: `node_modules/b17-shots/${name}-dark.png`, fullPage: true })
    }
    await page.getByTitle('切换到亮色', { exact: true }).click()
    console.log(`${name}: ${JSON.stringify(samples)}；亮暗 serious/critical=0`)
  }
  async function pricing(page) {
    await nav(page, '示例方案').click()
    const team = page.getByRole('region', { name: '团队版示例', exact: true })
    assert.match(await team.locator('.public-price').innerText(), /99\.00\s*\/ 月/, '月付金额错误')
    await page.getByRole('link', { name: '按年查看', exact: true }).click()
    assert.match(await team.locator('.public-price').innerText(), /990\.00\s*\/ 年/, '年付总额错误')
    assert.match(await team.locator('.public-price-note').innerText(), /全年示例总额；参考月均 ¥82\.50/, '年付参考月均错误')
    assert.match(await page.locator('.public-pricing-notice').innerText(), /虚构示例[\s\S]*不会扣费/, '价格示例声明丢失')
  }
  async function faq(page) {
    await nav(page, '常见问题').click()
    const question = page.getByRole('button', { name: '选择方案会产生费用吗？', exact: true })
    assert.equal(await question.getAttribute('aria-expanded'), 'false')
    await question.focus()
    await question.press('Enter')
    assert.equal(await question.getAttribute('aria-expanded'), 'true', 'FAQ 没有展开')
    const body = page.locator('.i-collapse__item').first().locator('.i-collapse__body')
    assert.ok((await body.boundingBox()).height > 20, 'FAQ 回答没有显示')
    assert.match(await body.innerText(), /不会发起扣款/)
  }
  async function search(page) {
    await nav(page, '使用帮助').click()
    await page.getByRole('textbox', { name: '搜索帮助', exact: true }).fill('年付 十二')
    await page.getByRole('button', { name: '搜索', exact: true }).click()
    assert.equal(await site(page).locator('.public-card').count(), 1, '帮助搜索未正确筛选')
    assert.match(await site(page).innerText(), /阅读示例方案与计价周期/)
  }
  async function missing(page) {
    await page.goto(base + '?view=help&article=missing', { waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('heading', { name: '这篇帮助不存在', exact: true }).count(), 1, '失效文章被静默吞掉')
  }
  await mkdir('node_modules/b17-shots', { recursive: true })
  await scenario(async page => {
    await visual(page, 'home')
    await site(page).getByRole('link', { name: '开始了解', exact: true }).click()
    await page.getByRole('heading', { name: '从公共页面进入组件示例', exact: true }).waitFor()
    await page.goBack()
    await site(page).getByRole('link', { name: '查看协作看板', exact: true }).click()
    await page.waitForURL('**/#/components/board')
    await page.locator('.i-board').first().waitFor()
    assert.ok(page.url().endsWith('/components/board'), '功能卡片应进入真实组件文档')
    await page.goBack()
    await pricing(page)
    await visual(page, 'pricing-yearly')
    await page.reload({ waitUntil: 'networkidle' })
    assert.match(await page.getByRole('region', { name: '团队版示例' }).locator('.public-price').innerText(), /990\.00/, '刷新丢失年付状态')
    await page.getByRole('link', { name: '查看团队版示例说明', exact: true }).click()
    await page.getByRole('heading', { name: '阅读示例方案与计价周期', exact: true }).waitFor()
    await faq(page)
    await visual(page, 'faq-open')
    await page.getByRole('button', { name: '选择方案会产生费用吗？', exact: true }).press('Space')
    assert.equal(await page.getByRole('button', { name: '选择方案会产生费用吗？', exact: true }).getAttribute('aria-expanded'), 'false')
    await search(page)
    await page.getByRole('link', { name: '阅读：阅读示例方案与计价周期', exact: true }).click()
    await visual(page, 'help-article')
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '阅读示例方案与计价周期', exact: true }).waitFor()
    await page.getByRole('link', { name: '返回帮助列表', exact: true }).click()
    assert.equal(await page.getByRole('textbox', { name: '搜索帮助', exact: true }).inputValue(), '年付 十二', '返回丢失搜索词')
    assert.equal(await site(page).locator('.public-card').count(), 1)
    await page.getByRole('textbox', { name: '搜索帮助', exact: true }).fill('不存在的关键词')
    await page.getByRole('button', { name: '搜索', exact: true }).click()
    assert.equal(await site(page).locator('.public-card').count(), 0, '空结果没有显示')
    await visual(page, 'help-empty')
    await page.getByRole('link', { name: '清空搜索', exact: true }).click()
    assert.equal(await site(page).locator('.public-card').count(), 4)
    await page.goBack()
    assert.equal(await page.getByRole('textbox', { name: '搜索帮助', exact: true }).inputValue(), '不存在的关键词', '后退丢失筛选状态')
    await page.goForward()
    assert.equal(await site(page).locator('.public-card').count(), 4, '前进未恢复列表')
    await nav(page, '更新日志').click()
    await visual(page, 'updates')
    await site(page).getByRole('link', { name: '了解导航与帮助示例', exact: true }).click()
    await page.getByRole('heading', { name: '找回文章与筛选结果', exact: true }).waitFor()
    await missing(page)
    await page.getByRole('link', { name: '返回帮助列表', exact: true }).click()
    assert.equal(await site(page).locator('.public-card').count(), 4)
    await page.goto(base + '?view=unknown', { waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('heading', { name: '未找到这个栏目', exact: true }).count(), 1)
    await page.getByRole('link', { name: '回到概览', exact: true }).click()
    await site(page).getByRole('link', { name: '开始了解', exact: true }).waitFor()
  })
  const faults = [
    ['年付总额', s => s.replace('plan.yearlyCents', 'plan.monthlyCents'), pricing, /年付总额错误/, modelPattern],
    ['计价周期恢复', s => s.replace('query.cycle === "yearly"', 'false'), pricing, /年付总额错误/, modelPattern],
    ['参考月均', s => s.replace('Math.round(total / 12)', 'total'), pricing, /年付参考月均错误/, modelPattern],
    ['帮助搜索', s => s.replace('return words.every', 'return true || words.every'), search, /帮助搜索未正确筛选/, modelPattern],
    ['失效文章', s => s.replace('query.article !== void 0 && !article', 'false'), missing, /失效文章被静默吞掉/, modelPattern],
    ['FAQ 展开', s => s.replace(/emit\((['"])update:modelValue\1, next\)/, 'emit("update:modelValue", [])'), faq, /FAQ 没有展开/, '**/src/components/ICollapse.vue*'],
    ['示例声明', s => s.replaceAll('不会扣费', '扣费'), pricing, /价格示例声明丢失/, pagePattern]
  ]
  for (const [name, mutate, action, expected, pattern] of faults) {
    await assert.rejects(scenario(action, { mutate, pattern }), expected)
    console.log(`故障注入已拦截：${name}`)
  }
  const visualFaults = [
    ['横向溢出', s => s.replace(/\.public-site(?:\[data-v-[\w-]+\])?\s*\{/, '$& min-width: 1800px;'), /公共页面横向溢出/],
    ['正文行长', s => s.replaceAll('max-width: 45em;', 'max-width: none;'), /公共页面正文行长超限/],
    ['卡片撑高', s => s.replace('columns: 18em;', 'display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));'), /公共页面卡片撑高或正文超限/],
    ['搜索按钮名称', s => s.replace(/>搜索</g, '><').replace(/(["'])搜索\1/g, '""'), /无障碍失败/]
  ]
  for (const [name, mutate, expected] of visualFaults) {
    await assert.rejects(scenario(async page => {
      if (name === '卡片撑高') await nav(page, '示例方案').click()
      if (name === '搜索按钮名称') await nav(page, '使用帮助').click()
      await visual(page, `fault-${name}`)
    }, { mutate, pattern: pagePattern }), expected)
    console.log(`故障注入已拦截：${name}`)
  }
  console.log('B17 检查通过：导航、计价、FAQ、帮助搜索与恢复、失效入口、六种页面的宽窄屏和亮暗无障碍，11 次源码故障注入')
} finally {
  await browser?.close()
  await server.close()
}
