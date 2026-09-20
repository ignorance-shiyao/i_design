/** D05：真实数据口径、渲染尺寸与键盘选择；--faults 改坏实际执行源码。 */
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/components/pareto`
  const modelPattern = '**/packages/common/src/logic/pareto.ts*'
  const componentPattern = '**/src/components/IChartPareto.vue*'
  async function scenario(action, mutation) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage(), errors = []
    page.setDefaultTimeout(10000)
    page.setDefaultNavigationTimeout(60000)
    page.on('pageerror', error => errors.push(error.message))
    let changed = false
    if (mutation) await page.route(mutation.pattern || modelPattern, async route => {
      const response = await route.fetch(), source = await response.text()
      const body = mutation.change(source)
      changed ||= source !== body
      await route.fulfill({ response, body })
    })
    try {
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.locator('.i-pareto').waitFor()
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally { await context.close(); if (mutation) assert.ok(changed, '故障必须修改实际执行源码') }
  }
  const rows = page => page.locator('.i-pareto__row')
  const checks = {
    async order(page) { assert.deepEqual(await rows(page).locator('span:first-child').allTextContents(), ['1. 请求超时', '2. 接口异常', '3. 其他原因'], '降序与稳定次序错误') },
    async denominator(page) { assert.match(await page.locator('.i-pareto__caption').first().innerText(), /有效值合计 100 次；前 2 项达到 80.0%/, '分母或阈值错误') },
    async cumulative(page) { assert.match(await rows(page).nth(1).innerText(), /累计 80.0%/, '累计值错误') },
    async excluded(page) { assert.match(await page.locator('.i-pareto').innerText(), /源行 4 · 待补录原因：值缺失，未计入分母/, '排除明细缺失') },
    async geometry(page) {
      const heights = await page.locator('.i-pareto__bar').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().height))
      assert.equal(heights.length, 3, '柱形数量错误')
      assert.ok(Math.abs(heights[0] - 220) < .1 && Math.abs(heights[1] - 220 / 3) < .1, '柱高与数值不符')
      const points = await page.locator('.i-pareto__line').getAttribute('points')
      const ys = points.split(' ').map(point => Number(point.split(',')[1]))
      assert.deepEqual(ys.map(y => Math.round(y)), [40, 20, 0], '累计折线坐标错误')
    },
    async keyboard(page) {
      await rows(page).nth(1).focus(); await page.keyboard.press('Enter')
      assert.equal(await rows(page).nth(1).getAttribute('aria-pressed'), 'true', '键盘选择未更新')
      assert.match(await page.locator('.pareto-selection').innerText(), /已选：第 2 项 接口异常/, '选择回调错误')
    },
    async single(page) {
      await page.getByRole('button', { name: '单个类别', exact: true }).click()
      assert.equal(await page.locator('.i-pareto__point').count(), 1, '单类别累计点缺失')
      const stroke = await page.locator('.i-pareto__point').evaluate(el => getComputedStyle(el).stroke)
      assert.notEqual(stroke, 'none', '单类别累计点不可见')
      assert.match(await rows(page).first().innerText(), /累计 100.0%/, '单类别累计值错误')
    },
    async zero(page) {
      await page.getByRole('button', { name: '全部为零', exact: true }).click()
      assert.match(await page.locator('.i-pareto__caption').first().innerText(), /累计占比无定义/, '零分母说明错误')
      assert.equal(await page.locator('.i-pareto__plot').count(), 0, '零分母不应绘制累计图')
      assert.match(await rows(page).first().innerText(), /累计 —/, '零分母伪造累计值')
      await page.getByRole('button', { name: '空数据', exact: true }).click()
      assert.equal(await rows(page).count(), 0, '空数据残留类别')
    },
    async visual(page, shots = false) {
      const samples = []
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 }); await page.evaluate(() => document.fonts.ready)
        const result = await page.evaluate(() => ({ width: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          maxLineEm: Math.max(...[...document.querySelectorAll('.pareto-page p')].map(el => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize))),
          minLabelPx: Math.min(...[...document.querySelectorAll('.i-pareto__ranks span, .i-pareto__values')].map(el => parseFloat(getComputedStyle(el).fontSize))),
          plotWidth: document.querySelector('.i-pareto__plot').getBoundingClientRect().width,
          barHeights: [...document.querySelectorAll('.i-pareto__bar')].map(el => el.getBoundingClientRect().height)
        }))
        assert.equal(result.overflow, 0, '帕累托页面横向溢出')
        assert.ok(result.maxLineEm <= 45.1, '正文行长超过45em')
        assert.ok(result.minLabelPx >= 12, '数据标签字号过小')
        samples.push(result)
        await page.evaluate(() => scrollTo(0, 0))
        if (shots) await page.screenshot({ path: `node_modules/d05-shots/pareto-${width}.png`, fullPage: true })
      }
      if (shots) console.log('帕累托渲染实测', JSON.stringify(samples))
    }
  }
  if (!process.argv.includes('--faults')) {
    await mkdir('node_modules/d05-shots', { recursive: true })
    await scenario(async page => {
      for (const key of ['order', 'denominator', 'cumulative', 'excluded', 'geometry', 'keyboard']) await checks[key](page)
      await checks.visual(page, true)
      await page.setViewportSize({ width: 1440, height: 1000 })
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByTitle(theme === 'dark' ? '切换到暗色' : '切换到亮色', { exact: true }).click()
        const { violations } = await new AxeBuilder({ page }).analyze()
        assert.deepEqual(violations.filter(v => ['serious', 'critical'].includes(v.impact)), [], `${theme} 无障碍失败`)
        await page.screenshot({ path: `node_modules/d05-shots/pareto-${theme}.png`, fullPage: true })
      }
      await checks.single(page)
      await checks.zero(page)
    })
    console.log('帕累托浏览器闭环通过；亮暗态 serious/critical = 0')
  } else {
    const faults = [
      ['order', /降序与稳定次序错误/, s => s.replace('b.item.value - a.item.value', 'a.item.value - b.item.value')],
      ['denominator', /分母或阈值错误/, s => s.replace('sum + row.item.value', 'sum + row.item.value / 2')],
      ['cumulative', /累计值错误/, s => s.replace('cumulativeValue / total', 'cumulativeValue / total + 0.1')],
      ['excluded', /排除明细缺失/, s => s.replace('base.excluded.push({', 'false && base.excluded.push({')],
      ['geometry', /柱高与数值不符/, s => s.replace('value / max', 'value / max / 2')],
      ['keyboard', /键盘选择未更新/, s => s.replaceAll('"select", row.id', '"select", "wrong-id"'), componentPattern],
      ['single', /单类别累计点缺失/, s => s.replaceAll('i-pareto__point', 'i-pareto__missing-point'), componentPattern],
      ['zero', /零分母伪造累计值/, s => s.replace('const cumulative = total > 0 ?', 'const cumulative = total >= 0 ?').replace('cumulativeValue / total', 'cumulativeValue / (total || 1)')],
      ['visual', /正文行长超过45em/, s => s + '\nconst badStyle=document.createElement("style");badStyle.textContent=".pareto-page p{max-width:none!important;width:1000px}";document.head.append(badStyle);', componentPattern],
      ['visual', /帕累托页面横向溢出/, s => s + '\nconst badStyle=document.createElement("style");badStyle.textContent=".i-pareto{min-width:1600px}";document.head.append(badStyle);', componentPattern]
    ]
    for (const [name, error, change, pattern] of faults) {
      await assert.rejects(scenario(checks[name], { change, pattern }), error)
      console.log(`故障注入已拦截：${name}`)
    }
    // 无效输入不能在 UI 端另算：直接变异并执行 common 的真实源码。
    const source = await readFile('packages/common/src/logic/pareto.ts', 'utf8')
    const bad = source.replace('!item.id || ids.has(item.id)', 'false')
    assert.notEqual(bad, source)
    const { code } = await transform(bad, { loader: 'ts', format: 'esm' })
    const { buildPareto } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
    const duplicate = [{ id: 'x', label: 'x', value: 1 }, { id: 'x', label: 'x', value: 2 }]
    assert.throws(() => assert.equal(buildPareto(duplicate).state, 'invalid'), /ready/)
    console.log('故障注入已拦截：无效ID模型拒绝')
    const tinyBad = source.replace('n !== 0 && n < 0.000001', 'false')
    assert.notEqual(tinyBad, source)
    const tinyCode = await transform(tinyBad, { loader: 'ts', format: 'esm' })
    const tinyModule = await import('data:text/javascript;base64,' + Buffer.from(tinyCode.code).toString('base64'))
    assert.throws(() => assert.notEqual(tinyModule.buildPareto([{ id: 'tiny', label: '微量', value: 1e-8 }]).totalText, '0'), /Expected/)
    console.log('故障注入已拦截：微小非零值误报零')
  }
} finally { await browser?.close(); await server.close() }
