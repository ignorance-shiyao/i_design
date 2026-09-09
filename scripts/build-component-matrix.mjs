/**
 * 按目录统计每个组件在七端的落地情况，生成文档站的覆盖矩阵。
 *
 * 「已实现」这三个字如果由人来填，就会在补完 Vue 端的当天写下「已实现」，
 * 而小程序与 Flutter 还差着两周。这里只认文件是否存在。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

/** IChatToolCall → chat-tool-call */
const kebab = (name) =>
  name.replace(/^I/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** IChatToolCall → i_chat_tool_call */
const snake = (name) => `i_${kebab(name).replace(/-/g, '_')}`

// 小程序把部分组件合并实现，目录名与 Vue 端对不上，这里显式对应
const mpAlias = {
  'checkbox-group': 'checkbox',
  'radio-group': 'radio',
  'form-item': 'form-item',
  'chat-tool-call': 'chat-tool',
  loading: 'loading',
  'avatar-group': 'avatar-group'
}

/*
 * Flutter 端按「类是否存在」判断，而不是按文件名：i_checkbox.dart 里同时定义了
 * ICheckbox 与 ICheckboxGroup，按文件名会把后者误判为缺失。
 */
const dartDir = 'packages/flutter/lib/src/components'
const dartClasses = new Set()
for (const file of readdirSync(dartDir)) {
  if (!file.endsWith('.dart')) continue
  const src = readFileSync(`${dartDir}/${file}`, 'utf8')
  // 泛型类写作 `class IRadio<T> extends …`，尖括号要一并吃掉
  // 有的类不继承 Widget（ICol 只是一个数据描述），因此 extends 是可选的
  for (const [, name] of src.matchAll(/^class (I[A-Za-z0-9]+)(?:<[^>]*>)?\s*(?:extends|\{)/gm)) {
    dartClasses.add(name)
  }
}

const vueDir = 'src/components'
const components = readdirSync(vueDir)
  .filter((f) => f.endsWith('.vue') && !f.startsWith('_'))
  .map((f) => f.replace('.vue', ''))
  // IMessageList 是 message() 的内部宿主，不作为对外组件统计
  .filter((name) => name !== 'IMessageList')
  .sort()

const rows = components.map((name) => {
  const bare = name.replace(/^I/, '')
  const mpName = mpAlias[kebab(name)] ?? kebab(name)

  return {
    name,
    ends: {
      'vue-next': true,
      vue: existsSync(`packages/vue/src/components/${name}.vue`),
      // React 把 Checkbox 与 CheckboxGroup 之类放在同一个文件里
      react:
        existsSync(`packages/react/src/components/${bare}.tsx`) ||
        existsSync(`packages/react/src/components/${bare.replace(/Group$/, '')}.tsx`) ||
        (['Row', 'Col'].includes(bare) && existsSync('packages/react/src/components/Grid.tsx')),
      miniprogram: existsSync(`packages/miniprogram/src/components/${mpName}/index.wxml`),
      flutter: dartClasses.has(name)
    }
  }
})

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
