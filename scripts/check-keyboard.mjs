/**
 * 键盘可用性检查（astra.md 的 H03：「焦点可见且顺序可用」）。
 *
 * 只用键盘的人、以及任何一个把手从鼠标上挪开的人，都靠两件事在页面上定位自己：
 * **焦点看得见**，以及**焦点落在该落的地方**。这两件事坏掉的时候，页面照样能用
 * 鼠标操作，所以开发机上一眼看不出来——axe 也查不出，它不模拟 Tab。
 *
 * 这里查三条，都是「坏了也不报错」的那类：
 *
 * **一、焦点必须看得见。** `outline: none` 是重置样式里最常见的一句，写下去之后
 * 按 Tab 的人就再也不知道自己在哪儿。判据是**聚焦前后计算样式的差异**，
 * 不是 CSS 里有没有写 `:focus-visible`——规则写了但被更晚的声明盖掉、
 * 或者选择器没匹配上，读文本的检查照样绿。
 *
 * **二、焦点不能落进看不见的东西里。** 收起的面板、隐藏的单元格、
 * `display: none` 之后忘了摘掉 tabindex 的元素——焦点掉进去，屏幕上什么也不动，
 * 用户以为按键坏了，实际上他正停在一个不存在的按钮上。
 *
 * **三、能聚焦的东西必须能被读出来。** 一个没有任何可访问名称的按钮，
 * 读屏器只会念「按钮」。这条与 axe 的规则有重叠，但 axe 只看静态 DOM，
 * 这里走的是真实 Tab 序——只有在 Tab 到它的时候才存在的元素（浮层里的关闭按钮）
 * 只有这样才查得到。
 *
 * 用法：
 *   node scripts/check-keyboard.mjs
 *   node scripts/check-keyboard.mjs --base=http://localhost:4173
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

/** 每页最多走多少次 Tab。走完整站太慢，而前几十个足以覆盖页面的主干 */
export const MAX_TABS = 40

/**
 * 在页面里跑一轮 Tab，逐个记下焦点元素的可见性、可访问名与聚焦前后的样式差异。
 *
 * 这个函数整体被 `page.evaluate` 送进浏览器执行，因此不能引用模块作用域里的东西。
 */
