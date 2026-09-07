/**
 * 跨端一致性校验。
 *
 * 设计体系最容易腐化的地方，是各端各自改了一点点值。这个脚本把所有端的令牌
 * 拉到一起逐值比对，任何一端偏离都会让它失败——放进 CI 就能挡住这类漂移。
 *
 * 覆盖：CSS（Web）/ WXSS（小程序）/ JSON / Dart（Flutter）四份产物，
 * 以及 Avatar 配色规则在 TS 与 Dart 两处实现的一致性。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const base = 'packages/common/dist/tokens'
const fail = []
const ok = []

function check(name, condition, detail = '') {
  ;(condition ? ok : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)
}

/* ---------- 1. 各端令牌数量与值一致 ---------- */
const json = JSON.parse(readFileSync(`${base}/tokens.json`, 'utf8'))
const css = readFileSync(`${base}/tokens.css`, 'utf8')
const wxss = readFileSync(`${base}/tokens.wxss`, 'utf8')
const dart = readFileSync(`${base}/tokens.dart`, 'utf8')

const parseVars = (text, block) => {
  const section = text.split(block)[1]?.split('}')[0] ?? ''
  const out = {}
  for (const [, k, v] of section.matchAll(/--i-([\w-]+):\s*([^;]+);/g)) out[k] = v.trim()
  return out
}

const cssLight = parseVars(css, ':root {')
const wxssLight = parseVars(wxss, 'page {')

check('CSS 令牌数与 JSON 一致', Object.keys(cssLight).length === Object.keys(json.light).length,
  `${Object.keys(cssLight).length} vs ${Object.keys(json.light).length}`)
check('WXSS 令牌数与 JSON 一致', Object.keys(wxssLight).length === Object.keys(json.light).length,
  `${Object.keys(wxssLight).length} vs ${Object.keys(json.light).length}`)

const mismatched = Object.entries(json.light).filter(([k, v]) => cssLight[k] !== v || wxssLight[k] !== v)
check('CSS / WXSS 每个令牌值与 JSON 逐一相等', mismatched.length === 0,
  mismatched.length ? `偏离: ${mismatched.slice(0, 3).map(([k]) => k).join(', ')}` : '')

/* ---------- 2. Dart 颜色与 CSS 逐值等价 ---------- */
const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const dartLight = dart.split('class IDesignTokensLight')[1].split('class ')[0]

function cssColorToArgb(value) {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return `0xFF${v.slice(1).toUpperCase()}`
  const m = v.match(/^rgba?\(([^)]+)\)$/i)
  if (!m) return null
  const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim())
  const alpha = Math.round(parseFloat(a) * 255).toString(16).padStart(2, '0')
  const hex = [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
  return `0x${(alpha + hex).toUpperCase()}`
}

let colorChecked = 0
const colorBad = []
for (const [key, value] of Object.entries(json.light)) {
  const expected = cssColorToArgb(value)
  if (!expected) continue
  const m = dartLight.match(new RegExp(`static const ${camel(key)} = Color\\((0x[0-9A-F]+)\\);`))
  if (!m) { colorBad.push(`${key} 缺失`); continue }
  colorChecked++
  if (m[1] !== expected) colorBad.push(`${key}: dart ${m[1]} vs css ${value} → ${expected}`)
}
check(`Dart 颜色与 CSS 等价（已校验 ${colorChecked} 个）`, colorBad.length === 0, colorBad.slice(0, 3).join('; '))

/* ---------- 3. Dart 尺寸为 double ---------- */
const intSizes = [...dartLight.matchAll(/static const double (\w+) = (\d+);/g)]
check('Dart 尺寸声明为 double（整数会让 EdgeInsets 编译失败）', intSizes.length === 0,
  intSizes.slice(0, 3).map((m) => m[1]).join(', '))

/* ---------- 4. 共享样式不得出现会全局泄漏的通用选择器 ---------- */
/*
 * 组件样式从 Vue 的 scoped 块抽到全局后，像 .is-left / .is-error 这类通用状态类
 * 会命中页面上任何带同名类的元素。曾经就有 tooltip 的 .is-left 把 Form 的
 * 「标签左置」整体上移 83px——布局错乱，而构建与类型检查全绿。
 */
