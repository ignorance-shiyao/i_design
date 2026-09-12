/**
 * 把 vue-next 组件降级为 Vue 2.7 实现。
 *
 * 用转换器而不是手写 37 份：两端的差异是**语法层面且有限的**，手写只会引入不一致。
 * 真正不兼容的只有这几处，其余（<script setup>、defineProps、withDefaults、
 * composition API）2.7 全都支持，因此绝大多数组件是逐字复制。
 *
 *   1. v-model：Vue 3 用 modelValue / update:modelValue，Vue 2 用 value / input。
 *   2. defineEmits 类型：2.7 不认 Vue 3.3+ 的元组式，须转为调用签名式。
 *   3. 模板里的 TS：Vue 2 的模板表达式解析器不认 `as T`、`foo!`、`(x: T) =>`。
 *   4. ARIA 布尔属性：Vue 2 在值为 false 时删除属性，Vue 3 渲染 "false"。
 *   5. useId / defineModel：2.7 没有，注入垫片。
 *   6. Teleport / 多根模板 / 命令式挂载：2.7 没有对应能力，改为人工实现。
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = 'src/components'
const outDir = 'packages/vue/src/components'

/** 需要人工实现的：多根模板、Teleport、命令式挂载 */
const manual = new Set([
  // Checkbox 与 Radio 的模型语义在 Vue 2 里本就不同（value 表示项的值，选中态走
  // checked/change），靠正则改名只会改坏，人工实现更准确。
  'ICheckbox.vue',
  'IRadio.vue',
  'IMessageList.vue',
  'IModal.vue',
  'IDrawer.vue',
  'IPopconfirm.vue',
  'ITooltip.vue',
  'ISkeleton.vue',
  'ILoading.vue',
  // Teleport 在 2.7 不存在，改用 _Portal.vue 在挂载后把节点搬到 body
  'IPopover.vue',
  'IDropdown.vue',
  'INotificationLayer.vue',
  'ITour.vue',
  'IAutoComplete.vue',
  'ITimePicker.vue',
  'IImage.vue',
  'IImageViewer.vue',
  'IColorPicker.vue'
])

/**
 * Checkbox 与 Radio 已经有一个 value（组内该项的值），
 * 再把 modelValue 改名成 value 就会撞名。Vue 2 里 value 表示「项的值」是原生约定，
 * 因此这两个组件的选中态改用 checked + change，与原生 input 语义一致。
 */
const checkedModel = new Set(['ICheckbox.vue', 'IRadio.vue'])

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

/** defineEmits：{ 'input': [string] } → { (e: 'input', a0: string): void } */
export function convertEmits(source) {
  return source.replace(/defineEmits<\{([\s\S]*?)\}>\(\)/g, (whole, body) => {
    if (body.includes('(e:')) return whole
    const cleaned = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    const entries = splitTop(cleaned, ';').flatMap((chunk) => splitTop(chunk, '\n'))
    const sigs = []
    for (const entry of entries) {
      const m = entry.trim().match(/^'?([\w:-]+)'?\s*:\s*\[([\s\S]*)\]$/)
      if (!m) continue
      const [, name, argsRaw] = m
      // 按嵌套深度切参数，否则 Record<string, any> 里的逗号会被误当作分隔符
      const parts = argsRaw.trim() ? splitTop(argsRaw, ',') : []
      /*
       * 元组元素可能本来就带名字（Vue 3 的 `select: [task: AgentTask]`）。
       * 无条件再套一层 a0 会得到 `a0: task: AgentTask`——不是合法 TS，
       * 而且 Vue 2 包一直没被编译过，所以这个错能一直躺着。
       * 带名字的直接沿用，IDE 里也能看出参数叫什么；只有匿名的才补 a{i}。
       */
      const named = (t) => /^[A-Za-z_$][\w$]*\??\s*:/.test(splitTop(t, ':').length > 1 ? t.trim() : '')
      const args = parts.map((t, i) => (named(t) ? t.trim() : `a${i}: ${t.trim()}`)).join(', ')
      const sig = `(e: '${name}'${args ? ', ' + args : ''}): void`
      // 去重：Checkbox 的 update:modelValue 与 change 会映射到同一个事件名
      if (!sigs.includes(sig)) sigs.push(sig)
    }
    return sigs.length ? `defineEmits<{ ${sigs.join('; ')} }>()` : whole
  })
}

/**
 * 取出 SFC 的根 <template>。必须吃到最后一个 </template>：
 * 组件内部还有 <template v-for> 时，非贪婪会在第一处内层闭合处截断，
 * 后面的表达式（IFlow 的 resizeTarget!、ITree 的高亮片段）就漏网了。
 */
export function rootTemplate(source) {
  const start = source.search(/<template>/)
  if (start < 0) return null
  const end = source.lastIndexOf('</template>')
  if (end < start) return null
  return { start, end: end + '</template>'.length, body: source.slice(start + '<template>'.length, end) }
}

