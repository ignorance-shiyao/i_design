/**
 * 按目录统计每个组件在各端的落地情况，生成文档站的覆盖矩阵。
 *
 * 「已实现」这三个字如果由人来填，就会在补完 Vue 端的当天写下「已实现」，
 * 而小程序与 Flutter 还差着两周。这里只认文件是否存在。
 *
 * 发现逻辑（各端目录名、小程序别名、Flutter 按类名判断）在 scripts/lib/registry.mjs，
 * 与能力注册表共用一份：两份各自维护的话，同一个组件会在两处得到不同的答案。
 */
import { writeFileSync } from 'node:fs'
import { endSources } from './lib/registry.mjs'

const rows = [...endSources()].map(([name, src]) => ({
  name,
  ends: Object.fromEntries(Object.entries(src).map(([end, path]) => [end, Boolean(path)]))
}))

const out = `/**
 * 由 scripts/build-component-matrix.mjs 按目录统计生成，请勿手改。
 * 只认文件是否存在——「已实现」不该是一个可以手写的状态。
 */
export interface ComponentRow {
  name: string
  ends: Record<string, boolean>
}

export const componentMatrix: ComponentRow[] = ${JSON.stringify(rows, null, 2)}
`
writeFileSync('src/data/componentMatrix.ts', out)

const total = rows.length
const per = {}
for (const row of rows) {
  for (const [end, ok] of Object.entries(row.ends)) per[end] = (per[end] ?? 0) + (ok ? 1 : 0)
}
console.log(`覆盖矩阵已生成：${total} 个组件 ${JSON.stringify(per)}`)
