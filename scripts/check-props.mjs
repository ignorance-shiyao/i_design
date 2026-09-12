/**
 * 跨端属性一致性校验（Vue 3 源 ↔ React 实现）。
 *
 * `check-parity.mjs` 只比「组件在不在」，比不到「属性一不一样」。而真正让使用方
 * 难受的恰恰是后者：同一个 Select，Vue 端有 `clearable`、React 端没有，
 * 两边的文档与示例却长得一模一样——照着抄过去，属性静默失效。
 *
 * 这类差异不会让任何构建失败，谁都不会注意到，所以只能显式比。
 *
 * ── 哪些差异不算差异 ──
 * 两端的表达方式本来就不同，机械比对会淹没在噪声里。以下由脚本自动化解：
 *
 *   v-model     Vue 的 `modelValue` 在 React 端叫 `value` / `checked` / `open` /
 *               `current` / `index` 之一。React 没有 v-model，这是语言差异
 *   插槽        Vue 用 `<slot name="footer">`，React 用 `footer` / `renderFooter`
 *               属性或 `children`。所以插槽只用来「满足」React 的属性，
 *               反过来不要求 React 必须有同名属性
 *   大小写      `readonly` / `readOnly`、`maxlength` / `maxLength`——
 *               各自跟随本端的命名惯例，比对时一律转小写
 *   DOM 透传    React 组件 `extends InputHTMLAttributes` 时，
 *               `placeholder` / `disabled` / `type` 这些是继承来的，不必重复声明
 *   事件        React 的 `onXxx` 对应 Vue 的 emits，由 emits 单独比
 *
 * 剩下的才是真差异，要么修掉，要么写进 KNOWN 并说明为什么。
 * 把差异塞进白名单是最省事也最没用的做法——白名单里每一条都得有理由。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const VUE_DIR = 'src/components'
const REACT_DIR = 'packages/react/src/components'

/**
 * 已知且刻意保留的差异。键是组件名，值写清楚为什么两端不同。
 * 加一条进来之前先想清楚：它是「两端本来就该不同」，还是「有一端漏了」。
 */
const KNOWN = {
  Button: { react: ['htmlType'], why: 'React 端把原生 type 让给了变体属性，用 htmlType 指定 submit/reset；Vue 端直接用原生 type' },
  VirtualList: { react: ['handle'], why: 'React 端没有模板 ref，滚动到指定项的命令式入口只能作为属性传出去' },
  ChartZoom: { model: 'window', why: 'React 端把缩放区间做成受控属性 window，对应 Vue 的 v-model' },
  Carousel: { react: ['renderItem'], why: 'Vue 端用具名动态插槽逐张渲染，React 端只能用 renderItem 回调' },
  SelectInput: { react: ['keyword', 'open'], why: 'React 无 v-model，受控的输入词与展开态只能各开一个属性；Vue 端由 v-model 与内部状态承担' }
}

/** React 端继承自 DOM 属性接口时，这些不必重复声明 */
const DOM_ATTRS = new Set([
  'disabled', 'placeholder', 'type', 'title', 'id', 'name', 'readonly', 'required',
  'maxlength', 'minlength', 'autofocus', 'rows', 'cols', 'min', 'max', 'step',
  'href', 'target', 'rel', 'alt', 'src', 'width', 'height', 'tabindex', 'role', 'form'
])

/** React 端用来承载 v-model 的属性名 */
const MODEL_ALIASES = ['value', 'checked', 'open', 'current', 'index']

/** 与组件属性无关，不参与比对 */
const IGNORED = new Set(['classname', 'children', 'style', 'key', 'ref'])

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

/**
 * 取出一段类型体里的顶层键名。
 *
 * 不用正则一把梭：属性的类型本身可能是对象或联合（`options?: { label: string }[]`），
 * 里面的 `label:` 不是属性。按括号深度切分才不会把它们算进来。
 */
function topLevelKeys(body) {
  const keys = []
  let depth = 0
  let buf = ''
  const flush = () => {
    const m = /^\s*'?([A-Za-z_$][\w$]*)'?\s*\??\s*:/.exec(buf)
    if (m) keys.push(m[1])
    buf = ''
  }
  for (const ch of stripComments(body)) {
    if ('{(['.includes(ch)) depth++
    else if ('})]'.includes(ch)) depth--
    if (depth === 0 && (ch === '\n' || ch === ';' || ch === ',')) { flush(); continue }
    buf += ch
  }
  flush()
  return keys
}

