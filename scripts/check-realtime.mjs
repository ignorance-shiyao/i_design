/** D07：真实滑窗口径、渲染尺寸与键盘选择；--faults 改坏实际执行源码。 */
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
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/components/realtime`
  const modelPattern = '**/packages/common/src/logic/realtime.ts*'
  const componentPattern = '**/src/components/IChartRealtime.vue*'

  async function scenario(action, mutation) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    const errors = []
    page.setDefaultTimeout(10000)
    page.setDefaultNavigationTimeout(60000)
    page.on('pageerror', (error) => errors.push(error.message))
    let changed = false
    if (mutation) {
      await page.route(mutation.pattern || modelPattern, async (route) => {
        const response = await route.fetch()
        const source = await response.text()
        const body = mutation.change(source)
        changed ||= source !== body
        await route.fulfill({ response, body })
      })
    }
    try {
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.locator('.i-realtime').waitFor()
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally {
      await context.close()
      if (mutation) assert.ok(changed, '故障必须修改实际执行源码')
    }
  }

  const checks = {
    async live(page) {
      assert.match(await page.locator('.i-realtime__caption').innerText(), /直播中/, '直播状态文案错误')
      assert.match(await page.locator('.i-realtime__basis').innerText(), /按事件时间归桶/, '口径说明缺失')
      assert.equal(await page.locator('.i-realtime__bucket').count(), 4, '桶数量错误')
      assert.equal(await page.locator('.i-realtime__bucket.is-gap').count(), 0, '直播态不应有断流桶')
      assert.equal(await page.locator('.i-realtime__line').count(), 1, '直播态折线段数错误')
    },

    async gap(page) {
      await page.getByRole('button', { name: '中间断流', exact: true }).click()
      assert.equal(await page.locator('.i-realtime__bucket.is-gap').count(), 2, '断流桶数量错误')
      assert.deepEqual(
        await page.locator('.i-realtime__gap-label').allTextContents(),
        ['断流', '断流'],
        '断流标签缺失'
      )
      assert.equal(await page.locator('.i-realtime__line').count(), 2, '断流处折线未断开')
      assert.match(await page.locator('.i-realtime__status').innerText(), /2 个断流空档/, '断流状态芯片缺失')
      assert.deepEqual(
        await page.locator('.i-realtime__bucket.is-gap .i-realtime__bucket-value').allTextContents(),
        ['—', '—'],
        '断流桶被画成了 0'
      )
    },

    async paused(page) {
      await page.getByRole('button', { name: '已暂停', exact: true }).click()
      assert.match(await page.locator('.i-realtime__status').innerText(), /已暂停/, '暂停状态不可见')
      assert.match(await page.locator('.i-realtime__caption').innerText(), /已暂停/, '暂停未写入图注')
    },

    async late(page) {
      await page.getByRole('button', { name: '直播', exact: true }).click()
      const issues = page.locator('.i-realtime__issues')
      assert.ok(await issues.count(), '迟到点未入窗明细缺失')
      assert.match(await issues.innerText(), /未入窗/, '迟到点未入窗明细缺失')
    },

    async keyboard(page) {
      await page.getByRole('button', { name: '直播', exact: true }).click()
      const bucket = page.locator('.i-realtime__bucket').nth(1)
      await bucket.focus()
      await page.keyboard.press('Enter')
      assert.equal(await bucket.getAttribute('aria-pressed'), 'true', '键盘选择未更新')
      assert.match(await page.locator('.realtime-selection').innerText(), /已选：/, '选择回调错误')
    },

    async visual(page, shots = false) {
      await page.getByRole('button', { name: '直播', exact: true }).click()
      const samples = []
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(() => document.fonts.ready)
        const result = await page.evaluate(() => ({
          width: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          maxLineEm: Math.max(
            ...[...document.querySelectorAll('.realtime-page p')].map(
              (el) => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize)
            )
          ),
          plotHeight: document.querySelector('.i-realtime__svg').getBoundingClientRect().height,
          bucketCount: document.querySelectorAll('.i-realtime__bucket').length
        }))
        assert.equal(result.overflow, 0, '实时滑窗页面横向溢出')
        assert.ok(result.maxLineEm <= 45.1, '正文行长超过45em')
        assert.ok(result.plotHeight >= 160, '图区高度被压扁')
        samples.push(result)
        await page.evaluate(() => scrollTo(0, 0))
        if (shots) {
          await page.screenshot({ path: `node_modules/d07-shots/realtime-${width}.png`, fullPage: true })
        }
      }
      if (shots) console.log('实时滑窗渲染实测', JSON.stringify(samples))
    }
  }

  if (!process.argv.includes('--faults')) {
    await mkdir('node_modules/d07-shots', { recursive: true })
    await scenario(async (page) => {
      for (const key of ['live', 'gap', 'paused', 'late', 'keyboard']) await checks[key](page)
      await checks.visual(page, true)
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.getByRole('button', { name: '直播', exact: true }).click()
      for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
          await page.getByTitle(theme === 'dark' ? '切换到暗色' : '切换到亮色', { exact: true }).click()
        }
        const { violations } = await new AxeBuilder({ page }).analyze()
        assert.deepEqual(
          violations.filter((v) => ['serious', 'critical'].includes(v.impact)),
          [],
          `${theme} 无障碍失败`
        )
        await page.screenshot({ path: `node_modules/d07-shots/realtime-${theme}.png`, fullPage: true })
      }
      await page.getByRole('button', { name: '中间断流', exact: true }).click()
      const { violations } = await new AxeBuilder({ page }).analyze()
      assert.deepEqual(
        violations.filter((v) => ['serious', 'critical'].includes(v.impact)),
        [],
        '断流态无障碍失败'
      )
    })
    console.log('实时滑窗浏览器闭环通过；亮暗态与断流态 serious/critical = 0')
  } else {
    // Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。
    const faults = [
      [
        'gap',
        /断流桶被画成了 0/,
        (s) =>
          s.replace(
            'state: "gap",\n        value: null,\n        valueText: "—",',
            'state: "gap",\n        value: 0,\n        valueText: numberText(0, unit),'
          )
      ],
      [
        'gap',
        /断流处折线未断开/,
        (s) =>
          s.replace(
            'if (bucket.state === "gap" || bucket.value === null) {',
            'if (false && (bucket.state === "gap" || bucket.value === null)) {'
          ),
        componentPattern
      ],
      [
        'paused',
        /暂停状态不可见/,
        (s) =>
          s
            .replaceAll('$props.model.paused ? "已暂停" : "直播中"', '"直播中"')
            .replaceAll('$props.model.paused ? "is-paused" : "is-live"', '"is-live"'),
        componentPattern
      ],
      ['late', /迟到点未入窗明细缺失/, (s) => s.replace('late.push({', 'false && late.push({')],
      [
        'keyboard',
        /键盘选择未更新/,
        (s) => s.replaceAll('emit("select", bucket.index)', 'emit("select", -1)'),
        componentPattern
      ],
      ['live', /口径说明缺失/, (s) => s.replace('按事件时间归桶', '按到达时间归桶')],
      [
        'visual',
        /正文行长超过45em/,
        (s) =>
          s +
          '\nconst badStyle=document.createElement("style");badStyle.textContent=".realtime-page p{max-width:none!important;width:1000px}";document.head.append(badStyle);',
        componentPattern
      ],
      [
        'visual',
        /实时滑窗页面横向溢出/,
        (s) =>
          s +
          '\nconst badStyle=document.createElement("style");badStyle.textContent=".i-realtime{min-width:1600px}";document.head.append(badStyle);',
        componentPattern
      ]
    ]

    for (const [name, error, change, pattern] of faults) {
      await assert.rejects(scenario(checks[name], { change, pattern }), error)
      console.log(`故障注入已拦截：${name}`)
    }

    const source = await readFile('packages/common/src/logic/realtime.ts', 'utf8')
    const badPause = source.replace(
      'const windowEnd = paused ? (options.freezeAt as number) : now',
      'const windowEnd = now'
    )
    assert.notEqual(badPause, source)
    const { code } = await transform(badPause, { loader: 'ts', format: 'esm' })
    const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
    const frozen = mod.buildRealtimeWindow([{ id: 'a', at: 500, value: 1 }], {
      now: 99999,
      windowMs: 4000,
      bucketMs: 1000,
      paused: true,
      freezeAt: 4000
    })
    assert.throws(() => assert.equal(frozen.windowEnd, 4000), /Expected/)
    console.log('故障注入已拦截：暂停未钉住窗口')

    const badLate = source.replace(
      'if (row.point.at < windowStart) {',
      'if (false && row.point.at < windowStart) {'
    )
    assert.notEqual(badLate, source)
    const lateTransformed = await transform(badLate, { loader: 'ts', format: 'esm' })
    const lateMod = await import(
      'data:text/javascript;base64,' + Buffer.from(lateTransformed.code).toString('base64')
    )
    const slipped = lateMod.buildRealtimeWindow(
      [
        { id: 'late', at: 9000, value: 99 },
        { id: 'ok', at: 10500, value: 3 }
      ],
      { now: 14000, windowMs: 4000, bucketMs: 1000 }
    )
    assert.throws(() => assert.equal(slipped.late.some((row) => row.id === 'late'), true), /Expected/)
    console.log('故障注入已拦截：迟到点被塞进当前窗')
  }
} finally {
  await browser?.close()
  await server.close()
}
