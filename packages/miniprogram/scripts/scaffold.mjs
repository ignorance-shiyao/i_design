/**
 * 为组件生成配套的 index.json 与 index.wxss。
 * 每个组件的这两个文件内容是固定的，手写只会漏——
 * styleIsolation 一旦忘了设 apply-shared，共享类名就会被小程序的样式隔离挡掉。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'packages/miniprogram/src/components'
const styleDir = 'packages/miniprogram/dist/styles'
const available = new Set(readdirSync(styleDir).map((f) => f.replace('.wxss', '')))

let created = 0
for (const name of readdirSync(dir)) {
  const base = join(dir, name)
  if (!existsSync(join(base, 'index.wxml'))) continue

  /*
   * 组件里用到的其他组件必须逐个写进 usingComponents，否则那个标签在小程序里
   * 什么都不渲染——不报错、不警告，就是一片空白。按 WXML 里的实际用法生成，
   * 手写这份清单迟早会漏。
   */
  const wxml = readFileSync(join(base, 'index.wxml'), 'utf8')
  const used = [...new Set([...wxml.matchAll(/<(i-[a-z0-9-]+)/g)].map((m) => m[1]))].sort()
  const usingComponents = {}
  for (const tag of used) {
    const target = tag.slice(2) // i-avatar → avatar
    if (!existsSync(join(dir, target, 'index.wxml'))) {
      throw new Error(`${name} 用到了 <${tag}>，但 components/${target} 不存在`)
    }
    usingComponents[tag] = `../${target}/index`
  }

  writeFileSync(
    join(base, 'index.json'),
    JSON.stringify(
      { component: true, styleIsolation: 'apply-shared', usingComponents },
      null,
      2
    ) + '\n'
  )

  // 组件自身的样式 + 用到图标时一并引入图标样式
  const imports = [available.has(name) ? `@import '../../../dist/styles/${name}.wxss';` : '']
  // icons.wxss 是图标遮罩（build-icons.mjs 生成），icon.wxss 是共享的图标基础样式
  imports.push("@import '../../../dist/styles/icons.wxss';")
  writeFileSync(join(base, 'index.wxss'), imports.filter(Boolean).join('\n') + '\n')
  created++
}
console.log(`生成 ${created} 个组件的 index.json / index.wxss`)
