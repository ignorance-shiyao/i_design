/**
 * 把公共层的图标路径数据编译为小程序可用的形式。
 *
 * 小程序的 WXML 不渲染内联 <svg>，常见做法是转成 <image src="data:image/svg+xml,...">，
 * 但那样颜色被烤进图片里，无法跟随文字色——一套图标要为每种颜色生成一份。
 *
 * 这里改用 CSS mask：把 SVG 作为遮罩，颜色由 background-color: currentColor 提供。
 * 这样图标依然「跟着文字色走」，与 Web 端行为一致，也不必为深色模式准备第二套资源。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const tmp = join(root, '.icons.build.mjs')

execFileSync(
  join(root, '../../node_modules/.bin/esbuild'),
  [join(root, '../common/src/icons/index.ts'), '--bundle', '--format=esm', `--outfile=${tmp}`],
  { stdio: 'pipe' }
)
const { icons } = await import(pathToFileURL(tmp).href)

/** 单个图标的 SVG 源；stroke 用 %23fff 占位，实际颜色由 mask 之外的 background-color 决定 */
function svgOf(path) {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' ` +
    `stroke='%23000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>` +
    `<path d='${path}'/></svg>`
  )
}

const rules = Object.entries(icons).map(([name, path]) => {
  const uri = `data:image/svg+xml;utf8,${svgOf(path)}`
  return `.i-icon--${name} {\n  -webkit-mask-image: url("${uri}");\n  mask-image: url("${uri}");\n}`
})

const css = `/* 由 packages/miniprogram/scripts/build-icons.mjs 生成，勿手改 */
.i-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  /* 颜色来自 currentColor，因此图标跟随文字色与主题变化 */
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

${rules.join('\n\n')}
`

mkdirSync(join(root, 'dist/styles'), { recursive: true })
// 文件名不能叫 icon.wxss：build-styles.mjs 会把共享的 icon.css 编译成同名文件，
// 两个生成器写同一路径会静默互相覆盖——这里就被覆盖过一次，图标全部失效。
writeFileSync(join(root, 'dist/styles/icons.wxss'), css)
execFileSync('rm', ['-f', tmp])
console.log(`编译 ${Object.keys(icons).length} 个图标 → dist/styles/icons.wxss（CSS mask 方案，跟随 currentColor）`)
