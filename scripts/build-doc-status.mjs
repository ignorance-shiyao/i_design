import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
// 导出名单解析与 build-framework-stats.mjs 共用一份
import { exportedComponents } from './lib/exported-components.mjs'
import { build } from 'esbuild'

// 只生成可机械核对的事实；“文件存在”不能替代交互验收或包安装验收。
const result = await build({
  stdin: { contents: `export { componentMatrix } from './src/data/componentMatrix';
    export { frameworkStats } from './src/data/frameworkStats';
    export { icons } from './packages/common/src/icons';
    export { motion } from './packages/common/src/tokens';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node'
})
const { componentMatrix, frameworkStats, icons, motion } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
)
// 测试文件不是共享逻辑模块，算进来会让「共享逻辑 N 个」这个数字虚高
const modules = readdirSync('packages/common/src/logic')
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .sort()
const golden = (readFileSync('packages/flutter/test/logic_parity_test.dart', 'utf8').match(/\bexpect\(/g) ?? []).length
const files = readdirSync('src/components').filter((f) => f.endsWith('.vue') && !f.startsWith('_') && !['IMessageList.vue', 'IConfirmLayer.vue'].includes(f))
assert.deepEqual(componentMatrix.map((r) => `${r.name}.vue`).sort(), files.sort(), '先运行 npm run build:matrix')

const perEnd = Object.keys(componentMatrix[0].ends).map((end) =>
  `| ${end} | ${componentMatrix.filter((row) => row.ends[end]).length} | ${frameworkStats[end]} |`).join('\n')

/*
 * 两列口径不同，此前只写了一句「不能互当总数」——读者无从判断差额是合理的还是漏了什么。
 * 这里把差额逐个列出来：能一一对上，两个数字才都可信。
 */
const matrixNames = new Set(componentMatrix.map((row) => row.name))

/*
 * 已经解释清楚的差额。新出现一条而这里没有说明时，check:docs 直接失败——
 * 否则「两列口径不同」会变成一句万能的挡箭牌，把真正的漏导出也盖过去。
 */
const GAP_NOTES = {
  IConfirmLayer: 'confirm() 的宿主。Vue 2.7 没有 Teleport，宿主要由使用方自己放进模板，所以只有那一端对外导出'
}
const exportGap = [
  ['vue-next', exportedComponents('src/components/index.ts')],
  ['vue', exportedComponents('packages/vue/src/index.ts')],
  ['react', exportedComponents('packages/react/src/index.ts')]
].map(([end, names]) => {
  // React 端导出的是不带 I 前缀的名字，比对前统一
  const normalized = new Set([...names].map((n) => (/^I[A-Z]/.test(n) ? n : `I${n}`)))
  const extra = [...normalized].filter((n) => !matrixNames.has(n)).sort()
  const missing = [...matrixNames].filter((n) => !normalized.has(n)).sort()
  for (const name of [...extra, ...missing]) {
    assert.ok(GAP_NOTES[name], `${end} 的覆盖差额多出 ${name}，但没有说明：要么是漏导出，要么在 build-doc-status.mjs 的 GAP_NOTES 里写清楚为什么`)
  }
  const note = [...extra, ...missing].map((n) => `${n} — ${GAP_NOTES[n]}`).join('；') || '—'
  return `| ${end} | ${extra.join('、') || '—'} | ${missing.join('、') || '—'} | ${note} |`
}).join('\n')
const out = `# 源码状态快照

<!-- 由 scripts/build-doc-status.mjs 生成，请勿手改。 -->

运行 \`npm run build:docs\` 更新；\`npm run check:docs\` 检查快照是否陈旧。
数字是源码与生成物的统计，不代表包已发布，也不代表实机验收完成。

## 当前规模

| 端 | 覆盖矩阵（源组件文件口径） | frameworkStats（导出名口径） |
| --- | ---: | ---: |
${perEnd}

两列口径不同，不能互当总数：矩阵数的是各端的源组件文件，frameworkStats 数的是
使用方能 import 到的名字。差额逐项如下——能一一对上，两个数字才都可信。
移动专有组件不进入 Web 覆盖矩阵。

| 端 | 导出里有、矩阵里没有 | 矩阵里有、导出里没有 | 说明 |
| --- | --- | --- | --- |
${exportGap}

golden 文件包含 **${golden}** 条 expect；构建脚本生成断言，不执行 Dart SDK 测试。
共享 SVG 图标定义 **${Object.keys(icons).length}** 项；共享逻辑模块 **${modules.length}** 个。

## 共享逻辑目录

${modules.map((f) => `- [${f}](../packages/common/src/logic/${f})`).join('\n')}

当前动效曲线：${Object.keys(motion).filter((k) => k.startsWith('easing')).map((k) => `\`--i-motion-${k}\``).join('、')}。
`
const file = 'docs/SOURCE_STATUS.md'
if (process.argv.includes('--check')) {
  assert.equal(readFileSync(file, 'utf8'), out, '源码快照过期：运行 npm run build:docs 并提交生成物')
  console.log('文档源码快照检查通过')
} else {
  writeFileSync(file, out)
  console.log('文档源码快照已生成')
}
