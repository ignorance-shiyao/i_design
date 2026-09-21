/** E03：端口连线校验与校验面板；--faults 改坏实际执行源码。 */
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
  const base = `http://127.0.0.1:${server.httpServer.address().port}/#/components/flow`
  const modelPattern = '**/packages/common/src/logic/wiring.ts*'
  const pagePattern = '**/src/pages/components/FlowPage.vue*'

  async function scenario(action, mutation) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
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
      await page.locator('.wiring-demo').waitFor()
      await page.locator('.wiring-demo__row').first().waitFor()
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally {
      await context.close()
      if (mutation) assert.ok(changed, '故障必须修改实际执行源码')
    }
  }

  const demo = (page) => page.locator('.wiring-demo')
  const rows = (page) => demo(page).locator('.wiring-demo__row')
  const issues = (page) => demo(page).locator('.wiring-demo__issue')
  const notice = (page) => demo(page).locator('.wiring-demo__notice')

  /** 三个下拉都是 ISelect：点开触发器再按可见文字挑选项 */
  async function pick(page, index, optionText) {
    const select = demo(page).locator('.wiring-demo__pick').nth(index)
    await select.click()
    await page.getByRole('option', { name: optionText }).first().click()
  }

  async function reset(page) {
    await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
    await rows(page).first().waitFor()
  }

  const checks = {
    /** 连得上时落到文档上，连线列表跟着长一条 */
    async connect(page) {
      await reset(page)
      const before = await rows(page).count()
      await pick(page, 0, '开始 · out')
      await pick(page, 1, '审批 · in')
      await demo(page).getByRole('button', { name: '连线', exact: true }).click()
      let after = before
      for (let i = 0; i < 20 && after === before; i += 1) {
        after = await rows(page).count()
        if (after === before) await page.waitForTimeout(100)
      }
      assert.equal(after, before + 1, '连线没有落到文档上')
      assert.match(await notice(page).innerText(), /已连/, '连线结果没有反馈')
    },

    /** 同一对端口之间的第二条线要被拒，并指向已有那条 */
    async duplicate(page) {
      await checks.connect(page)
      const before = await rows(page).count()
      await demo(page).getByRole('button', { name: '连线', exact: true }).click()
      await page.waitForTimeout(300)
      assert.equal(await rows(page).count(), before, '重复边被放进了文档')
      assert.match(
        await notice(page).innerText(),
        /已经有连线/,
        '重复边没有指向已有的那一条'
      )
    },

    /** 白名单之外的连线类型，松手之前就该变红 */
    async unknownType(page) {
      await reset(page)
      await pick(page, 0, '开始 · out')
      await pick(page, 1, '结束 · in')
      await pick(page, 2, '数据 data（白名单外）')
      // 不 waitFor：白名单失效时这条提示根本不出现，等它只会等到超时
      const preview = demo(page).locator('.wiring-demo__preview')
      let text = ''
      for (let i = 0; i < 20 && !text; i += 1) {
        text = (await preview.count()) ? await preview.innerText() : ''
        if (!text) await page.waitForTimeout(100)
      }
      assert.match(text, /不在这张图允许的/, '白名单外的类型没有即时反馈')
    },

    /** 校验面板逐条点名，并且点得过去 */
    async panel(page) {
      await reset(page)
      await demo(page).getByRole('button', { name: '塞一条坏线', exact: true }).click()
      await page.getByRole('radio', { name: 'DAG（禁止成环）', exact: true }).click()
      // 只读 code 列：连线 id 会出现在原因里，拿整段文本匹配会把 id 当成 code。
      // 面板整块失效时一条都不会出现，所以轮询而不是 waitFor——否则超时信息盖掉真正的原因
      let codes = []
      for (let i = 0; i < 20 && !codes.length; i += 1) {
        codes = (await issues(page).locator('.wiring-demo__issue-code').allTextContents()).map((t) =>
          t.trim()
        )
        if (!codes.length) await page.waitForTimeout(100)
      }
      const texts = (await issues(page).allTextContents()).join('\n')
      assert.ok(codes.includes('dangling'), '悬空边没有被报出来')
      assert.ok(codes.includes('cycle'), 'DAG 里的回边没有被报出来')
      assert.match(texts, /n-ghost/, '悬空边没有点名是哪个节点不存在')
      const targets = await issues(page).locator('.wiring-demo__issue-target').allTextContents()
      assert.ok(
        targets.every((t) => /^(edge|node):/.test(t.trim())),
        '问题没有可定位的 target'
      )
      await issues(page).first().click()
      assert.ok(
        await issues(page).first().evaluate((el) => el.classList.contains('is-focused')),
        '点了问题之后没有定位'
      )
      // 换回状态机：同一条回边在审批流里是「驳回」，不该再报
      await page.getByRole('radio', { name: '状态机（允许回环）', exact: true }).click()
      await page.waitForTimeout(300)
      const relaxed = (
        await issues(page).locator('.wiring-demo__issue-code').allTextContents()
      ).map((t) => t.trim())
      assert.ok(!relaxed.includes('cycle'), '状态机里回边被当成了错误')
    },

    /** 断开与换类型：都走同一套校验 */
    async edit(page) {
      await reset(page)
      const before = await rows(page).count()
      await rows(page).first().getByRole('button', { name: '断开', exact: true }).click()
      let after = before
      for (let i = 0; i < 20 && after === before; i += 1) {
        after = await rows(page).count()
        if (after === before) await page.waitForTimeout(100)
      }
      assert.equal(after, before - 1, '断开没有生效')

      await reset(page)
      await rows(page).first().getByRole('button', { name: '换类型', exact: true }).click()
      await page.waitForTimeout(300)
      assert.match(await notice(page).innerText(), /类型改成了 reject/, '换类型没有生效')
      assert.match(await rows(page).first().innerText(), /reject/, '连线列表没有跟着更新')
    },

    async visual(page, shots = false) {
      await reset(page)
      const samples = []
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1200 })
        await page.evaluate(() => document.fonts.ready)
        const result = await page.evaluate(() => ({
          width: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          maxLineEm: Math.max(
            ...[...document.querySelectorAll('.wiring-demo__notice, .wiring-demo__issue-text')].map(
              (el) => el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize)
            )
          ),
          edgeRows: document.querySelectorAll('.wiring-demo__row').length
        }))
        assert.equal(result.overflow, 0, '连线面板页面横向溢出')
        assert.ok(result.maxLineEm <= 45.1, '面板正文行长超过45em')
        assert.ok(result.edgeRows >= 2, '连线列表在窄屏丢失')
        samples.push(result)
        await page.evaluate(() => scrollTo(0, 0))
        if (shots) {
          await page.screenshot({ path: `node_modules/e03-shots/edges-${width}.png`, fullPage: true })
        }
      }
      if (shots) console.log('连线面板渲染实测', JSON.stringify(samples))
    }
  }

  if (!process.argv.includes('--faults')) {
    await mkdir('node_modules/e03-shots', { recursive: true })
    await scenario(async (page) => {
      for (const key of ['connect', 'duplicate', 'unknownType', 'panel', 'edit']) await checks[key](page)
      await checks.visual(page, true)
      await page.setViewportSize({ width: 1440, height: 1200 })
      await reset(page)
      await demo(page).getByRole('button', { name: '塞一条坏线', exact: true }).click()
      await page.getByRole('radio', { name: 'DAG（禁止成环）', exact: true }).click()
      await issues(page).first().waitFor()
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
        await page.screenshot({ path: `node_modules/e03-shots/edges-${theme}.png`, fullPage: true })
      }
    })
    console.log('端口连线浏览器闭环通过；亮暗态 serious/critical = 0')
  } else {
    // Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。
    const faults = [
      [
        'duplicate',
        /重复边被放进了文档|重复边没有指向已有的那一条/,
        (s) => s.replace('const twin = document.edges.find(', 'const twin = [].find(')
      ],
      [
        'panel',
        /DAG 里的回边没有被报出来/,
        (s) => s.replace('if ((options.kind ?? "cyclic") !== "dag") return null;', 'return null;')
      ],
      [
        'panel',
        /悬空边没有被报出来|悬空边没有点名是哪个节点不存在/,
        (s) => s.replace('code: "dangling",\n        message: `连线', 'code: "ok-ish",\n        message: `连线')
      ],
      [
        'panel',
        /问题没有可定位的 target|点了问题之后没有定位/,
        (s) => s.replace('target: `node:${nodeId}`', 'target: ""')
      ],
      [
        'unknownType',
        /白名单外的类型没有即时反馈/,
        (s) =>
          s.replace(
            'if (options.edgeTypes && candidate.type !== void 0 && !options.edgeTypes.includes(candidate.type)) {',
            'if (false) {'
          )
      ],
      [
        'edit',
        /断开没有生效/,
        (s) =>
          s.replace(
            'edges: document.edges.filter((e) => e.id !== edgeId)',
            'edges: document.edges'
          )
      ],
      [
        'edit',
        /换类型没有生效|连线列表没有跟着更新/,
        (s) => s.replace('candidateIssues(without, candidate, options, edgeId)', 'candidateIssues(document, candidate, options)')
      ],
      [
        'panel',
        /悬空边没有被报出来|DAG 里的回边没有被报出来/,
        (s) => s.replace('const wiringIssues = computed(() => validateWiring(', 'const wiringIssues = computed(() => [] || validateWiring('),
        pagePattern
      ]
    ]

    for (const [index, [name, error, change, pattern]] of faults.entries()) {
      await assert.rejects(scenario(checks[name], { change, pattern }), error)
      console.log(`故障注入已拦截：${index + 1} ${name}`)
    }
  }
} finally {
  await browser?.close()
  await server.close()
}
