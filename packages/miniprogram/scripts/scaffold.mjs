/**
 * 为组件生成配套的 index.json 与 index.wxss。
 * 每个组件的这两个文件内容是固定的，手写只会漏——
 * styleIsolation 一旦忘了设 apply-shared，共享类名就会被小程序的样式隔离挡掉。
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'packages/miniprogram/src/components'
const styleDir = 'packages/miniprogram/dist/styles'
const available = new Set(readdirSync(styleDir).map((f) => f.replace('.wxss', '')))

let created = 0
for (const name of readdirSync(dir)) {
  const base = join(dir, name)
  if (!existsSync(join(base, 'index.wxml'))) continue

  writeFileSync(
    join(base, 'index.json'),
    JSON.stringify({ component: true, styleIsolation: 'apply-shared' }, null, 2) + '\n'
  )

  // 组件自身的样式 + 用到图标时一并引入图标样式
  const imports = [available.has(name) ? `@import '../../../dist/styles/${name}.wxss';` : '']
  // icons.wxss 是图标遮罩（build-icons.mjs 生成），icon.wxss 是共享的图标基础样式
  imports.push("@import '../../../dist/styles/icons.wxss';")
  writeFileSync(join(base, 'index.wxss'), imports.filter(Boolean).join('\n') + '\n')
  created++
}
console.log(`生成 ${created} 个组件的 index.json / index.wxss`)
