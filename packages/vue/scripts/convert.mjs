/**
 * 把 vue-next 组件降级为 Vue 2.7 实现。
 *
 * 之所以用转换器而不是手写 37 份：两端的差异是**语法层面且有限的**，
 * 手写只会引入不一致。真正不兼容的只有这几处：
 *
 *   1. v-model：Vue 3 用 modelValue / update:modelValue，Vue 2 用 value / input。
 *   2. Teleport：2.7 没有，改用自带的 Portal 组件（挂载时把 DOM 移到 body）。
 *   3. 多根节点：Vue 2 的模板必须单根，多根组件需要人工包一层。
 *   4. useId()：2.7 没有，改用递增计数器。
 *   5. defineModel / 多个 v-model：2.7 不支持，需人工改造。
 *
 * 其余（<script setup>、defineProps、withDefaults、composition API）2.7 都支持，
 * 因此绝大多数组件是逐字复制。无法自动处理的会被列出来，人工补。
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const srcDir = 'src/components'
const outDir = 'packages/vue/src/components'

/** 需要人工改造的：多根模板、多个 v-model、命令式挂载等 */
const manual = new Set([
  'IMessageList.vue', // 命令式挂载，Vue 2 的 createApp 不同
  'IModal.vue',
  'IDrawer.vue',
  'IPopconfirm.vue',
  'ITooltip.vue',
  'ISkeleton.vue' // 多根模板
])

/** 按分隔符切分，但忽略 <> [] {} () 内部的分隔符 */
function splitTop(input, sep) {
  const out = []
  let depth = 0
  let current = ''
  for (const ch of input) {
    if ('<[{('.includes(ch)) depth++
    else if ('>]})'.includes(ch)) depth--
    if (ch === sep && depth === 0) {
      out.push(current)
      current = ''
    } else current += ch
  }
  if (current.trim()) out.push(current)
  return out.filter((x) => x.trim())
}

function convert(source, name) {
  let s = source

  // 1. v-model：Vue 2 的默认 prop/event 是 value / input
  s = s.replace(/modelValue/g, 'value')
  s = s.replace(/'update:value'/g, "'input'")
  s = s.replace(/"update:value"/g, '"input"')
  s = s.replace(/update:value/g, 'input')

  // 2. useId：2.7 没有，用模块级计数器代替
  if (s.includes('useId')) {
    s = s.replace(/,?\s*useId\s*,?/, (m) => (m.includes(',') ? ', ' : ''))
    s = s.replace(/import \{([^}]*)\} from 'vue'/, (m, g) =>
      `import {${g.replace(/\buseId\b\s*,?\s*/, '')}} from 'vue'`)
    s = s.replace(/<script setup lang="ts">/,
      `<script setup lang="ts">\n// Vue 2.7 没有 useId，用模块级计数器生成稳定且唯一的 id\nlet uidSeed = 0\nconst useId = () => String(++uidSeed)`)
  }

  // 3. defineEmits 的类型写法：Vue 2.7 只认调用签名式，不认 3.3+ 的元组式
  //    { 'input': [string] }  →  { (e: 'input', value: string): void }
  s = s.replace(/defineEmits<\{([\s\S]*?)\}>\(\)/g, (whole, body) => {
    if (body.includes('(e:')) return whole // 已是调用签名式
    // 条目可能以换行或分号分隔，且中间夹着注释——先清注释，再按两种分隔符切
    const cleaned = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    const entries = splitTop(cleaned, ';').flatMap((chunk) => splitTop(chunk, '\n'))
    const sigs = []
    for (const entry of entries) {
      const m = entry.trim().match(/^'?([\w:-]+)'?\s*:\s*\[([\s\S]*)\]$/)
      if (!m) continue
      const [, name, argsRaw] = m
      // 按嵌套深度切分，否则 Record<string, any> 里的逗号会被误当作参数分隔
      const parts = argsRaw.trim() ? splitTop(argsRaw, ',') : []
      const args = parts.map((t, i) => `a${i}: ${t.trim()}`).join(', ')
      sigs.push(`(e: '${name}'${args ? ', ' + args : ''}): void`)
    }
    return sigs.length ? `defineEmits<{ ${sigs.join('; ')} }>()` : whole
  })

  // 4. defineSlots 在 2.7 不存在，模板里用 $slots 判断即可
  s = s.replace(/^.*defineSlots<[\s\S]*?>\(\).*$/gm, '')

  // 5. 模板里的 TS 类型断言：Vue 2 的模板表达式解析器不认 `as T`，会直接报语法错。
  //    只能在 <template> 内剥离——脚本里的断言必须保留，否则类型就丢了。
  s = s.replace(/<template>([\s\S]*?)<\/template>/, (whole, tpl) => {
    const stripped = tpl
      // ($event.target as HTMLInputElement) → $event.target
      .replace(/\(([^()]+?)\s+as\s+[A-Za-z_][\w.<>\[\]| ]*\)/g, '($1)')
      // 其余裸露的 `x as T`
      .replace(/\s+as\s+[A-Za-z_][\w.<>\[\]|]*/g, '')
    return `<template>${stripped}</template>`
  })

  // 6. ARIA 布尔属性：Vue 2 在绑定值为 false 时会**删除**属性，Vue 3 则渲染 "false"。
  //    对 aria-checked / aria-expanded / aria-selected 来说 false 是有意义的状态，
  //    删掉就等于告诉读屏软件「这个控件没有选中状态」。统一转成字符串规避。
  s = s.replace(/<template>([\s\S]*?)<\/template>/, (whole, tpl) => {
    const fixed = tpl.replace(
      /:(aria-(?:checked|expanded|selected|pressed|busy))="([^"]+)"/g,
      (m, attr, expr) => {
        // 已显式给出 undefined 的是「有意移除」，保持原样
        if (expr.includes('undefined') || /^['\`]/.test(expr.trim())) return m
        return `:${attr}="String(${expr})"`
      }
    )
    return `<template>${fixed}</template>`
  })

  // 7. 记录来源，便于追溯
  const header = `<!--\n  由 packages/vue/scripts/convert.mjs 从 src/components/${name} 转换而来。\n  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。\n-->\n`
  return header + s
}

mkdirSync(outDir, { recursive: true })

/*
 * 组件依赖的 .ts 辅助文件（provide/inject 的上下文键、插画索引等）同样要搬过来。
 * message.ts / messageState.ts 除外：Vue 2 没有 createApp，命令式挂载方式不同，
 * 已在 packages/vue/src/message.ts 单独实现。
 */
const helperSkip = new Set(['message.ts', 'messageState.ts', 'index.ts'])
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.ts'))) {
  if (helperSkip.has(file)) continue
  writeFileSync(join(outDir, file), readFileSync(join(srcDir, file), 'utf8'))
}

const files = readdirSync(srcDir).filter((f) => f.endsWith('.vue'))
const converted = []
const skipped = []

for (const file of files) {
  if (manual.has(file)) { skipped.push(file); continue }
  const source = readFileSync(join(srcDir, file), 'utf8')
  // 多根模板检测：<template> 下若有多个顶层元素则需人工处理
  const tpl = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? ''
  const roots = (tpl.match(/(?<=^|\n)\s{2}<[a-zA-Z]/g) ?? []).length
  if (roots > 1) { skipped.push(`${file}（多根模板 ${roots} 个）`); continue }
  writeFileSync(join(outDir, file), convert(source, file))
  converted.push(file)
}

console.log(`自动转换 ${converted.length} 个组件`)
console.log(`需人工实现 ${skipped.length} 个：${skipped.join(', ')}`)