export async function auditInPage({ maxTabs }) {
  /*
   * 一个元素「看起来是什么样」的指纹。
   *
   * 轮廓不存在时，把颜色与偏移一并抹平：`outline: none` 只重置样式与宽度，
   * **不重置 outline-offset**。于是「偏移从 0px 变成 2px」会被算成一次变化，
   * 而一个不存在的轮廓偏移多少都看不见——判据就这样被悄悄放宽成永远通过。
   * 这个坑我自己先踩了一次：故障注入把 outline 抹掉，检查却说没问题。
   */
  const focusStyle = (el) => {
    const cs = getComputedStyle(el)
    const invisibleOutline = cs.outlineStyle === 'none' || Number.parseFloat(cs.outlineWidth) === 0
    return [
      cs.outlineStyle,
      cs.outlineWidth,
      invisibleOutline ? '-' : cs.outlineColor,
      invisibleOutline ? '-' : cs.outlineOffset,
      cs.boxShadow,
      cs.borderColor,
      cs.backgroundColor,
      cs.textDecorationLine
    ].join('|')
  }

  /** 可访问名：拿 aria-label / aria-labelledby / 自身文字 / title / alt 里的第一个 */
  const accessibleName = (el) => {
    const label = el.getAttribute('aria-label')
    if (label && label.trim()) return label.trim()
    const labelledby = el.getAttribute('aria-labelledby')
    if (labelledby) {
      const text = labelledby
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ')
        .trim()
      if (text) return text
    }
    if (el.labels?.length) {
      const text = [...el.labels].map((l) => l.textContent ?? '').join(' ').trim()
      if (text) return text
    }
    const own = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (own) return own
    for (const attr of ['title', 'alt', 'placeholder', 'value']) {
      const v = el.getAttribute(attr)
      if (v && v.trim()) return v.trim()
    }
    return ''
  }

  const describe = (el) => {
    const cls = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('')
    return `${el.tagName.toLowerCase()}${cls}`
  }

  /*
   * 等两帧再量。切类的时机有走微任务的（Vue），也有走 rAF 的，只等一帧的话
   * 后者还没落下去，量到的是上一态。
   *
   * 这个等待在页面里做完，不经由 exposeFunction 往返 Node：每个焦点位要等两次，
   * 全站两千多个焦点位就是五千次往返，实测能让整条检查慢上五分钟。
   */
  const nextPaint = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))

  const findings = []
  const seen = new Set()
  let visited = 0

  document.body.focus()
  for (let i = 0; i < maxTabs; i += 1) {
    const before = document.activeElement
    // 聚焦前的样子要在它还没被聚焦时量：量完再按 Tab
    const nextStyleBefore = new Map()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    before?.dispatchEvent(event)
    await window.__tab()

    const el = document.activeElement
    if (!el || el === document.body || el === before) break
    const key = describe(el) + '#' + [...document.querySelectorAll('*')].indexOf(el)
    if (seen.has(key)) break
    seen.add(key)
    visited += 1

    /*
     * 焦点指示**未必画在被聚焦的元素自己身上**，这是正确写法而不是缺陷：
     * 单选、复选框把原生 input 视觉隐藏，焦点环画在旁边那个 span 上；
     * 输入框把环画在外层容器上（:focus-within）。所以两条判据都要看
     * 「这一小片区域」而不是单个元素——用户关心的是看不看得见焦点，
     * 不是焦点环挂在哪个标签上。
     */
    const neighbourhood = (node) => {
      const nodes = new Set()
      let cursor = node
      for (let up = 0; up < 3 && cursor; up += 1) {
        nodes.add(cursor)
        for (const child of cursor.children) nodes.add(child)
        cursor = cursor.parentElement
      }
      return [...nodes]
    }
    const signature = (nodes) => nodes.map(focusStyle).join('~')

    const around = neighbourhood(el)
    const rect = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const selfInvisible =
      cs.display === 'none' ||
      cs.visibility === 'hidden' ||
      Number.parseFloat(cs.opacity) === 0 ||
      (rect.width === 0 && rect.height === 0) ||
      !!el.closest('[aria-hidden="true"]')

    /*
     * 两端都等一帧再量。焦点指示未必是纯 CSS 画的：框架在 focus/blur 时切类，
     * DOM 更新是异步的（Vue 走微任务，也有组件走 requestAnimationFrame）。
     * 只在 blur 那一侧等、聚焦这一侧不等，量到的「聚焦态」其实是还没上样式的样子，
     * 两次一模一样——于是一个完全正常的组件被报成「焦点不可见」。
     * 这个不对称我自己先写错了一次，故障注入里那条 rAF 用例就是钉住它的。
     */
    await nextPaint()
    const focused = around.map(focusStyle)
    el.blur()
    /*
     * 等一帧再量：焦点环未必是纯 CSS 画的。IInputNumber 与 IPromptInput 都是
     * 由 JS 在 focus/blur 时切一个 is-focused 类，而框架更新 DOM 是异步的——
     * blur() 之后立刻量，类还挂在上面，两次量出来一模一样，
     * 于是一个完全正常的组件被报成「焦点不可见」。这一步是为了不冤枉它们。
     */
    await nextPaint()
    const blurred = around.map(focusStyle)
    el.focus()
    await nextPaint()

    /*
     * 判据是「有没有**看得见的**东西跟着变」，不是「焦点环画在谁身上」。
     *
     * 看「跟着变的那个元素可不可见」而不是「周围有没有可见元素」：
     * body 与 html 永远可见，拿它们当依据的话，这条判断永远成立，
     * 隐藏焦点那一类就再也报不出来了——这个错我自己先犯了一次。
     */
    const changed = around.filter((node, index) => focused[index] !== blurred[index])
    const changedVisible = changed.some((node) => {
      const box = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return (
        box.width > 0 &&
        box.height > 0 &&
        style.visibility !== 'hidden' &&
        Number.parseFloat(style.opacity) > 0
      )
    })

    if (!changed.length) {
      findings.push({
        kind: '焦点不可见',
        selector: describe(el),
        detail: '聚焦前后这一片的计算样式完全一致，屏幕上没有任何变化'
      })
      continue
    }

    /*
     * 元素自己看不见，而跟着变的也全是看不见的东西——焦点掉进了黑洞：
     * 用键盘的人按到它时屏幕上什么也不动，他会以为按键坏了。
     * 「悬停才显形、聚焦时会显形」的轮播箭头不落在这里：它聚焦时自己就亮了。
     */
    if (selfInvisible && !changedVisible) {
      findings.push({
        kind: '隐藏焦点',
        selector: describe(el),
        detail: '焦点落在看不见的元素上，也没有看得见的焦点指示跟着出现'
      })
      continue
    }

    if (!accessibleName(el)) {
      findings.push({ kind: '无名可聚焦元素', selector: describe(el), detail: '读屏器只会念出控件类型' })
    }
  }

  return { findings, visited }
}

