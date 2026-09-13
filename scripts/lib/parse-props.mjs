/**
 * 从 Vue 3 单文件组件里抽出属性描述。
 *
 * 两处在用，也正是把它单独拎出来的原因：
 *   - `check-props.mjs` 拿它比对 Vue 与 React 两端的属性是否一致
 *   - `build-component-props.mjs` 拿它生成文档站 playground 的控件清单
 *
 * 属性描述如果手写，一定会和代码漂移——这个仓库里已经有过先例（组件目录状态
 * 手填错了 13 个，没人发现，直到 F0 改成按源码推导）。所以只认源码。
 *
 * 这不是完整的 TypeScript 解析器，也不需要是：`defineProps` 的类型字面量是一种
 * 很受限的写法，按括号深度切分就够。遇到解析不了的形态宁可返回空，
 * 也不要猜——猜错会生成一个「看起来能用、改了却不生效」的控件。
 */
import { readFileSync } from 'node:fs'

const stripBlockComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/** 从 `{` 处取出配对的整段花括号内容 */
export function braceBody(text, openIdx) {
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') { depth--; if (!depth) return text.slice(openIdx + 1, i) }
  }
  return ''
}

/**
 * 把一段类型体按顶层分隔符切成若干条目。
 *
 * 不能按行切也不能一把梭正则：属性的类型本身可能带对象、数组、联合与泛型
 * （`options?: { label: string }[]`、`model: Record<string, any>`），
 * 里面的 `label:` 和逗号不是属性。
 *
 * `<>` 要算进深度，否则 `Record<string, T>` 会在那个逗号处被切开，
 * 生成物变成非法的 `Record<string`。`=>` 里的 `>` 不是闭合。
 */
export function topLevelEntries(body) {
  const entries = []
  let depth = 0
  let buf = ''
  const flush = () => { if (buf.trim()) entries.push(buf); buf = '' }
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '=' && body[i + 1] === '>') { buf += '=>'; i++; continue }
    if ('<{(['.includes(ch)) depth++
    else if ('>})]'.includes(ch)) depth--
    if (depth === 0 && (ch === '\n' || ch === ';' || ch === ',')) { flush(); continue }
    buf += ch
  }
  flush()
  return entries
}


/**
 * 属性上方的文档注释。
 *
 * playground 的控件旁边要写清楚这个属性是干什么的，而源码里本来就写了——
 * 再手写一遍就是第二处会漂移的描述。
 */
function docsOf(body) {
  const docs = new Map()
  const re = /\/\*\*([\s\S]*?)\*\/\s*\n?\s*'?([A-Za-z_$][\w$]*)'?\s*\??\s*:/g
  for (const m of body.matchAll(re)) {
    const text = m[1].split('\n').map((l) => l.replace(/^\s*\*?\s?/, '').trim()).filter(Boolean).join(' ')
    if (text) docs.set(m[2], text)
  }
  return docs
}

/** `withDefaults(defineProps<…>(), { size: 'md', disabled: false })` 里的那个对象 */
function defaultsOf(text) {
  const start = text.indexOf('withDefaults(')
  if (start < 0) return new Map()
  // 默认值对象是 withDefaults 的第二个实参，也就是 defineProps 的类型体之后的那个 `{`
  const propsEnd = text.indexOf('>(', start)
  const brace = text.indexOf('{', propsEnd < 0 ? start : propsEnd + 2)
  if (brace < 0) return new Map()
  const map = new Map()
  for (const entry of topLevelEntries(braceBody(text, brace))) {
    const m = /^\s*'?([A-Za-z_$][\w$]*)'?\s*:\s*([\s\S]+)$/.exec(entry)
    if (m) map.set(m[1], m[2].trim())
  }
  return map
}

/**
 * 解析一个 SFC 的属性。
 *
 * 返回的每一项：name / type（原样保留的类型文本）/ optional / defaultText / doc。
 * 类型不做归一化——`'sm' | 'md' | 'lg'` 这种联合字面量正是 playground
 * 生成分段器的依据，转成 `string` 就全丢了。
 */
export function parseVueProps(file) {
  const text = readFileSync(file, 'utf8')
  const m = /defineProps<\s*\{/.exec(text)
  const slots = [...text.matchAll(/<slot\s+name="([a-zA-Z-]+)"/g)].map((s) => s[1])
  if (!m) {
    // `defineModel()` 可以脱离 defineProps 单独出现，等价于一个 modelValue 属性
    const model = /\bdefineModel[<(]/.test(text)
    return { props: model ? [{ name: 'modelValue', type: 'unknown', optional: true, defaultText: null, doc: '' }] : null, slots }
  }

  const body = braceBody(text, m.index + m[0].length - 1)
  const docs = docsOf(body)
  const defaults = defaultsOf(text)
  const props = []
  for (const entry of topLevelEntries(stripBlockComments(body))) {
    const hit = /^\s*'?([A-Za-z_$][\w$]*)'?\s*(\??)\s*:\s*([\s\S]+)$/.exec(entry.replace(/\/\/[^\n]*/g, ''))
    if (!hit) continue
    const [, name, question, type] = hit
    props.push({
      name,
      type: type.trim().replace(/\s+/g, ' '),
      optional: question === '?',
      defaultText: defaults.get(name) ?? null,
      doc: docs.get(name) ?? ''
    })
  }
  if (/\bdefineModel[<(]/.test(text) && !props.some((p) => p.name === 'modelValue')) {
    props.push({ name: 'modelValue', type: 'unknown', optional: true, defaultText: null, doc: '' })
  }
  return { props, slots }
}

/**
 * 类型文本 → playground 用哪种控件。
 *
 * 认不出来就返回 null，让调用方跳过这个属性。渲染一个操作不了的控件，
 * 比不渲染更糟——使用方会以为是组件坏了。
 */
export function controlOf(type) {
  const t = type.trim()
  if (t === 'boolean') return { kind: 'boolean' }
  if (t === 'number') return { kind: 'number' }
  if (t === 'string') return { kind: 'string' }

  // 字面量联合（可带 number/string 兜底，如 `'sm' | 'md' | 'lg' | number`）
  const parts = t.split('|').map((p) => p.trim())
  const literals = parts.filter((p) => /^'[^']*'$/.test(p)).map((p) => p.slice(1, -1))
  if (literals.length >= 2 && literals.length === parts.length) return { kind: 'enum', options: literals }
  return null
}
