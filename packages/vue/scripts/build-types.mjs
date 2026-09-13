/**
 * Vue 2 包的类型声明。
 *
 * 不能走 vue-tsc：它绑的是 Vue 3 语言服务，拿去编 2.7 的 SFC 会把
 * defineEmits 调用签名、String(aria-*)、defineModel polyfill 全报成错，
 * 而根 tsconfig 也明确把 packages/vue 排除在外。
 *
 * 属性类型从源码的 defineProps 抽——和 playground / check:props 同一份解析器，
 * 手写一份一定会漂。复杂类型（来自 @i-design/common 的）用 import() 钉住，
 * 组件内部自己声明的接口退化成 unknown，避免 d.ts 里出现找不到的名字。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseVueProps } from '../../../scripts/lib/parse-props.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const srcDir = join(root, 'packages/vue/src')
const outDir = join(root, 'packages/vue/dist/types')

const BUILTIN = new Set([
  'String', 'Number', 'Boolean', 'Date', 'Record', 'Array', 'Map', 'Set',
  'Promise', 'Partial', 'Omit', 'Pick', 'Readonly', 'Required', 'ReturnType',
  'HTMLElement', 'Element', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent',
  'InputEvent', 'PointerEvent', 'TouchEvent', 'File', 'Blob', 'FormData',
  'CSSProperties', 'StyleValue'
])

function commonTypeNames() {
  const names = new Set()
  const logic = join(root, 'packages/common/src')
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name)
      if (name.isDirectory()) walk(p)
      else if (name.name.endsWith('.ts') && !name.name.endsWith('.test.ts')) {
        const text = readFileSync(p, 'utf8')
        for (const m of text.matchAll(/^export (?:type|interface|enum|class) (\w+)/gm)) names.add(m[1])
        for (const m of text.matchAll(/^export type \{([^}]+)\}/gm)) {
          for (const part of m[1].split(',')) {
            const id = part.trim().split(/\s+as\s+/).pop().trim()
            if (id) names.add(id)
          }
        }
      }
    }
  }
  walk(logic)
  return names
}

function qualify(type, known) {
  return type.replace(/\b[A-Z][A-Za-z0-9]+\b/g, (name, offset, src) => {
    if (BUILTIN.has(name)) return name
    if (known.has(name)) return `import('@i-design/common').${name}`
    // 未识别的泛型构造子留原名：写成 unknown<T> 会让整份 d.ts 都解析不了
    const after = src.slice(offset + name.length).trimStart()
    if (after.startsWith('<')) return name
    return 'unknown'
  })
}

const known = commonTypeNames()
const components = readdirSync(join(srcDir, 'components'))
  .filter((f) => f.endsWith('.vue') && !f.startsWith('_') && f !== 'IMessageList.vue')
  .sort()

const lines = [
  '/* 由 packages/vue/scripts/build-types.mjs 生成，请勿手改。 */',
  "import { DefineComponent } from 'vue'",
  ''
]

for (const file of components) {
  const name = file.replace('.vue', '')
  const parsed = parseVueProps(join(srcDir, 'components', file))
  const fields = []
  const seen = new Set()
  for (const prop of parsed.props ?? []) {
    const propName = prop.name === 'modelValue' ? 'value' : prop.name
    if (seen.has(propName)) continue
    seen.add(propName)
    const optional = prop.optional || prop.defaultText != null ? '?' : ''
    fields.push(`  ${propName}${optional}: ${qualify(prop.type, known)}`)
  }
  const props = fields.length ? `{\n${fields.join('\n')}\n}` : 'Record<string, never>'
  lines.push(`export declare const ${name}: DefineComponent<${props}>`)
}

lines.push('')
lines.push(`export type MessageType = 'info' | 'success' | 'warning' | 'danger'`)
lines.push(`export interface MessageRecord { id: number; type: MessageType; content: string; closable: boolean }`)
lines.push(`export interface MessageOptions { content: string; type?: MessageType; duration?: number; closable?: boolean }`)
lines.push(`export declare const messages: { value: MessageRecord[] }`)
lines.push(`export declare function closeMessage(id: number): void`)
lines.push(`export declare const message: {`)
lines.push(`  open: (options: MessageOptions) => { close: () => void }`)
lines.push(`  info: (content: string, options?: Omit<MessageOptions, 'content' | 'type'>) => { close: () => void }`)
lines.push(`  success: (content: string, options?: Omit<MessageOptions, 'content' | 'type'>) => { close: () => void }`)
lines.push(`  warning: (content: string, options?: Omit<MessageOptions, 'content' | 'type'>) => { close: () => void }`)
lines.push(`  error: (content: string, options?: Omit<MessageOptions, 'content' | 'type'>) => { close: () => void }`)
lines.push(`  closeAll: () => void`)
lines.push(`}`)
lines.push('')

mkdirSync(outDir, { recursive: true })
const dts = lines.join('\n')
// 生成物必须是合法 TypeScript：parse-props 曾把 Record<string, T> 按逗号切开，
// 整份 d.ts 在第一处截断处就解析失败，使用方的类型检查全部变成语法错。
if (/:\s*(?:Partial<)?Record<[^>\n]*$/m.test(dts)) {
  throw new Error('Vue 2 类型声明含有未闭合的 Record<…>，检查 parse-props 是否把泛型逗号当成了属性分隔')
}
writeFileSync(join(outDir, 'index.d.ts'), dts)
console.log(`Vue 2 类型声明 → dist/types/index.d.ts（${components.length} 个组件）`)
