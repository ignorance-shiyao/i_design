/**
 * 故障注入 + 反向用例。
 *
 * 反向用例和禁令本身一样重要：这套禁令有明确的例外（几何三角形、纹理与氛围底、
 * 取色器里那块「渐变本身就是数据」的色面）。误报会逼着人把检查关掉，
 * 那比没有检查更糟。
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkStyleRules } from './check-style-rules.mjs'

function fixture(t, css) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-style-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src/styles'), { recursive: true })
  mkdirSync(join(root, 'packages/common/src/icons'), { recursive: true })
  writeFileSync(join(root, 'packages/common/src/icons/index.ts'),
    "export const icons = {\n  check: 'M4 12.5 9 17.5 20 6.5',\n}\n")
  writeFileSync(join(root, 'src/styles/probe.css'), css)
  return root
}

const rejects = (t, css, error) =>
  assert.throws(() => checkStyleRules(fixture(t, css)), error)
const passes = (t, css) =>
  assert.match(checkStyleRules(fixture(t, css)), /样式禁令检查通过/)

test('当前仓库通过', () => {
  assert.match(checkStyleRules(), /样式禁令检查通过/)
})

test('用加粗边线标状态或类型时失败', (t) => {
  rejects(t, '.i-alert--danger { border-left: 3px solid var(--i-color-danger); }', /加粗边线表达状态/)
  rejects(t, '.i-card--active { border-top: 4px solid var(--i-color-brand); }', /加粗边线表达状态/)
})

test('靠透明边拼出来的三角形不算边线样式', (t) => {
  passes(t, `.i-sorter i { width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; }
.i-sorter i[data-dir='up'] { border-bottom: 5px solid var(--i-color-border-strong); }`)
})

test('元素填充用渐变时失败', (t) => {
  rejects(t, '.i-badge { background: var(--i-gradient-brand); }', /渐变令牌/)
  rejects(t, '.i-progress__bar { background: linear-gradient(135deg, var(--i-color-brand), var(--i-color-brand-strong)); }', /渐变填充/)
})

test('硬边拼色、半透明氛围层与「渐变即数据」的色面不算填充渐变', (t) => {
  // 进度轨道：两段纯色在同一个位置切开，读出来不是渐变
  passes(t, `.i-finetune__range {
  background: linear-gradient(to right, var(--i-color-brand) 0 var(--i-fill, 0%), var(--i-color-bg-muted) var(--i-fill, 0%) 100%);
}`)
  // 玻璃面：每一处语义色都兑进了 transparent，透出的是后面的东西
  passes(t, `.i-cube__face {
  background: linear-gradient(145deg, color-mix(in srgb, var(--i-color-brand) 12%, transparent), color-mix(in srgb, var(--i-color-brand) 4%, transparent));
}`)
  // 取色器的色相条：渐变本身就是要读的数据，且不含语义令牌
  passes(t, '.i-colorpicker__hue { background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%); }')
  // 点阵纹理与光晕
  passes(t, '.i-dots { background-image: radial-gradient(var(--i-color-hairline) 1px, transparent 1px); }')
})

test('饱和语义底色上写死白字时失败', (t) => {
  rejects(t, '.i-tag--danger { background: var(--i-color-danger); color: #fff; }', /写死了白字/)
  rejects(t, '.i-btn--primary { background: var(--i-color-brand-solid); color: #ffffff; }', /写死了白字/)
})

test('成对取的底色与字色通过；深色蒙层上的白字不受影响', (t) => {
  passes(t, '.i-btn--primary { background: var(--i-color-brand-solid); color: var(--i-color-on-brand); }')
  passes(t, '.i-toast { background: rgba(20, 24, 34, 0.86); color: #fff; }')
})

test('图标里混进 emoji 或整段 SVG 时失败', (t) => {
  const root = fixture(t, '.x { color: var(--i-color-text); }')
  writeFileSync(join(root, 'packages/common/src/icons/index.ts'),
    "export const icons = {\n  check: '🔍',\n}\n")
  assert.throws(() => checkStyleRules(root), /不是纯路径数据|出现了 emoji/)
})
