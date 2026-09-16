/**
 * 桌面宽度的版面检查：行长与撑高的空白。
 *
 * check:responsive 只在 390 / 320 两个手机宽度上跑，查的是「装不装得下」。
 * 可是把版面做烂的两件事恰恰只在宽屏上出现，手机上一点痕迹都没有：
 *
 *   行长失控    内容区在 1440 上有 1000px 宽，一段说明文字不加约束就一行排到底。
 *               量出来曾经是一行 71 个汉字：读到行尾再回到下一行行首，
 *               眼睛要横扫整整 1000px，很容易串行。手机上一行只有十几个字，
 *               所以窄屏的检查永远是绿的。
 *   撑高的空白  网格默认 `align-items: stretch`，一行里所有格子被最高的那个拉齐，
 *               拉出来的高度灌进卡片内部，成片的灰底或白底。Patterns Lab 曾经
 *               18% 的网格高度是这么来的，最惨一格被拉高 224px。
 *               手机上是单列，一行只有一格，同样查不出来。
 *
 * 两项都量**渲染之后的结果**，不看 CSS 里写了什么：
 *
 *   行长    用 Range 取每一行文字的实际矩形，除以该元素的字号。
 *           一个汉字约合 1em，所以这个比值就是「一行几个汉字」。
 *           `max-width` 写没写、被谁盖掉了、选择器有没有命中，都不影响这个数。
 *   撑高    把网格的 `align-items` 在 stretch 与 start 之间切一次，逐格对比高度。
 *           差出来的就是被拉出来的空白，不需要去猜「内容到底占了多高」。
 *
 * 代码块、表格、SVG 里的文字不算行长：它们的宽度由内容定，截断只会逼出横向滚动。
 * 只有整片网格的子项都是卡片（四边有框，或有底色且有圆角）才算卡片网格——
 * 组件内部那些用网格拼出来的构件不在此列。
 *
 * 用法：
 *   node scripts/check-layout.mjs
 *   node scripts/check-layout.mjs --base=http://localhost:5173
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

/*
 * 一行最多几个汉字。排版上常说的舒适区间是 35–50 个汉字，
 * 站里的正文上限（90ch）量出来是 50，这里取 52 留两个字的余量——
 * 字体换一版、字号差半像素，不该让检查变红。
 */
export const MAX_MEASURE = 52

/*
 * 单格被拉高多少算撑。卡片之间为了对齐差个二三十像素是正常的版面处理，
 * 48px 已经是三行正文的高度——到这一步，读者看到的是一片空底。
 */
export const MAX_STRETCH_PX = 48

/*
 * 整片网格里撑出来的空白占比，作为第二张网。
 *
 * 为什么单看占比不行：一排卡片为了对齐差个二十来像素是正常的版面处理，
 * 六格里凑一凑就能到 10%，但读者看不出任何问题。真正读得出来的是**某一格**
 * 被拉出一大片空底，所以主判据是上面那个绝对值。
 * 占比这一档留给「每格都撑了一点、加起来整片都是空的」那种情况，取 25%。
 */
export const MAX_STRETCH_PCT = 25

/** 桌面宽度。1440 是最常见的笔记本逻辑宽度，也是行长问题最明显的一档 */
export const WIDTH = 1440

/**
 * 在页面里跑的那一段。导出是为了让 check-layout.test.mjs
 * 拿同一份实现去量注入了故障的页面——检查本身也得有人查。
 */
export function auditInPage({ maxMeasure, maxStretchPx, maxStretchPct }) {
  const root = document.querySelector('main') || document.body
  const findings = []

  // ——— 行长 ———
  const longest = new Map()
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walk.nextNode())) {
    if (node.nodeValue.trim().length < 30) continue
    const host = node.parentElement
    // 宽度由内容决定的东西不参与：截断它们只会逼出横向滚动
    if (!host || host.closest('code, pre, table, svg')) continue
    const size = parseFloat(getComputedStyle(host).fontSize)
    if (!size || size < 12) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0)
    // 只有一行的短句没有「回到下一行行首」这回事，不算段落
    if (rects.length < 2) continue
    const measure = Math.max(...rects.map((r) => r.width)) / size
    if (measure <= maxMeasure) continue
    const cls = [...host.classList].join('.')
    const key = `${host.tagName.toLowerCase()}${cls ? '.' + cls : ''}`
    if (!longest.has(key) || measure > longest.get(key)) longest.set(key, measure)
  }
  for (const [key, measure] of longest) {
    findings.push({
      kind: '行长',
      selector: key,
      detail: `一行 ${Math.round(measure)} 个汉字（上限 ${maxMeasure}）`
    })
  }

  // ——— 撑高的空白 ———
  /** 写明理由后豁免的网格，原样报出来给人看 */
  const exempted = []
  const isCard = (el) => {
    const cs = getComputedStyle(el)
    const framed = ['Top', 'Right', 'Bottom', 'Left'].every(
      (side) => parseFloat(cs[`border${side}Width`]) > 0
    )
    const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(cs.borderRadius) > 0
    return framed || filled
  }
  for (const grid of root.querySelectorAll('*')) {
    const cs = getComputedStyle(grid)
    // `normal` 就是没写过 align-items，即默认的 stretch
    if (cs.display !== 'grid' || cs.alignItems !== 'normal') continue
    /*
     * 唯一的豁免口：格子里的空白**本身就是可交互的落点**（看板的列、日历的格）。
     * 那里的空白不是浪费——把列压到内容高度，一个空列就没地方放卡片了。
     *
     * 豁免必须写明理由（`data-stretch-reason` 的内容），空着不算：
     * 一个不用写理由的开关，半年之后会出现在每一个被这条检查拦下的网格上。
     * 理由会原样打进报告，好让下一个人看见它并判断还成不成立。
     */
    const reason = grid.getAttribute('data-stretch-reason')
    if (reason && reason.trim()) {
      exempted.push({
        selector: `${grid.tagName.toLowerCase()}${[...grid.classList].map((c) => '.' + c).join('')}`,
        reason: reason.trim()
      })
      continue
    }
    const cells = [...grid.children].filter((c) => c.getBoundingClientRect().height > 0)
    if (cells.length < 3 || !cells.every(isCard)) continue

    const stretched = cells.map((c) => c.getBoundingClientRect().height)
    const inline = grid.style.alignItems
    grid.style.alignItems = 'start'
    const natural = cells.map((c) => c.getBoundingClientRect().height)
    grid.style.alignItems = inline

    let waste = 0
    let total = 0
    let worst = 0
    stretched.forEach((h, i) => {
      const gap = h - natural[i]
      waste += gap
      total += h
      if (gap > worst) worst = gap
    })
    if (!total) continue
    const pct = (waste / total) * 100
    if (worst <= maxStretchPx && pct <= maxStretchPct) continue
    const cls = [...grid.classList].join('.')
    findings.push({
      kind: '撑高',
      selector: `${grid.tagName.toLowerCase()}${cls ? '.' + cls : ''}`,
      detail:
        `${cells.length} 格里撑出 ${Math.round(pct)}% 的空白，` +
        `最惨一格被拉高 ${Math.round(worst)}px（上限 ${maxStretchPx}px / ${maxStretchPct}%）`
    })
  }

  return { findings, exempted }
}

