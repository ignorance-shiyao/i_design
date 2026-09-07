/**
 * 令牌编译器：把 src/tokens 的单一数据源编译到各端可直接消费的格式。
 *
 *   CSS   → Web（vue / vue-next / react / mobile-*）
 *   SCSS  → 需要编译期变量的项目
 *   JSON  → 设计工具、文档站、任意语言的二次消费
 *   WXSS  → 小程序（不支持 :root，用 page 选择器）
 *   Dart  → Flutter（Color / double 常量 + ThemeData 片段）
 *
 * 任何一端要改颜色，改的都是 tokens 源文件，而不是各自的样式表——
 * 这正是「设计体系」与「一堆长得像的组件库」的区别。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const outDir = join(root, 'dist/tokens')

// 用 esbuild 把 TS 源编译成可 import 的 JS，避免为一个脚本引入 ts-node
const tmp = join(root, '.tokens.build.mjs')
execFileSync(
  join(root, '../../node_modules/.bin/esbuild'),
  [join(root, 'src/tokens/index.ts'), '--bundle', '--format=esm', `--outfile=${tmp}`],
  { stdio: 'inherit' }
)
const tokens = await import(pathToFileURL(tmp).href)

const light = tokens.flatten('light')
const dark = tokens.flatten('dark')
const mobileLight = tokens.flattenMobile('light')
const mobileDark = tokens.flattenMobile('dark')
const PREFIX = 'i'

const banner = '/* 由 packages/common/scripts/build-tokens.mjs 自动生成，请勿手改 */'

/* ---------- CSS ---------- */
const cssVars = (map, indent = '  ') =>
  Object.entries(map)
    .map(([k, v]) => `${indent}--${PREFIX}-${k}: ${v};`)
    .join('\n')

const css = `${banner}
:root {
${cssVars(light)}
  color-scheme: light;
}

:root[data-theme='dark'] {
${cssVars(dark)}
  color-scheme: dark;
}
`

/* ---------- 移动端 CSS（Web 令牌 + 移动覆盖层） ---------- */
const cssMobile = `${banner}
:root {
${cssVars(mobileLight)}
  color-scheme: light;
}

:root[data-theme='dark'] {
${cssVars(mobileDark)}
  color-scheme: dark;
}
`

/* ---------- SCSS ---------- */
const scss = `${banner}
${Object.entries(light)
  .map(([k, v]) => `$${PREFIX}-${k}: ${v};`)
  .join('\n')}
`

/* ---------- JSON ---------- */
const json = JSON.stringify({ light, dark, mobileLight, mobileDark }, null, 2)

/* ---------- WXSS（小程序不支持 :root，作用在 page 上） ---------- */
const wxss = `${banner}
page {
${cssVars(light)}
}

page.theme-dark {
${cssVars(dark)}
}
`

/* ---------- Dart / Flutter ---------- */
const camel = (key) => key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const isColor = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim())
const isRgba = (v) => /^rgba?\(/i.test(v.trim())
const isPx = (v) => /^-?[\d.]+px$/.test(v.trim())
const isMs = (v) => /^[\d.]+ms$/.test(v.trim())

function dartColor(value) {
  const v = value.trim()
  if (isColor(v)) {
    let hex = v.slice(1)
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('')
    if (hex.length === 6) hex = `ff${hex}`
    // CSS 是 #RRGGBBAA，Dart 是 0xAARRGGBB，位置不同必须换算
    else hex = hex.slice(6, 8) + hex.slice(0, 6)
    return `Color(0x${hex.toUpperCase()})`
  }
  const m = v.match(/^rgba?\(([^)]+)\)$/i)
  if (m) {
    const [r, g, bl, a = '1'] = m[1].split(',').map((s) => s.trim())
    const alpha = Math.round(parseFloat(a) * 255)
      .toString(16)
      .padStart(2, '0')
    const hex = [r, g, bl]
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
    return `Color(0x${(alpha + hex).toUpperCase()})`
  }
  return null
}

function dartBlock(map, className, comment) {
  const colors = []
  const sizes = []
  const durations = []
  for (const [key, value] of Object.entries(map)) {
    const name = camel(key)
    if (isColor(value) || isRgba(value)) {
      const c = dartColor(value)
      if (c) colors.push(`  static const ${name} = ${c};`)
    } else if (isPx(value)) {
      // 显式 double：Flutter 的 EdgeInsets / BorderRadius 只接受 double，int 会编译报错
      sizes.push(`  static const double ${name} = ${parseFloat(value).toFixed(1)};`)
    } else if (isMs(value)) {
      durations.push(`  static const ${name} = Duration(milliseconds: ${parseInt(value, 10)});`)
    }
  }
  return `/// ${comment}
class ${className} {
  ${className}._();

${colors.join('\n')}

${sizes.join('\n')}

${durations.join('\n')}
}
`
}

const dart = `// ${banner.replace(/^\/\* | \*\/$/g, '')}
import 'package:flutter/material.dart';

${dartBlock(light, 'IDesignTokensLight', 'Ignorance Design 亮色令牌')}
${dartBlock(dark, 'IDesignTokensDark', 'Ignorance Design 暗色令牌')}
/// 直接可用的 ThemeData，颜色与 Web 端逐值一致
ThemeData iDesignTheme({Brightness brightness = Brightness.light}) {
  final isDark = brightness == Brightness.dark;
  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor:
        isDark ? IDesignTokensDark.colorBg : IDesignTokensLight.colorBg,
    primaryColor:
        isDark ? IDesignTokensDark.colorBrand : IDesignTokensLight.colorBrand,
    colorScheme: ColorScheme.fromSeed(
      seedColor:
          isDark ? IDesignTokensDark.colorBrand : IDesignTokensLight.colorBrand,
      brightness: brightness,
    ),
  );
}
`

mkdirSync(outDir, { recursive: true })
const files = {
  'tokens.css': css,
  'tokens.mobile.css': cssMobile,
  'tokens.scss': scss,
  'tokens.json': json,
  'tokens.wxss': wxss,
  'tokens.dart': dart
}
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(outDir, name), content)
}

// 同步到 styles 目录，Web 与移动端直接 import
writeFileSync(join(root, 'src/styles/tokens.css'), css)
writeFileSync(join(root, 'src/styles/tokens.mobile.css'), cssMobile)

execFileSync('rm', ['-f', tmp])

const count = Object.keys(light).length
console.log(`已编译 ${count} 个令牌 → ${Object.keys(files).length} 种格式`)
for (const name of Object.keys(files)) console.log(`  dist/tokens/${name}`)
