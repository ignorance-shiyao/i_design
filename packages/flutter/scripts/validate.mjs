/**
 * Flutter 端静态校验。
 *
 * 这个仓库里没有 Dart SDK，`flutter analyze` 跑不起来，而 Dart 的引用错误
 * （拼错一个令牌常量、写了一个不存在的图标名）不会在别处暴露——上一轮就写出过
 * `colorTextInverseBg` 这种根本不存在的令牌。这里用静态解析补上那道关：
 * 引用的令牌、图标、导出清单必须真实存在，括号必须闭合。
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lib = join(root, 'lib')
const problems = []

const dartFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.dart')) dartFiles.push(full)
  }
}
walk(lib)

/* ---------- 1. 令牌常量必须真实存在 ---------- */
const tokensSrc = readFileSync(join(lib, 'src/tokens/tokens.dart'), 'utf8')
const tokenNames = new Set(
  [...tokensSrc.matchAll(/static const (?:[A-Za-z<>]+ )?([A-Za-z0-9_]+)\s*=/g)].map((m) => m[1])
)

/* ---------- 2. 图标名必须真实存在 ---------- */
const iconsSrc = readFileSync(join(lib, 'src/icons/icons.dart'), 'utf8')
const iconNames = new Set([...iconsSrc.matchAll(/'([a-z0-9-]+)':/g)].map((m) => m[1]))

for (const file of dartFiles) {
  const rel = relative(root, file)
  const src = readFileSync(file, 'utf8')
  // 先挖空字符串再去注释：反过来会把 xmlns="http://..." 里的 // 当成注释起点，
  // 从而吃掉半个字符串字面量，后面的括号计数就全乱了。
  const blanked = src.replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""')
  const code = blanked.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')

  for (const [, name] of code.matchAll(/IDesignTokens(?:Light|Dark)\.([A-Za-z0-9_]+)/g)) {
    if (name.startsWith('_')) continue // 私有构造函数 IDesignTokensLight._()
    if (!tokenNames.has(name)) problems.push(`${rel}: 引用了不存在的令牌 ${name}`)
  }

  for (const [, name] of code.matchAll(/IIcon\(\s*'([a-z0-9-]+)'/g)) {
    if (!iconNames.has(name)) problems.push(`${rel}: 引用了不存在的图标 ${name}`)
  }

  /* ---------- 3. 括号闭合 ---------- */
  const bare = code
  for (const [open, close, label] of [['{', '}', '花括号'], ['(', ')', '圆括号'], ['[', ']', '方括号']]) {
    const diff =
      bare.split(open).length - bare.split(close).length
    if (diff !== 0) problems.push(`${rel}: ${label}不配对（差 ${diff}）`)
  }

  /* ---------- 4. library 指令必须在 import 之前 ---------- */
  const firstImport = code.indexOf('import ')
  const libraryAt = code.indexOf('library')
  if (libraryAt > -1 && firstImport > -1 && libraryAt > firstImport) {
    problems.push(`${rel}: library 指令必须写在 import 之前`)
  }
}

/* ---------- 5. 导出清单不能漏 ---------- */
const barrel = readFileSync(join(lib, 'i_design.dart'), 'utf8')
for (const file of dartFiles) {
  const rel = relative(lib, file).split('\\').join('/')
  if (rel === 'i_design.dart') continue
  if (!barrel.includes(`export '${rel}';`)) {
    problems.push(`i_design.dart 未导出 ${rel}（跑 npm run build:flutter 重新生成）`)
  }
}

/* ---------- 报告 ---------- */
const componentCount = readdirSync(join(lib, 'src/components')).filter((f) => f.endsWith('.dart')).length
if (problems.length) {
  console.error(`Flutter 校验未通过（${dartFiles.length} 个文件）:`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log(`Flutter 校验通过：${dartFiles.length} 个文件，${componentCount} 个组件，${iconNames.size} 个图标`)
