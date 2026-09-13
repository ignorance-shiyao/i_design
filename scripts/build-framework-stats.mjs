/**
 * 统计各端「对外导出的组件名」，写进文档站的数据文件。
 *
 * 不数文件数：React 把 Checkbox 与 CheckboxGroup 放在同一个文件里，
 * 按文件数会少算两个；小程序把 Checkbox 与 CheckboxGroup 合成一个组件，
 * 按文件数又会多算。真正能横向比较的是「使用方能拿到几个组件」。
 *
 * 站点上的覆盖数字如果是手填的，第二天就会和代码对不上——React 端漏导出
 * 17 个组件那次，任何手写的清单都会照旧写着「全覆盖」。
 */
import { readdirSync, writeFileSync } from 'node:fs'
// 名单解析与 build-doc-status.mjs 共用一份
import { exportedComponents } from './lib/exported-components.mjs'

const vueNext = exportedComponents('src/components/index.ts')
const vue2 = exportedComponents('packages/vue/src/index.ts')
const react = exportedComponents('packages/react/src/index.ts')

const mp = new Set(readdirSync('packages/miniprogram/src/components'))

const flutter = new Set(
  readdirSync('packages/flutter/lib/src/components')
    .filter((f) => f.endsWith('.dart'))
)

// 移动端复用基础包的全部组件（export *），再加各自的移动特有形态
const mobileVueExtra = exportedComponents('packages/mobile-vue/src/index.ts')
const mobileReactExtra = exportedComponents('packages/mobile-react/src/index.ts')

const stats = {
  'vue-next': vueNext.size,
  vue: vue2.size,
  react: react.size,
  miniprogram: mp.size,
  'mobile-vue': vueNext.size + mobileVueExtra.size,
  'mobile-react': react.size + mobileReactExtra.size,
  flutter: flutter.size
}

const out = `/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = ${JSON.stringify(stats, null, 2)}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = ${vueNext.size}
`
writeFileSync('src/data/frameworkStats.ts', out)
console.log('frameworkStats.ts 已生成：' + JSON.stringify(stats))