/** 与 check-a11y / check-responsive 同一套路由提取：各写一份的话，新页面会在其中一处被静默跳过 */
export function routesFromSource(src) {
  const paths = ['/']
  let group = ''
  for (const line of src.split('\n')) {
    const parent = /path: '(\/[a-z-]*)',\s*$/.exec(line)
    if (parent) {
      group = parent[1]
      // 父路由也可能承载默认子页面（组件总览、资源页），必须纳入扫描——
      // 三条浏览器检查扫的页面集合不一致的话，同一个问题会在这条里查不出来
      paths.push(group)
      continue
    }
    const child = /^\s*(?:\{\s*)?path: '([a-z0-9-]+)'/.exec(line)
    if (child && group) paths.push(`${group}/${child[1]}`)
  }
  return [...new Set(paths)]
}

/* 被 import 时（故障注入测试）不跑整站，只提供上面这些 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseArg = process.argv.find((a) => a.startsWith('--base='))
  const port = 5181
  let server = null

  if (!baseArg) {
    server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { stdio: 'ignore' })
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`http://localhost:${port}/`)
        if (res.ok) break
      } catch {
        /* 还没起来 */
      }
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  const base = baseArg ? baseArg.slice('--base='.length) : `http://localhost:${port}`

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const problems = []
  const exemptions = new Map()
  let scanned = 0

  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: 900 },
      // 动效期间元素还在位移，量到的宽高不作数
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    for (const path of routesFromSource(readFileSync('src/router/index.ts', 'utf8'))) {
      await page.goto(`${base}/#${path}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => {
        document.documentElement.dataset.motion = 'off'
        for (const el of document.querySelectorAll('.i-reveal')) el.classList.add('is-in')
      })
      await page.waitForTimeout(400)
      scanned++
      const { findings, exempted } = await page.evaluate(auditInPage, {
        maxMeasure: MAX_MEASURE,
        maxStretchPx: MAX_STRETCH_PX,
        maxStretchPct: MAX_STRETCH_PCT
      })
      for (const f of findings) problems.push(`${path} — ${f.kind}：${f.selector} ${f.detail}`)
      // 豁免不是静音：每一条都报出来，好让下一个人看见理由并判断还成不成立
      for (const e of exempted) exemptions.set(`${e.selector} —— ${e.reason}`, true)
    }
    await context.close()
  } finally {
    await browser.close()
    server?.kill()
  }

  if (exemptions.size) {
    console.log(`按内容定高这条有 ${exemptions.size} 处写明理由的豁免：`)
    for (const line of exemptions.keys()) console.log(`  · ${line}`)
  }

  if (problems.length) {
    console.error(`桌面版面检查未通过（${WIDTH}px）：`)
    for (const line of problems) console.error(`  - ${line}`)
    console.error(
      '\n行长：给段落加 `max-width: var(--doc-measure)`（90ch ≈ 45 个汉字）。' +
        '只封顶不撑宽，窄容器里这条规则什么也不做。\n' +
        '撑高：让格子按自己的内容定高。`align-items: start` 只是把空白从格子里挪到格子之间，' +
        '页面一样长；高矮差得远的清单改用多列（`column-width` + `break-inside: avoid`）。\n' +
        '格子里的空白本身就是落点（看板的列、日历的格）时，在网格上写 ' +
        '`data-stretch-reason="…"` 说明理由——理由会打进报告，空着的不算豁免。'
    )
    process.exit(1)
  }
  console.log(
    `桌面版面检查通过：${scanned} 个页面（${WIDTH}px），` +
      `正文一行不超过 ${MAX_MEASURE} 个汉字，卡片网格没有撑出成片的空白`
  )
}