/** 从 `{` 处取出配对的整段花括号内容 */
function braceBody(text, openIdx) {
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') { depth--; if (!depth) return text.slice(openIdx + 1, i) }
  }
  return ''
}

function readVue(file) {
  const text = readFileSync(file, 'utf8')
  const m = /defineProps<\s*\{/.exec(text)
  const props = m ? topLevelKeys(braceBody(text, m.index + m[0].length - 1)) : null
  // `defineModel()` 是 defineProps 之外的另一种声明方式，等价于一个 modelValue 属性。
  // 不认它的话，用它的组件会被整批报成「React 端多了 value」
  if (props && /\bdefineModel[<(]/.test(text) && !props.includes('modelValue')) props.push('modelValue')
  return {
    props,
    slots: [...text.matchAll(/<slot\s+name="([a-zA-Z-]+)"/g)].map((s) => s[1])
  }
}

function readReact(file, name) {
  const text = readFileSync(file, 'utf8')
  const m = new RegExp(`interface ${name}Props([^{]*)\\{`).exec(text)
  if (!m) return null
  return {
    props: topLevelKeys(braceBody(text, m.index + m[0].length - 1)),
    inheritsDom: /HTMLAttributes/.test(m[1])
  }
}

const lower = (s) => s.toLowerCase()
// `renderFooter` 与 `footer` 指的是同一件事，比对前去掉前缀。
// 不加大小写限定：调用方可能已经把名字转成小写了
const unrender = (s) => (/^render./.test(s) ? s.slice(6) : s)

const problems = []
let compared = 0

for (const file of readdirSync(VUE_DIR).filter((f) => f.endsWith('.vue')).sort()) {
  const name = file.replace(/^I/, '').replace(/\.vue$/, '')
  const reactFile = `${REACT_DIR}/${name}.tsx`
  if (!existsSync(reactFile)) continue

  const vue = readVue(`${VUE_DIR}/${file}`)
  const react = readReact(reactFile, name)
  // 没有 defineProps 或没有 Props 接口的组件（纯插槽容器）无从比起
  if (!vue.props || !react) continue
  compared++

  const known = KNOWN[name] ?? {}
  // 插槽既可能对上 React 的 `footer`，也可能对上 `renderFooter`，统一去掉 render 前缀再比
  const vueNames = new Set([...vue.props, ...vue.slots].map((k) => lower(unrender(k))))
  const reactNames = new Set(react.props.map((k) => lower(unrender(k))))

  const vueHasModel = vueNames.has('modelvalue')
  /*
   * 挑 React 端承载 v-model 的那个属性时，要避开 Vue 端自己也有的同名属性。
   * Checkbox 两端都有 `value`（组内选项的值），而 v-model 对应的是 `checked`——
   * 按顺序取第一个匹配就会认错，然后把 `checked` 报成 React 独有。
   */
  const reactModel = known.model
    ? lower(known.model)
    : MODEL_ALIASES.find((a) => reactNames.has(a) && !vue.props.map(lower).includes(a))

  const onlyVue = vue.props
    .map((k) => lower(k))
    .filter((k) => !reactNames.has(lower(unrender(k))))
    .filter((k) => !(k === 'modelvalue' && reactModel))
    .filter((k) => !(react.inheritsDom && DOM_ATTRS.has(k)))
    .filter((k) => !(known.vue ?? []).map(lower).includes(k))

  const onlyReact = react.props
    .map((k) => lower(k))
    .filter((k) => !k.startsWith('on') && !IGNORED.has(k))
    .filter((k) => !vueNames.has(lower(unrender(k))))
    .filter((k) => !(vueHasModel && k === reactModel))
    .filter((k) => !(known.react ?? []).map(lower).includes(k))
    .filter((k) => !(vueHasModel && k === lower(known.model ?? '')))

  if (onlyVue.length) problems.push(`${name}：Vue 有而 React 没有 — ${onlyVue.join('、')}`)
  if (onlyReact.length) problems.push(`${name}：React 有而 Vue 没有 — ${onlyReact.join('、')}`)
}

if (problems.length) {
  console.error('跨端属性不一致：')
  for (const line of problems) console.error(`  - ${line}`)
  console.error('\n修掉缺的那一端；确属两端刻意不同的，写进 scripts/check-props.mjs 的 KNOWN 并说明理由。')
  process.exit(1)
}
console.log(`跨端属性一致性检查通过：比对 ${compared} 个组件，已知差异 ${Object.keys(KNOWN).length} 条`)
