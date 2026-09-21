/** E02：节点注册表、属性检查器与删除同步边；--faults 改坏实际执行源码。 */
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
  const modelPattern = '**/packages/common/src/logic/noderegistry.ts*'
  const pagePattern = '**/src/pages/components/FlowPage.vue*'

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
      await page.locator('.registry-demo').waitFor()
      await page.locator('.registry-demo .i-flow__node').first().waitFor()
      await action(page)
      assert.deepEqual(errors, [], '页面运行错误')
    } finally {
      await context.close()
      if (mutation) assert.ok(changed, '故障必须修改实际执行源码')
    }
  }

  const demo = (page) => page.locator('.registry-demo')
  const nodes = (page) => demo(page).locator('.i-flow__node')
  const edges = (page) => demo(page).locator('.i-flow__edge')
  const toolboxButtons = (page) => demo(page).locator('.registry-demo__toolbox button')
  const inspector = (page) => demo(page).locator('.registry-demo__inspector')

  /** 画布上按标签点中一个节点：选中状态由 IFlow 抛回页面 */
  async function selectNode(page, label) {
    const target = nodes(page).filter({ hasText: label }).first()
    await target.click({ position: { x: 10, y: 10 } })
    return target
  }

  const checks = {
    /** 工具箱来自注册表：加类型只改注册表，画布核心不动 */
    async toolbox(page) {
      const labels = (await toolboxButtons(page).allTextContents()).map((t) => t.trim())
      for (const expected of ['开始', '处理', '判断', '结束', '审批']) {
        assert.ok(labels.includes(expected), `工具箱缺少注册表里的「${expected}」`)
      }
      const before = await nodes(page).count()
      await toolboxButtons(page).filter({ hasText: '判断' }).first().click()
      // 先断「插进来了」再断形状：没插进来时等菱形只会等到超时，原因就被盖掉了
      let after = before
      for (let i = 0; i < 20 && after === before; i += 1) {
        after = await nodes(page).count()
        if (after === before) await page.waitForTimeout(100)
      }
      assert.equal(after, before + 1, '工具箱插入没有落到文档上')
      assert.ok(
        await demo(page).locator('.i-flow__node polygon.i-flow__shape').count(),
        '判断节点未按 canvasShape 画成菱形'
      )
    },

    /** 属性由 schema 驱动：检查器字段来自节点类型，改值同步回节点标签 */
    async inspect(page) {
      await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
      await selectNode(page, '审批')
      const form = inspector(page).locator('form')
      await form.waitFor()
      const fieldLabels = (await form.locator('label').allTextContents()).join(' ')
      assert.match(fieldLabels, /审批人/, '审批节点的 schema 字段缺失')
      assert.match(fieldLabels, /必须审批/, '开关字段缺失')

      const input = form.locator('input[type="text"]').first()
      await input.fill('赵六')
      await input.blur()
      // 不用 waitFor 等这个节点：没同步时它永远不出现，超时信息会盖掉真正的原因
      let renamed = 0
      for (let i = 0; i < 20 && !renamed; i += 1) {
        renamed = await nodes(page).filter({ hasText: '赵六' }).count()
        if (!renamed) await page.waitForTimeout(100)
      }
      assert.ok(renamed, '改属性没有同步回节点标签')
    },

    /** 删除同步边：悬空边是以后最难查的脏数据 */
    async deleteSync(page) {
      await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
      await demo(page).locator('.i-flow__node').first().waitFor()
      const edgeCount = await edges(page).count()
      assert.ok(edgeCount >= 2, '示例应有两条边')
      await selectNode(page, '审批')
      await page.getByRole('button', { name: '删除选中', exact: true }).click()
      await assert.doesNotReject(async () => {
        await demo(page)
          .locator('.i-flow__node')
          .filter({ hasText: '审批' })
          .first()
          .waitFor({ state: 'detached' })
      }, '节点没有被删掉')
      assert.equal(await edges(page).count(), 0, '删除节点后相连的边没有跟着走')
    },

    /** 未知类型只读占位：没有 schema，不假装可编辑 */
    async unknown(page) {
      await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
      await page.getByRole('button', { name: '注入未知类型', exact: true }).click()
      await selectNode(page, '旧插件节点')
      // 先断「没有表单」：给了可编辑表单时占位根本不会出现，等它只会等到超时
      await page.waitForTimeout(300)
      assert.equal(await inspector(page).locator('form').count(), 0, '未知类型给出了可编辑表单')
      const hint = inspector(page).locator('.hint')
      await hint.waitFor()
      assert.match(await hint.innerText(), /不认识|只读/, '未知类型没有说明原因')
    },

    async visual(page, shots = false) {
      await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
      const samples = []
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(() => document.fonts.ready)
        const result = await page.evaluate(() => ({
          width: innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          toolboxButtons: document.querySelectorAll('.registry-demo__toolbox button').length,
          nodeCount: document.querySelectorAll('.registry-demo .i-flow__node').length
        }))
        assert.equal(result.overflow, 0, '节点编辑器页面横向溢出')
        assert.ok(result.toolboxButtons >= 5, '工具箱按钮在窄屏丢失')
        assert.ok(result.nodeCount >= 3, '画布节点数量不足')
        samples.push(result)
        await page.evaluate(() => scrollTo(0, 0))
        if (shots) {
          await page.screenshot({ path: `node_modules/e02-shots/nodes-${width}.png`, fullPage: true })
        }
      }
      if (shots) console.log('节点编辑器渲染实测', JSON.stringify(samples))
    }
  }

  if (!process.argv.includes('--faults')) {
    await mkdir('node_modules/e02-shots', { recursive: true })
    await scenario(async (page) => {
      for (const key of ['toolbox', 'inspect', 'deleteSync', 'unknown']) await checks[key](page)
      await checks.visual(page, true)
      await page.setViewportSize({ width: 1440, height: 1000 })
      await demo(page).getByRole('button', { name: '重置示例', exact: true }).click()
      await selectNode(page, '审批')
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
        await page.screenshot({ path: `node_modules/e02-shots/nodes-${theme}.png`, fullPage: true })
      }
    })
    console.log('节点注册表浏览器闭环通过；亮暗态 serious/critical = 0')
  } else {
    // Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。
    const faults = [
      [
        'deleteSync',
        /删除节点后相连的边没有跟着走/,
        (s) =>
          s.replace(
            'const edges = document.edges.filter((e) => !remove.has(e.from) && !remove.has(e.to));',
            'const edges = document.edges;'
          )
      ],
      [
        'unknown',
        /未知类型给出了可编辑表单|未知类型没有说明原因/,
        (s) =>
          s.replace(
            'const def = registry.get(node.type);\n  if (!def) {',
            'const def = registry.get(node.type) ?? registry.list()[0];\n  if (!def) {'
          )
      ],
      [
        'toolbox',
        /判断节点未按 canvasShape 画成菱形/,
        (s) => s.replace('registry.get(node.type)?.canvasShape ?? "process"', '"process"')
      ],
      [
        'toolbox',
        /工具箱缺少注册表里的「审批」/,
        (s) => s.replace('label: "审批",', 'label: "签核",')
      ],
      [
        'inspect',
        /审批节点的 schema 字段缺失/,
        (s) => s.replace('label: "审批人",', 'label: "负责人甲",')
      ],
      [
        'inspect',
        /改属性没有同步回节点标签/,
        (s) => s.replace('nodes: document.nodes.map((n) => n.id === id ? { ...n, label } : n)', 'nodes: document.nodes')
      ],
      [
        'visual',
        /工具箱按钮在窄屏丢失/,
        (s) =>
          s.replace(
            'const list = Object.freeze([...map.values()]);',
            'const list = Object.freeze([...map.values()].slice(0, 2));'
          )
      ],
      [
        'toolbox',
        /工具箱插入没有落到文档上/,
        (s) => s.replace('graphDoc.value = inserted.document;', 'graphDoc.value = graphDoc.value;'),
        pagePattern
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
