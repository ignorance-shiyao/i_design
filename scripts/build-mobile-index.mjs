/**
 * 按目录重新生成两个移动端包的导出入口。
 *
 * 这两份原本是手写的，而这个仓库真实发生过的事故正是「实现了但没导出」——
 * React 端 17 个组件写好了却从未出现在入口里，构建全绿、类型检查全绿，
 * 只有使用方 import 不到。移动端包同样是手写清单，同样会漏，因此一并改成生成。
 *
 * 命名约定：mobile-vue 的组件文件是 `I<Name>.vue`（下划线开头的是内部件，不导出），
 * mobile-react 是 `<Name>.tsx`。类型与命令式 API 从文件里扫出来，不另立清单。
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const VUE_DIR = 'packages/mobile-vue/src/components'
const REACT_DIR = 'packages/mobile-react/src/components'

/** 从源码里扫出对外的类型名：`export interface X` / `export type X` */
function exportedTypes(source) {
  return [...source.matchAll(/export\s+(?:interface|type)\s+(\w+)/g)].map((m) => m[1])
}

/* ---------------------------------------------------------------- Vue */

const vueFiles = readdirSync(VUE_DIR)
  .filter((f) => f.endsWith('.vue') && !f.startsWith('_'))
  .sort()

const vueLines = []
for (const file of vueFiles) {
  const name = file.replace(/\.vue$/, '')
  vueLines.push(`export { default as ${name} } from './components/${file}'`)
}
for (const file of vueFiles) {
  const types = exportedTypes(readFileSync(join(VUE_DIR, file), 'utf8'))
  if (types.length) {
    vueLines.push(`export type { ${types.join(', ')} } from './components/${file}'`)
  }
}

const vueIndex = `/**
 * Ignorance Design · Mobile Vue
 *
 * 复用 @i-design/vue-next 的全部组件（样式经移动覆盖层调整触控尺度），
 * 并补充移动端特有形态。引入顺序很重要：先 @i-design/common/styles/index.css，后 mobile.css。
 *
 * 本文件由 scripts/build-mobile-index.mjs 按目录生成——手写清单会漏，
 * 而漏掉的组件既不会让构建失败，也不会有任何提示。
 */
export * from '@i-design/vue-next'
${vueLines.join('\n')}

/* 命令式 API：Toast 不是挂在模板里的组件，单独导出 */
export { toast, currentToast } from './toast'
`
writeFileSync('packages/mobile-vue/src/index.ts', vueIndex)

/* -------------------------------------------------------------- React */

const reactFiles = readdirSync(REACT_DIR)
  .filter((f) => f.endsWith('.tsx') && !f.startsWith('_'))
  .sort()

const reactLines = []
for (const file of reactFiles) {
  const source = readFileSync(join(REACT_DIR, file), 'utf8')
  const values = [...source.matchAll(/export\s+(?:function|const)\s+(\w+)/g)].map((m) => m[1])
  const types = exportedTypes(source).map((name) => `type ${name}`)
  const names = [...values, ...types]
  if (!names.length) continue
  reactLines.push(`export { ${names.join(', ')} } from './components/${file.replace(/\.tsx$/, '')}'`)
}

const reactIndex = `/**
 * Ignorance Design · Mobile React
 *
 * 复用 @i-design/react 的全部组件（样式经移动覆盖层调整触控尺度），
 * 并补充移动端特有形态。
 *
 * 本文件由 scripts/build-mobile-index.mjs 按目录生成——手写清单会漏，
 * 而漏掉的组件既不会让构建失败，也不会有任何提示。
 */
export * from '@i-design/react'
${reactLines.join('\n')}
`
writeFileSync('packages/mobile-react/src/index.ts', reactIndex)

console.log(
  `移动端入口已生成：mobile-vue ${vueFiles.length} 个组件，mobile-react ${reactFiles.length} 个组件`
)
