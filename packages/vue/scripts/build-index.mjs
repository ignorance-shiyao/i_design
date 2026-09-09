/** 按目录生成 Vue 2 包的导出清单，理由同 React 端：手写会漏 */
import { readdirSync, writeFileSync } from 'node:fs'

const dir = 'packages/vue/src/components'

// IMessageList 是 message() 的承载组件，与 vue-next / React 一样属于内部实现：
// 三端对外的消息 API 都是 message()，只有这里曾把宿主组件也导出去，
// 于是同一个设计体系在 Vue 2 上多出一个别处没有的组件。
const internal = ['IMessageList.vue']

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.vue') && !f.startsWith('_') && !internal.includes(f))
  .sort()

const lines = files.map((f) => {
  const name = f.replace('.vue', '')
  return `export { default as ${name} } from './components/${f}'`
})

const content = `/**
 * Ignorance Design · Vue 2（Vue 2.7 组合式 API）
 *
 * 令牌、图标、交互逻辑与样式全部来自 @i-design/common，与 vue-next / React 同源。
 * 与 vue-next 的差异仅在 Vue 2 的语法约束：v-model 走 value / input，
 * 模板必须单根，Teleport 由 _Portal.vue 代替。
 *
 * 本文件由 packages/vue/scripts/build-index.mjs 按目录生成。
 */
${lines.join('\n')}
export { message, messages, closeMessage } from './message'
export type { MessageOptions, MessageType, MessageRecord } from './message'
`
writeFileSync('packages/vue/src/index.ts', content)
console.log(`导出 ${lines.length} 个组件 → packages/vue/src/index.ts`)
