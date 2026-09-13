/**
 * 动效开关检查：两个开关都必须真的把动效关掉。
 *
 * 这套库有两条关动效的路径，它们服务的是不同的人：
 *
 *   系统设置  `prefers-reduced-motion: reduce` —— 前庭敏感的用户在操作系统里开的，
 *             他们多半不知道站里还另有一个开关。这是可访问性，不是偏好。
 *   主题面板  `data-motion="off"` —— 在这个站里临时关掉看看。
 *
 * 为什么要自动查：漏掉的那一半完全看不出来。开发机上没人会去打开系统的减少动效，
 * 而 CSS 里「列举了一批类名」与「通配兜底」在代码里长得差不多——
 * 前者漏掉七十多个样式文件里的过渡，后者不漏，肉眼读不出这个差别。
 * 这里出过一次：面板开关是通配的，系统设置只列举了进场与视差那二十来个类，
 * 于是系统里开了减少动效的用户，按钮照旧以 0.12s 过渡。
 *
 * 判据是**计算后的过渡时长**，不是 CSS 里有没有那段文字：
 * 规则写了但被更晚的声明盖掉，或者选择器没匹配上，文本检查照样绿。
 *
 * 用法：
 *   node scripts/check-motion.mjs
 *   node scripts/check-motion.mjs --base=http://localhost:5173
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

/*
 * 抽查这几个元素：它们分别来自基础控件、表单控件、文档站自身的样式与
 * 带自定义时长的组件——四处的过渡写在四个不同的文件里，一起变成 0
 * 才说明兜底是通配的而不是又列举了一遍。
 */
const SAMPLES = [
  ['按钮', '.i-button'],
  ['输入框', '.i-input'],
  ['侧栏链接', '.doc-layout__side a'],
  ['分段器滑块', '.i-segmented__thumb']
]

/** 压到接近 0 即可，不要求正好是 0：写法是 0.01ms，为的是仍然触发结束事件 */
const MAX_SECONDS = 0.001

const baseArg = process.argv.find((a) => a.startsWith('--base='))
const port = 5180
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

/** 「0.12s, 0.12s」这种多值取最大的那一个 */
function longest(duration) {
  return Math.max(
    ...duration.split(',').map((part) => {
      const text = part.trim()
      const value = Number.parseFloat(text)
      if (Number.isNaN(value)) return 0
      return text.endsWith('ms') ? value / 1000 : value
    })
  )
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const problems = []

async function durations(reduce, panelOff) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: reduce ? 'reduce' : 'no-preference'
  })
  const page = await context.newPage()
  await page.goto(`${base}/#/components/button`, { waitUntil: 'networkidle' })
  if (panelOff) await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'))
  await page.waitForTimeout(400)
  const found = await page.evaluate(
    (samples) =>
      samples.map(([label, selector]) => {
        const el = document.querySelector(selector)
        return [label, el ? getComputedStyle(el).transitionDuration : null]
      }),
    SAMPLES
  )
  await context.close()
  return found
}

try {
  // 先确认这几个样本平时确实有过渡——都没有的话，下面两轮全绿也说明不了什么
  const idle = await durations(false, false)
  for (const [label, duration] of idle) {
    if (duration === null) problems.push(`样本找不到：${label}（选择器该更新了）`)
    else if (longest(duration) <= MAX_SECONDS) {
      problems.push(`${label} 平时就没有过渡，拿它验证开关说明不了问题`)
    }
  }

  for (const [name, reduce, panelOff] of [
    ['系统设置 prefers-reduced-motion', true, false],
    ['主题面板 data-motion="off"', false, true]
  ]) {
    for (const [label, duration] of await durations(reduce, panelOff)) {
      if (duration === null) continue
      if (longest(duration) > MAX_SECONDS) {
        problems.push(`${name}：${label} 仍有 ${duration} 的过渡`)
      }
    }
  }
} finally {
  await browser.close()
  server?.kill()
}

if (problems.length) {
  console.error('动效开关检查未通过：')
  for (const line of problems) console.error(`  - ${line}`)
  console.error(
    '\n两条路径都要通配兜底，见 packages/common/src/styles/motion.css 末尾那两段。' +
      '\n只按类名列举的话，组件库里七十多个带过渡的样式文件一个也管不到。'
  )
  process.exit(1)
}
console.log(`动效开关检查通过：系统设置与面板开关都把 ${SAMPLES.length} 个样本压到了 0`)
