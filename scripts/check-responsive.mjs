/**
 * 窄屏自适应检查：把文档站每一条路由在手机宽度下跑一遍，横向溢出就算失败。
 *
 * 为什么要自动扫：横向溢出是所有「没做自适应」里最典型、也最容易被漏掉的一种。
 * 桌面上什么都看不出来，手机上却要左右拖着才能读完一行——而写这段样式的人
 * 多半从没在窄屏上打开过它。人工复查一轮能过，下一个演示块加进来又会漏。
 *
 * 两个宽度都扫：
 *   390  当下最常见的手机逻辑宽度
 *   320  还在用的小屏下限。多数溢出只有在这一档才露出来——
 *        `minmax(320px, 1fr)` 这类写法在 390 上恰好装得下，在 320 上就顶破了。
 *
 * 判定用的是 `documentElement.scrollWidth > innerWidth`，也就是**整页真的能左右拖**，
 * 而不是「某个元素比容器宽」：表格、代码块、分段控制器本来就允许自己横向滚动，
 * 那是有意为之，不该算问题。所以只有溢出到视口之外、且祖先里没有横向滚动容器的
 * 元素才会被点名。
 *
 * 除了溢出，这里还量**字在屏幕上真正有多大**。SVG 里的文字会跟着 viewBox
 * 一起缩：图表的 viewBox 曾经恒为 640，在 358px 宽的手机上整体缩到 0.48，
 * 于是 11px 的刻度字实际只有 6px——没有任何检查会红，页面也不溢出，
 * 只是没人读得出刻度。所以把「渲染后不足 9px 的文字」也算失败。
 *
 * 用法：
 *   node scripts/check-responsive.mjs
 *   node scripts/check-responsive.mjs --base=http://localhost:5173
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

/** 与 check-a11y 同一套路由提取：两处各写一份的话，新页面会在其中一处被静默跳过 */
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

const WIDTHS = [390, 320]
/** 一两像素的差多半来自小数取整，不值得为它红一次 */
const TOLERANCE = 1

const baseArg = process.argv.find((a) => a.startsWith('--base='))
const port = 5179
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

/*
 * 渲染后字号的下限。9px 不是好看的下限，是「还认得出是什么字」的下限——
 * 低于它的刻度与标签，读者只能看出那儿有东西。
 */
const MIN_TEXT_PX = 9

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const problems = []
let scanned = 0

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      // 动效期间元素可能还在位移，量到的宽度不作数
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    for (const path of routesFromSource()) {
      await page.goto(`${base}/#${path}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => {
        document.documentElement.dataset.motion = 'off'
        for (const el of document.querySelectorAll('.i-reveal')) el.classList.add('is-in')
      })
      await page.waitForTimeout(250)
      scanned++

      const found = await page.evaluate((tolerance) => {
        const over = document.documentElement.scrollWidth - window.innerWidth
        if (over <= tolerance) return null
        const culprits = []
        for (const el of document.querySelectorAll('body *')) {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.right <= window.innerWidth + tolerance) continue
          // 祖先里有横向滚动容器的，是有意让它自己滚，不算问题
          let host = el.parentElement
          let scrollable = false
          while (host) {
            const overflowX = getComputedStyle(host).overflowX
            if (overflowX === 'auto' || overflowX === 'scroll') {
              scrollable = true
              break
            }
            host = host.parentElement
          }
          if (scrollable) continue
          const cls = [...el.classList].join('.')
          culprits.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`)
        }
        return { over, culprits: [...new Set(culprits)].slice(0, 3) }
      }, TOLERANCE)

      // 量渲染后的实际字号：SVG 文字跟着 viewBox 缩，声明 11px 不代表屏幕上是 11px
      const tiny = await page.evaluate((min) => {
        const out = []
        for (const el of document.querySelectorAll('svg text')) {
          const text = (el.textContent ?? '').trim()
          if (!text) continue
          const box = el.getBoundingClientRect()
          if (box.height === 0) continue
          // 用包围盒高度近似字号：它已经包含了 viewBox 的缩放
          if (box.height < min) {
            const cls = [...el.classList].join('.')
            out.push(`${cls || el.tagName}「${text.slice(0, 8)}」${box.height.toFixed(1)}px`)
          }
        }
        return [...new Set(out)].slice(0, 3)
      }, MIN_TEXT_PX)

      if (tiny.length) {
        problems.push(
          `${width}px ${path} — SVG 文字缩得读不了（不足 ${MIN_TEXT_PX}px）：${tiny.join('、')}`
        )
      }

      if (found) {
        problems.push(
          `${width}px ${path} — 横向溢出 ${found.over}px：${found.culprits.join('、') || '(未定位到具体元素)'}`
        )
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
  server?.kill()
}

if (problems.length) {
  console.error('窄屏自适应检查未通过——这些页面在手机宽度下会左右拖动，或者字小到读不出来：')
  for (const line of problems) console.error(`  - ${line}`)
  console.error(
    '\n修掉它们。常见成因：固定 `width: NNNpx`（改成 `width: min(NNNpx, 100%)`）、' +
      '`minmax(NNNpx, 1fr)`（改成 `minmax(min(NNNpx, 100%), 1fr)`）、' +
      'flex / grid 子项忘了 `min-width: 0`。\n' +
      '确实该自己横向滚动的（宽表格、代码块），给它套一层 `overflow-x: auto` 的容器。'
  )
  process.exit(1)
}
console.log(
  `窄屏自适应检查通过：${scanned} 个页面（${WIDTHS.join(' / ')}px），` +
    `无横向溢出，SVG 文字渲染后都不小于 ${MIN_TEXT_PX}px`
)