/** 从路由表里取出要扫的路径，与另外几条浏览器检查同一口径（含父路由） */
export function routesFromSource(src) {
  const paths = []
  let group = ''
  for (const line of src.split('\n')) {
    const parent = /path: '(\/[a-z-]*)',\s*$/.exec(line)
    if (parent) {
      group = parent[1]
      paths.push(group)
      continue
    }
    const child = /^\s*(?:\{\s*)?path: '([a-z0-9-]+)'/.exec(line)
    if (child && group) paths.push(`${group}/${child[1]}`)
  }
  return [...new Set(paths)]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseArg = process.argv.find((a) => a.startsWith('--base='))
  const port = 5183
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
  const problems = []
  let scanned = 0
  let stops = 0

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    // 把真实的 Tab 交给 Playwright 按：在页面里派发 KeyboardEvent 不会移动焦点
    await page.exposeFunction('__tab', () => page.keyboard.press('Tab'))

    for (const path of routesFromSource(readFileSync('src/router/index.ts', 'utf8'))) {
      await page.goto(`${base}/#${path}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => {
        document.documentElement.dataset.motion = 'off'
        for (const el of document.querySelectorAll('.i-reveal')) el.classList.add('is-in')
      })
      await page.waitForTimeout(300)
      scanned += 1
      const { findings, visited } = await page.evaluate(auditInPage, { maxTabs: MAX_TABS })
      stops += visited
      for (const f of findings) problems.push(`${path} — ${f.kind}：${f.selector}（${f.detail}）`)
    }
    await context.close()
  } finally {
    await browser.close()
    server?.kill()
  }

  if (problems.length) {
    console.error('键盘可用性检查未通过：')
    // 同一个组件会在多页出现，逐页重复报没有意义，按问题去重
    const unique = [...new Set(problems.map((p) => p.slice(p.indexOf('—'))))]
    for (const line of unique.slice(0, 40)) console.error(`  - ${line}`)
    if (unique.length > 40) console.error(`  …… 还有 ${unique.length - 40} 条`)
    console.error(
      '\n焦点不可见：别用 `outline: none` 收尾，给 :focus-visible 一个看得见的轮廓。\n' +
        '隐藏焦点：收起的内容要一并移出 Tab 序（display:none 或 inert），不能只是看不见。\n' +
        '无名可聚焦元素：给它 aria-label，或者让它自己带上文字。'
    )
    process.exit(1)
  }
  console.log(`键盘可用性检查通过：${scanned} 个页面，走过 ${stops} 个焦点位，都看得见、有名字、不在隐藏区里`)
}
