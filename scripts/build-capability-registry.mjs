/**
 * 生成能力注册表。口径与发现逻辑都在 scripts/lib/registry.mjs。
 *
 * 这里不做任何判断——判断在 check-capability-registry.mjs 里，
 * 生成与检查分开，才能做到「先检查再生成」，
 * 否则检查会先把陈旧产物修好，漏掉忘记提交生成物的改动。
 */
import { writeFileSync } from 'node:fs'
import { registryFile, registrySource, buildRegistry } from './lib/registry.mjs'

writeFileSync(registryFile, registrySource())
const rows = buildRegistry()
console.log(`能力注册表已生成：${rows.length} 个组件，其中 ${rows.filter((r) => r.doc).length} 个有独立文档页`)
