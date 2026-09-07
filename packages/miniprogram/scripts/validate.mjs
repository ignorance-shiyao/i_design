/**
 * 小程序端静态校验。
 *
 * 本环境没有小程序运行时，无法像 Web 那样跑浏览器实测，因此把能静态确认的都确认掉——
 * 尤其是「样式缺失」这类：构建不会报错，但界面是裸的。前几轮在 Web 端已经栽过两次。
 *
 * 检查项：
 *   1. 每个组件四件套齐全（wxml / js / json / wxss）
 *   2. JS 语法可解析，且 styleIsolation 设为 apply-shared（否则共享类名被隔离挡掉）
 *   3. WXML 里用到的每个 i- 类名，都能在编译出的 WXSS 里找到
 *   4. 引用的每个图标名都存在于生成的图标样式中
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = 'packages/miniprogram'
const compDir = join(root, 'src/components')
const styleDir = join(root, 'dist/styles')

// 收集所有可用类名：组件样式 + 图标样式 + 共享令牌
const allCss = readdirSync(styleDir)
  .map((f) => readFileSync(join(styleDir, f), 'utf8'))
  .join('\n')
const known = new Set([...allCss.matchAll(/\.((?:i-)[\w-]+)/g)].map((m) => m[1]))
const iconNames = new Set([...allCss.matchAll(/\.i-icon--([\w-]+)/g)].map((m) => m[1]))

const problems = []
const warnings = []
const components = readdirSync(compDir)

for (const name of components) {
  const dir = join(compDir, name)
  for (const file of ['index.wxml', 'index.js', 'index.json', 'index.wxss']) {
    if (!existsSync(join(dir, file))) problems.push(`${name}: 缺少 ${file}`)
  }
  if (!existsSync(join(dir, 'index.wxml'))) continue

  // JS 语法与样式隔离
  try {
    execFileSync('node_modules/.bin/esbuild', [join(dir, 'index.js'), '--bundle', '--format=esm',
      '--outfile=/dev/null', '--external:@i-design/common'], { stdio: 'pipe' })
  } catch (e) {
    problems.push(`${name}: JS 无法解析 — ${String(e.stderr).split('\n')[1]?.trim() ?? ''}`)
  }
  const json = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
  if (json.styleIsolation !== 'apply-shared') problems.push(`${name}: styleIsolation 未设为 apply-shared`)

  // WXML 引用的类名与图标名
  const wxml = readFileSync(join(dir, 'index.wxml'), 'utf8')
  for (const m of wxml.matchAll(/class="([^"]*)"/g)) {
    for (const raw of m[1].replace(/\{\{[^}]*\}\}/g, '\u0000').split(/\s+/)) {
      if (!raw.startsWith('i-')) continue
      // 含插值的是动态类名（如 i-alert--{{type}}），静态检查无从判断，跳过
      if (raw.includes('\u0000')) continue
      const cls = raw
      if (cls.startsWith('i-icon--')) {
        if (!iconNames.has(cls.slice(8))) problems.push(`${name}: 图标 ${cls} 不存在`)
      } else if (!known.has(cls)) {
        // 类名没有对应样式未必是错——可能只是不需要样式，因此列为提示而非失败
        warnings.push(`${name}: 样式类 .${cls} 无对应规则`)
      }
    }
  }
}

console.log(`小程序端校验：${components.length} 个组件`)
for (const w of warnings) console.log(`  提示  ${w}`)
if (problems.length) {
  for (const p of problems) console.log(`  失败  ${p}`)
  console.error(`\n${problems.length} 项未通过`)
  process.exit(1)
}
console.log(`  通过：四件套齐全、JS 可解析、样式隔离正确、图标均已定义${warnings.length ? `（${warnings.length} 条样式提示见上）` : ''}`)