/** 模板层降级：TS 语法与 ARIA 布尔属性 */
export function convertTemplate(source) {
  const root = rootTemplate(source)
  if (!root) return source
  let out = root.body
    .replace(/\(([^()]+?)\s+as\s+[A-Za-z_][\w.<>[\]| ]*\)/g, '($1)')
    .replace(/\s+as\s+[A-Za-z_][\w.<>[\]|]*/g, '')
  /*
   * 非空断言：Vue 2 模板表达式解析器把 `foo!` 当普通 `!`，编出来的 render
   * 是非法 JS，vite 插件再拿去给 babel 时就报 Unexpected token——而且 loc
   * 落在「整份 SFC 压成一行」上，改源码对不上号。
   * 不能误伤 != / !== / 前缀 !foo。
   */
  out = out.replace(/([A-Za-z0-9_)\]])!(?!=)/g, '$1')
  /*
   * 箭头参数类型：(next: boolean) => … 在 Vue 2 里是非法表达式。
   * 只剥类型，参数名留下来，否则 ITree 勾选会变成无参箭头。
   */
  out = out.replace(/\(([^()]*?)\)\s*=>/g, (_, params) => {
    const stripped = splitTop(params, ',')
      .map((p) => p.replace(/\s*:\s*[\s\S]+/, '').trim())
      .filter(Boolean)
      .join(', ')
    return `(${stripped}) =>`
  })
  out = out.replace(
    /:(aria-(?:checked|expanded|selected|pressed|busy))="([^"]+)"/g,
    (m, attr, expr) => {
      // 已显式给出 undefined 的是「有意移除」，保持原样
      if (expr.includes('undefined') || /^['`]/.test(expr.trim())) return m
      return `:${attr}="String(${expr})"`
    }
  )
  return source.slice(0, root.start) + `<template>${out}</template>` + source.slice(root.end)
}

export function convert(source, name) {
  let s = source

  // v-model：Vue 2 的默认 prop/event 是 value / input
  s = s.replace(/modelValue/g, 'value')
  // 模板里写的是 kebab-case，上面那条驼峰替换够不着
  s = s.replace(/model-value/g, 'value')
  s = s.replace(/update:value/g, 'input')

  s = convertEmits(s)

  // useId：2.7 没有，用模块级计数器代替
  if (s.includes('useId')) {
    s = s.replace(/import \{([^}]*)\} from 'vue'/, (m, g) =>
      `import {${g.replace(/\buseId\b\s*,?\s*/, '')}} from 'vue'`)
    s = s.replace(
      /<script setup lang="ts">/,
      `<script setup lang="ts">\n// Vue 2.7 没有 useId，用模块级计数器生成唯一 id\nlet uidSeed = 0\nconst useId = () => String(++uidSeed)`
    )
  }

  /*
   * defineModel：Vue 3.4 才有，2.7 的 compiler-sfc 会原样留在产物里，
   * 使用方一渲染这些组件就报 defineModel is not defined。
   * 默认模型名 modelValue 已经在上面改成了 value / input。
   */
  if (/\bdefineModel\b/.test(s)) {
    s = s.replace(
      /<script setup lang="ts">/,
      `<script setup lang="ts">
import { computed as _computedModel, getCurrentInstance as _modelInstance } from 'vue'
function defineModel(nameOrOptions, maybeOptions) {
  const named = typeof nameOrOptions === 'string'
  const prop = named ? nameOrOptions : 'value'
  const options = (named ? maybeOptions : nameOrOptions) ?? {}
  const event = prop === 'value' ? 'input' : 'update:' + prop
  const inst = _modelInstance()
  const fallback = options.default
  return _computedModel({
    get() {
      const proxy = inst.proxy
      const v = proxy.$props[prop] !== undefined ? proxy.$props[prop] : proxy.$attrs[prop]
      if (v !== undefined) return v
      return typeof fallback === 'function' ? fallback() : fallback
    },
    set(v) { inst.proxy.$emit(event, v) }
  })
}
`
    )
  }

  // defineSlots 在 2.7 不存在，模板里用插槽对象判断即可
  s = s.replace(/^.*defineSlots<[\s\S]*?>\(\).*$/gm, '')

  /*
   * Vue 3 的 $slots 同时包含普通插槽与作用域插槽；Vue 2 把作用域插槽单独放在
   * $scopedSlots 里，$slots 拿不到，于是 `v-if="$slots.media"` 恒为假——
   * 插槽内容一行都不会渲染，而且不报错。2.6 起 $scopedSlots 同时包含两类插槽，
   * 因此统一改写过去是安全的。
   */
  s = s.replace(/\$slots\./g, '$scopedSlots.')

  s = convertTemplate(s)

  const header = `<!--\n  由 packages/vue/scripts/convert.mjs 从 src/components/${name} 转换而来。\n  差异仅在 Vue 2 的语法约束，行为保持一致。\n-->\n`
  return header + s
}

export function runConvert() {
  mkdirSync(outDir, { recursive: true })

  /* 组件依赖的 .ts 辅助文件同样要搬；message 相关由 Vue 2 单独实现 */
  const helperSkip = new Set(['message.ts', 'messageState.ts', 'index.ts'])
  for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.ts'))) {
    if (helperSkip.has(file)) continue
    writeFileSync(join(outDir, file), readFileSync(join(srcDir, file), 'utf8'))
  }

  const converted = []
  const skipped = []
  for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.vue'))) {
    if (manual.has(file)) {
      skipped.push(file)
      continue
    }
    writeFileSync(join(outDir, file), convert(readFileSync(join(srcDir, file), 'utf8'), file))
    converted.push(file)
  }

  console.log(`自动转换 ${converted.length} 个组件`)
  console.log(`人工实现 ${skipped.length} 个：${skipped.join(', ')}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runConvert()
}
