/**
 * 性能基线（astra.md 的 H04）。
 *
 * 这条检查**不量时间**，量的是「渲染了多少东西」。
 *
 * 为什么：时间基线在别人的机器上必红。CI 的机器、开发容器、谁的笔记本，
 * 快慢差着好几倍，把毫秒数写进断言，等于交付一条对多数人都是红的检查——
 * 而一条对谁都红的检查，很快就会被当成噪音关掉，比没有检查更糟。
 *
 * 结构性的量不吃这一套：两万行的表格渲染出多少个 `<tr>`，在谁的机器上都一样。
 * 而这恰恰是这套库里最值钱、又最容易悄悄消失的东西——虚拟化被谁顺手去掉之后，
 * 页面照样能用、测试照样绿、截图照样对，只是慢了十倍，
 * 而「慢」在开发机的两万行假数据上未必看得出来。
 *
 * 原始时间测量仍然要留，但它属于**记录**而不是断言：跑
 * `node scripts/check-perf.mjs --record` 会把当次的数字与环境打出来，
 * 贴进 docs/H04-PERF-BASELINE.md，供人比对趋势。
 *
 * 用法：
 *   node scripts/check-perf.mjs
 *   node scripts/check-perf.mjs --record
 *   node scripts/check-perf.mjs --base=http://localhost:4173
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

/**
 * 预算。每一条都写清「数据有多少、允许渲染多少、为什么是这个数」。
 *
 * 预算不是按当前实测值贴着定的：贴着定的话，任何一次正常的版面调整都会踩线，
 * 于是预算被一路调高，最后失去意义。这里留了三到四倍的余量，
 * 它要拦的是「虚拟化没了」这种数量级的变化，不是几个节点的增减。
 */
export const BUDGETS = [
  {
    name: '两万行表格',
    path: '/components/table',
    selector: '.i-table-c tbody tr',
    total: 20000,
    max: 150,
    why: '虚拟化只渲染视口内那几十行；没有虚拟化的话这里会是两万'
  },
  {
    name: '两万项虚拟列表',
    path: '/components/layout',
    selector: '.i-virtual__row',
    total: 20000,
    max: 60,
    why: '同上，列表项比表格行更轻，窗口也更小'
  },
  {
    name: '一万项下拉',
    path: '/components/select',
    selector: '.i-select__option',
    total: 10000,
    max: 150,
    why: '下拉打开时只渲染可见的那一屏选项'
  }
]

/** 全站单页元素上限。它拦的是「某一页把什么都铺出来了」这种整体性退化 */
export const MAX_ELEMENTS = 4000

export function judge(measurements, { budgets = BUDGETS, maxElements = MAX_ELEMENTS } = {}) {
  const problems = []
  for (const m of measurements) {
    const budget = budgets.find((b) => b.name === m.name)
    if (!budget) continue
    if (m.rendered > budget.max) {
      problems.push(
        `${m.name}：${budget.total} 条数据渲染出了 ${m.rendered} 个节点，超过预算 ${budget.max}` +
          `（${budget.why}）`
      )
    }
    if (m.rendered === 0) {
      problems.push(`${m.name}：一个节点都没渲染出来，选择器多半该更新了——这条检查正在空跑`)
    }
  }
  for (const page of measurements.filter((m) => m.elements !== undefined)) {
    if (page.elements > maxElements) {
      problems.push(`${page.name}：整页 ${page.elements} 个元素，超过 ${maxElements}`)
    }
  }
  return problems
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const record = process.argv.includes('--record')
  const baseArg = process.argv.find((a) => a.startsWith('--base='))
  const port = 5185
  let server = null
  if (!baseArg) {
    server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { stdio: 'ignore' })
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`http://localhost:${port}/`)
        if (res.ok) break
      } catch { /* 还没起来 */ }
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  const base = baseArg ? baseArg.slice('--base='.length) : `http://localhost:${port}`

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const measurements = []

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    for (const budget of BUDGETS) {
      const started = Date.now()
      await page.goto(`${base}/#${budget.path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      const rendered = await page.locator(budget.selector).count()
      const elements = await page.evaluate(() => document.querySelectorAll('*').length)
      measurements.push({ name: budget.name, rendered, elements, ms: Date.now() - started })
    }
    await context.close()
  } finally {
    await browser.close()
    server?.kill()
  }

  const problems = judge(measurements)

  if (record) {
    console.log('环境：', process.platform, process.arch, 'node', process.version)
    console.log('注意：下面的毫秒数只作记录，不参与判定——换台机器就不是这个数。\n')
    for (const m of measurements) {
      const budget = BUDGETS.find((b) => b.name === m.name)
      console.log(
        `${m.name}：${budget.total} 条数据 → 渲染 ${m.rendered} 个节点（预算 ${budget.max}），` +
          `整页 ${m.elements} 个元素，载入 ${m.ms}ms`
      )
    }
  }

  if (problems.length) {
    console.error('性能基线检查未通过：')
    for (const line of problems) console.error(`  - ${line}`)
    console.error('\n渲染节点数远超预算，通常意味着虚拟化被去掉了：页面照样能用，只是慢十倍。')
    process.exit(1)
  }
  console.log(
    `性能基线检查通过：${measurements.map((m) => `${m.name} ${m.rendered} 节点`).join('、')}，都在预算内`
  )
}
