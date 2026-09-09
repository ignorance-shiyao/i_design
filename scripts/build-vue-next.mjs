/**
 * 把 src/components 打包成 @i-design/vue-next。
 *
 * Vue 3 组件的源头一直是 src/components——文档站直接用它，packages/vue 由它转换出
 * Vue 2 版本。但源头长在站点目录里，外部就无从 install，mobile-vue 也没法像
 * mobile-react 那样 `export *` 复用基础组件。这里按目录复制成一个真实的包，
 * 内容与源头逐字节相同（validate 会核对），因此不存在「包里的版本旧了」。
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const src = 'src/components'
const out = 'packages/vue-next/src'

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(src, out, { recursive: true })

const files = readdirSync(src)
const components = files.filter((f) => f.endsWith('.vue')).sort()

writeFileSync(join('packages/vue-next', 'README.md'), `# @i-design/vue-next

Ignorance Design 的 Vue 3 实现，共 ${components.length} 个组件。

本目录由 \`npm run build:vue-next\` 从 \`src/components\` 生成，请勿直接修改——
改动写在 \`src/components\`，它同时是文档站与 Vue 2 转换器的源头。
`)

console.log(`@i-design/vue-next 已生成：${components.length} 个组件`)
