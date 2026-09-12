import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
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
const modules = readdirSync('packages/common/src/logic').filter((f) => f.endsWith('.ts')).sort()
const golden = (readFileSync('packages/flutter/test/logic_parity_test.dart', 'utf8').match(/\bexpect\(/g) ?? []).length
const files = readdirSync('src/components').filter((f) => f.endsWith('.vue') && !f.startsWith('_') && !['IMessageList.vue', 'IConfirmLayer.vue'].includes(f))
assert.deepEqual(componentMatrix.map((r) => `${r.name}.vue`).sort(), files.sort(), '先运行 npm run build:matrix')

const evidence = [
  ['动效曲线', 'packages/common/src/tokens/index.ts', "'easing-spring'"],
  ['图片预览', 'src/components/IImageViewer.vue', '@wheel.prevent'],
  ['日历', 'src/components/ICalendar.vue', 'range'],
  ['颜色选择', 'src/components/IColorPicker.vue', 'hsv'],
  ['页面框架', 'src/components/ILayout.vue', '<slot'],
  ['吸顶与返回顶部', 'src/components/ISticky.vue', 'sticky'],
  ['吸顶与返回顶部', 'src/components/IBackTop.vue', 'scroll'],
  ['索引栏（IndexBar 的现有实现）', 'packages/mobile-vue/src/components/IIndexes.vue', 'index'],
  ['索引栏（React）', 'packages/mobile-react/src/components/Indexes.tsx', 'index'],
  ['下拉刷新（PullRefresh 的现有实现）', 'packages/mobile-vue/src/components/IPullDownRefresh.vue', 'pull'],
  ['下拉刷新（React）', 'packages/mobile-react/src/components/PullDownRefresh.tsx', 'pull'],
  ['甘特图', 'src/components/IChartGantt.vue', 'gantt'],
  ['词云', 'src/components/IChartWordCloud.vue', 'word'],
  ['提及（与第 9 批重复）', 'src/components/IMentions.vue', 'mention']
]
for (const [label, path, anchor] of evidence) {
  assert.ok(existsSync(path) && readFileSync(path, 'utf8').toLowerCase().includes(anchor.toLowerCase()), `F1 完成记录的源码证据变化：${label} ${path}`)
}
const taskDoc = readFileSync('docs/当前现状&后续规划_Claude .md', 'utf8')
const roadmap = readFileSync('docs/ROADMAP.md', 'utf8')
assert.ok(!/^- \[ \]/m.test(roadmap), 'ROADMAP 不再维护第二份未勾选台账，请迁入主台账')
for (const [, id] of roadmap.matchAll(/转入 \*\*([A-F]\d+)\*\*/g)) {
  assert.ok(new RegExp(`\\*\\*${id} ·`).test(taskDoc), `ROADMAP 的任务去向不存在：${id}`)
}
const perEnd = Object.keys(componentMatrix[0].ends).map((end) =>
  `| ${end} | ${componentMatrix.filter((row) => row.ends[end]).length} | ${frameworkStats[end]} |`).join('\n')
const out = `# 源码状态快照

<!-- 由 scripts/build-doc-status.mjs 生成，请勿手改。 -->

运行 \`npm run build:docs\` 更新；\`npm run check:docs\` 检查陈旧快照及旧任务去向。
数字是源码与生成物的统计，不代表包已发布，也不代表实机验收完成。

## 当前规模

| 端 | 覆盖矩阵（源组件文件口径） | frameworkStats（导出名口径） |
| --- | ---: | ---: |
${perEnd}

两列口径不同，不能互当总数。移动专有组件不进入 Web 覆盖矩阵。
golden 文件包含 **${golden}** 条 expect；构建脚本生成断言，不执行 Dart SDK 测试。
共享 SVG 图标定义 **${Object.keys(icons).length}** 项；共享逻辑模块 **${modules.length}** 个。

## 共享逻辑目录

${modules.map((f) => `- [${f}](../packages/common/src/logic/${f})`).join('\n')}

## F1 已校准项的源码证据

以下用于防止历史完成记录引用不存在的实现；关键词只提供代码锚点，不是完整行为测试。
Splitter 双击复位、水印节点恢复、动效全覆盖等要求单独保留在主台账。

| 原项 | 源码 |
| --- | --- |
${evidence.map(([label, path]) => `| ${label} | [${path}](../${path}) |`).join('\n')}

当前动效曲线：${Object.keys(motion).filter((k) => k.startsWith('easing')).map((k) => `\`--i-motion-${k}\``).join('、')}。
曲线已定义不代表 Tree、列表、按压及所有动效开关均已接入，剩余范围见 A3。
`
const file = 'docs/SOURCE_STATUS.md'
if (process.argv.includes('--check')) {
  assert.equal(readFileSync(file, 'utf8'), out, '源码快照过期：运行 npm run build:docs 并提交生成物')
  console.log('文档快照与 ROADMAP 任务去向检查通过')
} else {
  writeFileSync(file, out)
  console.log('文档源码快照已生成')
}
