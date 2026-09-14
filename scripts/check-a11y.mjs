/**
 * 无障碍自动检查：用 axe 扫文档站的每一条路由，亮暗两态各扫一遍。
 *
 * 为什么必须自动扫：无障碍问题的共同点是「看不见」——对比度差 0.3、少一个
 * aria-label、标题从 h2 跳到 h4，页面照样好看，构建照样绿，只有用读屏或
 * 在阳光下看屏幕的人会撞上。人工复查一轮能过，下一个组件加进来又会漏。
 *
 * 亮暗两遍不是重复：对比度是按实际渲染的颜色算的，暗色下的弱化文字与浅色
 * 边框是另一组值，亮色过了不代表暗色过。
 *
 * 只收 serious 与 critical。axe 的 minor / moderate 里有大量「建议」性质的条目
 * （比如页面该有 region 划分），一并算失败会让这个检查很快被当成噪声关掉。
 *
 * ── 零容忍 ──
 * 接入时有 119 项存量，靠一份基线文件挡着逐轮清：119 → 84 → 49 → 33 → 0，
 * 四轮清完之后基线一直是空的，于是这里直接写死成「一项都不许有」。
 *
 * 不要再退回「记一份基线、只看新增」那种做法。基线一旦重新长出东西，
 * 这个检查就又变回「反正是红的」，而那种检查迟早会被当成噪声关掉。
 * 真有必须暂缓的，在这个文件里显式列出来并写清为什么，别开一个外部清单。
 *
 * 用法：
 *   node scripts/check-a11y.mjs            # 自己起开发服务器
 *   node scripts/check-a11y.mjs --base=... # 复用已经起好的地址
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

/**
 * 从路由表里抽出所有可直接访问的路径，避免这里再手写一份清单。
 *
 * 子路由要认两种写法：`{ path: 'x', component: … }` 写成一行，
 * 以及组件名太长时换行写的 `{\n  path: 'x',`。
 * 只认一行的那种时，用换行写法新加的页面会被静默跳过——
 * 检查照常报绿，而那一页从来没被扫过。这里出过一次：
 * code-block 与 float-button 两页加进来之后，扫描数一直停在 112。
 */
function routesFromSource() {
  const src = readFileSync('src/router/index.ts', 'utf8')
  const paths = ['/']
  let group = ''
  for (const line of src.split('\n')) {
    const parent = /path: '(\/[a-z-]*)',\s*$/.exec(line)
    if (parent) {
      group = parent[1]
      // 父路由也可能承载默认子页面（组件总览、资源页），必须纳入扫描。
      paths.push(group)
      continue
    }
    const child = /^\s*(?:\{\s*)?path: '([a-z0-9-]+)'/.exec(line)
    if (child && group) paths.push(`${group}/${child[1]}`)
  }
  return [...new Set(paths)]
}

const baseArg = process.argv.find((a) => a.startsWith('--base='))
const port = 5178
let server = null

if (!baseArg) {
  server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { stdio: 'ignore' })
  // 开发服务器起得慢，直接轮询到能连上为止，而不是猜一个等待时长
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
const problems = []
let scanned = 0

try {
  for (const theme of ['light', 'dark']) {
    // axe 要求页面来自显式的 context（browser.newPage 的隐式 context 它不认）
    /*
     * 关掉动效再扫。
     *
     * 页面上的进场动效是淡入的，axe 若在淡入过程中取样，量到的是半透明状态下的
     * 颜色——同一份代码两次跑出不同结果。一个会随机翻红的检查比没有检查更糟，
     * 因为没人再愿意相信它。reducedMotion 管住 CSS 媒体查询，
     * data-motion 管住主题面板那一路，两条都要关。
     */
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: theme,
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    for (const path of routesFromSource()) {
      await page.goto(`${base}/#${path}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => {
        document.documentElement.dataset.motion = 'off'
        // 进场元素由 IntersectionObserver 点亮，视口外的那些永远停在 opacity: 0
        for (const el of document.querySelectorAll('.i-reveal')) el.classList.add('is-in')
      })
      await page.waitForTimeout(400)
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      scanned++
      for (const v of violations) {
        if (v.impact !== 'serious' && v.impact !== 'critical') continue
        const where = v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join('、')
        problems.push(`${theme} ${path} — ${v.id}（${v.impact}）：${v.help}\n      ${where}`)
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
  server?.kill()
}

/*
 * 基线按「主题 + 路由 + 规则」记，不记具体选择器：选择器里带着 scoped 样式的
 * data-v 哈希与 nth-child，改一行无关的代码就会变，那样的基线每次都要重记，
 * 很快就没人愿意维护了。
 */
const key = (p) => p.split('\n')[0].replace(/：.*/, '')
const added = [...new Set(problems.map(key))].sort()

if (added.length) {
  console.error('无障碍检查未通过——存量早已清零，这几条是新出现的：')
  for (const line of added) console.error(`  - ${line}`)
  console.error('\n修掉它们。这里是零容忍，别开一个「先记下来以后再说」的清单——' +
    '那样这个检查很快就又变回「反正是红的」。')
  process.exit(1)
}
console.log(`无障碍检查通过：${scanned} 个页面（亮暗两态），零 serious / critical`)
