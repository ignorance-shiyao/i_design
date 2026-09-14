/**
 * 按需引入的体积报告。
 *
 * 只引一个按钮，会不会把流程图、图表和三维那一套也拖进去——
 * 这件事没人能靠读代码判断：`sideEffects: false`、ESM 导出、
 * 一个不小心写在模块顶层的副作用，任何一处不对都会让摇树失效，
 * 而包本身照样构建成功、类型也对。只能真打一遍再称重。
 *
 * 报告写进 BUNDLE.md 并提交：体积的变化要在 diff 里看得见，
 * 而不是等到使用方抱怨首屏变慢。
 */
import { gzipSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const root = process.cwd()
const distPath = (pkg) => resolve(root, `packages/${pkg}/dist/index.mjs`)

/** 这些字样出现在只引一个按钮的产物里，就说明摇树没生效 */
export const HEAVY_MARKERS = {
  流程画布: /i-flow__|flowLayout|FlowNode/,
  图表: /i-chart__|chartTicks|niceScale/,
  三维: /THREE\.|WebGLRenderer/
}

export const SCENARIOS = [
  { id: 'button', title: '只引一个按钮', code: `export { IButton } from ${JSON.stringify(distPath('vue-next'))}` },
  { id: 'form', title: '一套表单（按钮 / 输入框 / 选择器 / 表单）', code: `export { IButton, IInput, ISelect, IForm, IFormItem } from ${JSON.stringify(distPath('vue-next'))}` },
  { id: 'all', title: '全量引入', code: `export * from ${JSON.stringify(distPath('vue-next'))}` },
  { id: 'common', title: '只引公共层（令牌与逻辑）', code: `export { icons, palette } from ${JSON.stringify(distPath('common'))}` },
  { id: 'react-button', title: 'React：只引一个按钮', code: `export { Button } from ${JSON.stringify(distPath('react'))}` }
]

export async function measure(scenario) {
  const result = await build({
    stdin: { contents: scenario.code, resolveDir: root, loader: 'js' },
    bundle: true, write: false, format: 'esm', minify: true,
    external: ['vue', 'react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      // 子路径排在前面：否则会被拼成 index.mjs/illustrations
      '@i-design/common/illustrations': resolve(root, 'packages/common/dist/illustrations.mjs'),
      '@i-design/common': distPath('common')
    },
    loader: { '.webp': 'dataurl', '.svg': 'dataurl' }
  })
  const code = result.outputFiles[0].text
  const carried = Object.entries(HEAVY_MARKERS)
    .filter(([, pattern]) => pattern.test(code))
    .map(([name]) => name)
  return {
    id: scenario.id,
    title: scenario.title,
    raw: Buffer.byteLength(code),
    gzip: gzipSync(code).length,
    carried
  }
}

export async function bundleReport() {
  const rows = []
  for (const scenario of SCENARIOS) rows.push(await measure(scenario))
  return rows
}

export const reportFile = 'BUNDLE.md'

export function reportSource(rows) {
  const kb = (n) => `${(n / 1024).toFixed(1)} kB`
  return [
    '<!-- 由 scripts/build-bundle-report.mjs 打包后实测生成，请勿手改。 -->',
    '',
    '# 按需引入的体积',
    '',
    '各场景用 esbuild 打包并压缩后实测（vue / react 外置，不计入）。',
    '数字会随实现变化，重点看的是**只引一个组件时会不会把整包拖进来**。',
    '',
    '| 场景 | 压缩后 | gzip | 是否带进了重资源 |',
    '| --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.title} | ${kb(r.raw)} | ${kb(r.gzip)} | ${r.carried.length ? r.carried.join('、') : '否'} |`),
    '',
    '「重资源」指流程画布、图表与三维那三套：它们体积最大，也最不该出现在',
    '一个只用了按钮的页面里。任何一项变成「是」，`npm run check:bundle` 会失败。',
    ''
  ].join('\n')
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rows = await bundleReport()
  writeFileSync(reportFile, reportSource(rows))
  console.log(`体积报告已生成：${rows.map((r) => `${r.id} ${(r.gzip / 1024).toFixed(1)}kB`).join('、')}`)
}