const styleDir = 'packages/common/src/styles/components'
const leaks = []
for (const file of readdirSync(styleDir).filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(`${styleDir}/${file}`, 'utf8')
  for (const match of css.matchAll(/^([^\s@{/][^{]*)\{/gm)) {
    for (const part of match[1].split(',')) {
      const first = part.trim().split(/\s+/)[0]
      if (first.startsWith('.') && !first.includes('.i-')) leaks.push(`${file}: ${first}`)
    }
  }
}
check('共享样式无全局泄漏的通用选择器', leaks.length === 0, leaks.slice(0, 4).join('; '))

/* ---------- 5. Vue 2 端不得残留 Vue 3 专有语法 ---------- */
/*
 * 转换器的产物必须真的能被 Vue 2.7 编译。这里静态拦下三类已经踩过的坑：
 *   modelValue      —— Vue 2 的 v-model 走 value / input
 *   模板里的 as 断言 —— Vue 2 的模板表达式解析器不认，直接语法错
 *   Teleport        —— 2.7 没有，须用 _Portal.vue
 */
const vue2Dir = 'packages/vue/src/components'
const vue2Issues = []
for (const file of readdirSync(vue2Dir).filter((f) => f.endsWith('.vue'))) {
  // 注释里可能正当地提到这些词（比如解释「为什么不把 modelValue 改名成 value」），
  // 只检查代码本身，否则说明性文字会被误判为残留语法。
  const src = readFileSync(`${vue2Dir}/${file}`, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
  const tpl = src.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? ''
  if (/\bmodelValue\b/.test(src)) vue2Issues.push(`${file}: 残留 modelValue`)
  if (/\s+as\s+[A-Z]/.test(tpl)) vue2Issues.push(`${file}: 模板含 TS 断言`)
  if (/<Teleport/i.test(tpl)) vue2Issues.push(`${file}: 使用了 Teleport`)
}
check('Vue 2 产物无 Vue 3 专有语法', vue2Issues.length === 0, vue2Issues.slice(0, 3).join('; '))

/* ---------- 6. Avatar 配色规则 TS 与 Dart 一致 ---------- */
execFileSync('node_modules/.bin/esbuild',
  ['packages/common/src/logic/avatar.ts', '--bundle', '--format=esm', '--outfile=/tmp/parity-avatar.mjs'],
  { stdio: 'pipe' })
const { avatarPalette, initialsOf, tintOf } = await import('/tmp/parity-avatar.mjs')

const dartAvatar = readFileSync('packages/flutter/lib/src/components/i_avatar.dart', 'utf8')
const dartPalette = [...dartAvatar.matchAll(/Color\(0xFF([0-9A-F]{6})\)/g)].map((m) => `#${m[1].toLowerCase()}`)
check('Avatar 调色板 TS 与 Dart 一致',
  JSON.stringify(dartPalette) === JSON.stringify(avatarPalette),
  `dart ${dartPalette.length} 色 vs ts ${avatarPalette.length} 色`)

// 用 TS 实现算出期望值，作为 Flutter 端的验收基准写进报告
const samples = ['林岚', '陈序', '苏禾', '周迟', 'Susan Wong']
const expectations = samples.map((n) => `${n} → ${JSON.stringify(initialsOf(n))} ${tintOf(n)}`)

/* ---------- 报告 ---------- */
console.log('跨端一致性校验\n')
for (const line of ok) console.log(`  通过  ${line}`)
for (const line of fail) console.log(`  失败  ${line}`)
console.log('\nAvatar 跨端期望值（各端实现必须与此逐值相同）:')
for (const e of expectations) console.log(`  ${e}`)

if (fail.length) {
  console.error(`\n${fail.length} 项未通过`)
  process.exit(1)
}
console.log(`\n全部 ${ok.length} 项通过`)
