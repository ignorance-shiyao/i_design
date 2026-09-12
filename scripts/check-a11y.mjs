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
 * ── 基线 ──
 * 首次接入时存量问题不少（多数是文档站自己的对比度与示例里没写标签的控件）。
 * 一次性清零不现实，而一个「反正是红的」的检查等于没有检查。
 * 所以记一份基线：**只有新增的问题才算失败**，基线里的旧问题照常列出来提醒，
 * 但不挡住构建。修好之后跑一次 --update 把基线缩小——它只能变小，不会变大。
 *
 * 用法：
 *   node scripts/check-a11y.mjs            # 自己起开发服务器
 *   node scripts/check-a11y.mjs --base=... # 复用已经起好的地址
 *   node scripts/check-a11y.mjs --update   # 重写基线（修完之后跑）
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

/** 从路由表里抽出所有可直接访问的路径，避免这里再手写一份清单 */
function routesFromSource() {
  const src = readFileSync('src/router/index.ts', 'utf8')
  const paths = ['/']
  let group = ''
  for (const line of src.split('\n')) {
    const parent = /path: '(\/[a-z-]*)',\s*$/.exec(line)
    if (parent) group = parent[1]
    const child = /\{ path: '([a-z0-9-]+)'/.exec(line)
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
const BASELINE = 'docs/a11y-baseline.json'
const key = (p) => p.split('\n')[0].replace(/：.*/, '')
const current = [...new Set(problems.map(key))].sort()

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n')
  console.log(`基线已更新：${current.length} 项存量问题（${scanned} 个页面）`)
  process.exit(0)
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : []
const added = current.filter((k) => !baseline.includes(k))
const fixed = baseline.filter((k) => !current.includes(k))

if (added.length) {
  console.error('无障碍检查未通过——出现了基线之外的新问题：')
  for (const line of added) console.error(`  - ${line}`)
  console.error('\n修掉它们；确认是误报再动基线（node scripts/check-a11y.mjs --update）。')
  process.exit(1)
}
console.log(`无障碍检查通过：${scanned} 个页面（亮暗两态），无新增问题`)
if (current.length) console.log(`  存量 ${current.length} 项待清理，见 ${BASELINE}`)
if (fixed.length) console.log(`  已修好 ${fixed.length} 项，跑 --update 把基线缩小`)
