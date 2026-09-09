/**
 * 按目录生成 React 包的导出清单。
 * 手写清单会漏：曾有 17 个组件文件已实现却从未导出，构建全绿但外部根本用不到。
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = 'packages/react/src/components'
const files = readdirSync(dir).filter((f) => f.endsWith('.tsx')).sort()

const lines = []
for (const file of files) {
  const src = readFileSync(`${dir}/${file}`, 'utf8')
  const fns = [...src.matchAll(/^export function (\w+)/gm)].map((m) => m[1])
  const consts = [...src.matchAll(/^export const (\w+)/gm)].map((m) => m[1])
  const types = [...src.matchAll(/^export interface (\w+)/gm)].map((m) => `type ${m[1]}`)
  const items = [...fns, ...consts, ...types]
  if (!items.length) continue
  lines.push(`export { ${items.join(', ')} } from './components/${file.replace('.tsx', '')}'`)
}

const header = `/**
 * Ignorance Design · React
 *
 * 组件只负责渲染：令牌、图标数据、交互规则全部来自 @i-design/common，
 * 与 Vue 端共用同一份 CSS（@i-design/common/styles/index.css）。
 * 因此「React 版和 Vue 版长得不一样」在架构上就不可能发生。
 *
 * 本文件由 scripts/build-react-index.mjs 按目录生成——手写导出清单会漏，
 * 之前就漏掉了 17 个已实现但从未导出的组件。
 */
`
writeFileSync('packages/react/src/index.ts', header + lines.join('\n') + '\n')
console.log(`导出 ${lines.length} 个模块 → packages/react/src/index.ts`)
