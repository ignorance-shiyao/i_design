/**
 * 把 Web 端共享的组件 CSS 编译为 WXSS。
 *
 * WXSS 是 CSS 的子集，主要差异：
 *   1. 不支持 :root——主题变量挂在 page 上（令牌编译器已处理）；
 *   2. 不支持通配选择器与部分伪类；
 *   3. backdrop-filter / color-mix 支持度差，需降级。
 *
 * 所以不是「重写一套小程序样式」，而是「同一份样式做语法降级」——设计仍只有一个来源。
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cssDir = join(here, '../../common/src/styles/components')
const outDir = join(here, '../dist/styles')

function toWxss(css, name) {
  let out = css
  out = out.replace(/^\s*\*[^{]*\{[^}]*\}\s*$/gm, '')
  out = out.replace(/[^{}]*::?-webkit-scrollbar[^{}]*\{[^}]*\}/g, '')
  out = out.replace(/[^{}]*:focus-visible[^{}]*\{[^}]*\}/g, '')
  out = out.replace(/\s*backdrop-filter:[^;]+;/g, '')
  out = out.replace(/color-mix\(in srgb,\s*([^,]+?)\s*\d+%,\s*transparent\)/g, '$1')
  return `/* ${name} —— 由 packages/common 的共享 CSS 编译而来，勿直接修改 */\n` + out.trim() + '\n'
}

mkdirSync(outDir, { recursive: true })
const files = readdirSync(cssDir).filter((f) => f.endsWith('.css'))
let downgraded = 0
for (const file of files) {
  const css = readFileSync(join(cssDir, file), 'utf8')
  const wxss = toWxss(css, file)
  if (wxss.length !== css.length + wxss.split('\n')[0].length + 1) downgraded++
  writeFileSync(join(outDir, file.replace('.css', '.wxss')), wxss)
}
console.log(`编译 ${files.length} 个组件样式 → WXSS（其中 ${downgraded} 个做了语法降级）`)
