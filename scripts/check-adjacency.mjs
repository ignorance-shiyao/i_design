/** D08：邻接矩阵口径、渲染尺寸与键盘选择；--faults 改坏实际执行源码。 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
await server.listen()
let browser
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/components/adjacency`
  const modelPattern = '**/packages/common/src/logic/adjacency.ts*'
  const componentPattern = '**/src/components/IChartAdjacency.vue*'

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
      await page.locator('.i-adjacency').waitFor()
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally {
      await context.close()
      if (mutation) assert.ok(changed, '故障必须修改实际执行源码')
    }
  }

  const checks = {
    async mixed(page) {
      await page.getByRole('button', { name: '无向混合', exact: true }).click()
      await page.getByRole('button', { name: '输入序', exact: true }).click()
      assert.match(
        await page.locator('.i-adjacency__basis').innerText(),
        /空格是没有边或未观测，不是 0/,
        '口径说明缺失'
      )
      const absent = page.locator('.i-adjacency__cell.is-absent')
      const unknown = page.locator('.i-adjacency__cell.is-unknown')
      assert.ok(await absent.count(), '应有无边空档')
      assert.ok(await unknown.count(), '应有未观测空档')
      assert.deepEqual(
        await absent.locator('.i-adjacency__value').allTextContents(),
        Array(await absent.count()).fill('—'),
        '无边空档被画成了 0'
      )
      assert.deepEqual(
        await unknown.locator('.i-adjacency__value').allTextContents(),
        Array(await unknown.count()).fill('—'),
        '未观测空档被画成了 0'
      )
      const zeros = await page.locator('.i-adjacency__cell').evaluateAll((els) =>
        els
          .filter((el) => /\b0\b/.test(el.querySelector('.i-adjacency__value')?.textContent || ''))
          .map((el) => el.className)
      )
      assert.ok(
        zeros.some((cls) => /is-s[1-5]/.test(cls)),
        '零权边未画成 ready 色档'
      )
      assert.ok(zeros.every((cls) => !cls.includes('is-absent') && !cls.includes('is-unknown')), '零权边被标成了空档')
    },

    async directed(page) {
      await page.getByRole('button', { name: '有向', exact: true }).click()
      assert.match(await page.locator('.i-adjacency__status').innerText(), /有向/, '有向状态不可见')
      const headers = await page.locator('.i-adjacency__table thead th').allTextContents()
      const a = headers.findIndex((t) => t.trim() === '甲')
      const b = headers.findIndex((t) => t.trim() === '乙')
      assert.ok(a > 0 && b > 0, '行列标签缺失')
      const ab = page.locator('tbody tr').nth(a - 1).locator('.i-adjacency__cell').nth(b - 1)
      const ba = page.locator('tbody tr').nth(b - 1).locator('.i-adjacency__cell').nth(a - 1)
      assert.match(await ab.innerText(), /5/, '有向边甲→乙丢失')
      assert.ok(await ba.evaluate((el) => el.classList.contains('is-absent')), '有向图被错误镜像')
    },

    async sort(page) {
      await page.getByRole('button', { name: '无向混合', exact: true }).click()
      await page.getByRole('button', { name: '按社群', exact: true }).click()
      assert.match(await page.locator('.i-adjacency__basis').innerText(), /社群/, '社群排序口径未写入图上')
      await page.getByRole('button', { name: '按度数', exact: true }).click()
      assert.match(await page.locator('.i-adjacency__basis').innerText(), /度数/, '度数排序口径未写入图上')
    },

    async keyboard(page) {
      await page.getByRole('button', { name: '无向混合', exact: true }).click()
      const cell = page.locator('.i-adjacency__cell').nth(1)
      await cell.focus()
      await page.keyboard.press('Enter')
      assert.equal(await cell.getAttribute('aria-pressed'), 'true', '键盘选择未更新')
      assert.match(await page.locator('.adjacency-selection').innerText(), /已选：/, '选择回调错误')
    },

    async visual(page, shots = false) {
      await page.getByRole('button', { name: '无向混合', exact: true }).click()
      const samples = []
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(() => document.fonts.ready)
        const result = await page.evaluate(() => ({
          width: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          maxLineEm: Math.max(
            ...[...document.querySelectorAll('.adjacency-page p')].map(
              (el) => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize)
            )
          ),
          cellCount: document.querySelectorAll('.i-adjacency__cell').length
        }))
        assert.equal(result.overflow, 0, '邻接矩阵页面横向溢出')
        assert.ok(result.maxLineEm <= 45.1, '正文行长超过45em')
        assert.ok(result.cellCount >= 16, '矩阵格子数量不足')
        samples.push(result)
        await page.evaluate(() => scrollTo(0, 0))
        if (shots) {
          await page.screenshot({ path: `node_modules/d08-shots/adjacency-${width}.png`, fullPage: true })
        }
      }
      if (shots) console.log('邻接矩阵渲染实测', JSON.stringify(samples))
    }
  }

  if (!process.argv.includes('--faults')) {
    await mkdir('node_modules/d08-shots', { recursive: true })
    await scenario(async (page) => {
      for (const key of ['mixed', 'directed', 'sort', 'keyboard']) await checks[key](page)
      await checks.visual(page, true)
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.getByRole('button', { name: '无向混合', exact: true }).click()
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
        await page.screenshot({ path: `node_modules/d08-shots/adjacency-${theme}.png`, fullPage: true })
      }
    })
    console.log('邻接矩阵浏览器闭环通过；亮暗态 serious/critical = 0')
  } else {
    // Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。
    const faults = [
      [
        'mixed',
        /应有无边空档|无边空档被画成了 0/,
        (s) =>
          s.replace(
            'state: "absent",\n          value: null,\n          valueText: "—",',
            'state: "ready",\n          value: 0,\n          valueText: "0",'
          )
      ],
      [
        'mixed',
        /应有未观测空档|未观测空档被画成了 0/,
        (s) =>
          s.replace(
            'state: "unknown", value: null, sourceIndex',
            'state: "ready", value: 0, sourceIndex'
          )
      ],
      [
        'mixed',
        /口径说明缺失/,
        (s) => s.replaceAll('空格是没有边或未观测，不是 0', '空格按 0 处理')
      ],
      [
        'directed',
        /有向图被错误镜像/,
        (s) => s.replace('if (!directed && from !== to)', 'if (from !== to)')
      ],
      [
        'sort',
        /社群排序口径未写入图上/,
        (s) => s.replaceAll('社群', '标签')
      ],
      [
        'keyboard',
        /键盘选择未更新|选择回调错误/,
        (s) => s.replaceAll('emit("select", rowIndex, colIndex)', 'emit("select", -1, -1)'),
        componentPattern
      ],
      [
        'visual',
        /正文行长超过45em/,
        (s) =>
          s +
          '\nconst badStyle=document.createElement("style");badStyle.textContent=".adjacency-page p{max-width:none!important;width:1000px}";document.head.append(badStyle);',
        componentPattern
      ],
      [
        'visual',
        /邻接矩阵页面横向溢出/,
        (s) =>
          s +
          '\nconst badStyle=document.createElement("style");badStyle.textContent=".i-adjacency{min-width:1600px}";document.head.append(badStyle);',
        componentPattern
      ]
    ]

    for (const [name, error, change, pattern] of faults) {
      await assert.rejects(scenario(checks[name], { change, pattern }), error)
      console.log(`故障注入已拦截：${name}`)
    }
  }
} finally {
  await browser?.close()
  await server.close()
}
