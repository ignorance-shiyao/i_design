/**
 * 从组件源码生成属性清单，供文档站的 playground 渲染控件。
 *
 * 为什么不手写：手写的清单会和代码漂移，而漂移不会让任何构建失败。
 * 这个仓库里已经有过先例——组件目录的实现状态手填错了十几个，一直没人发现。
 * 属性清单更糟：使用方照着 playground 调一个早就改名的属性，只会觉得组件坏了。
 */
import { readdirSync, writeFileSync } from 'node:fs'
import { parseVueProps, controlOf } from './lib/parse-props.mjs'

const DIR = 'src/components'
const OUT = 'src/data/componentProps.ts'

const entries = []
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.vue')).sort()) {
  const { props } = parseVueProps(`${DIR}/${file}`)
  if (!props?.length) continue
  const name = file.replace(/\.vue$/, '')
  const list = props.map((p) => ({
    name: p.name,
    type: p.type,
    doc: p.doc,
    defaultText: p.defaultText,
    control: controlOf(p.type)
  }))
  entries.push([name, list])
}

const lines = [
  '/* 由 scripts/build-component-props.mjs 从 src/components/*.vue 生成，请勿手改 */',
  '',
  '/** playground 能渲染的控件形态；认不出类型时为 null，该属性只在文档里列出 */',
  'export type PropControl =',
  "  | { kind: 'boolean' }",
  "  | { kind: 'number' }",
  "  | { kind: 'string' }",
  "  | { kind: 'enum'; options: string[] }",
  '',
  'export interface PropMeta {',
  '  name: string',
  '  /** 源码里的类型文本，原样保留：联合字面量正是分段器选项的来源 */',
  '  type: string',
  '  /** 源码里属性上方的文档注释 */',
  '  doc: string',
  '  /** withDefaults 里的默认值文本；没有默认值时为 null */',
  '  defaultText: string | null',
  '  control: PropControl | null',
  '}',
  '',
  'export const componentProps: Record<string, PropMeta[]> = {'
]
for (const [name, list] of entries) {
  lines.push(`  ${name}: [`)
  for (const p of list) {
    lines.push(`    ${JSON.stringify(p)},`)
  }
  lines.push('  ],')
}
lines.push('}', '')

writeFileSync(OUT, lines.join('\n'))
const total = entries.reduce((n, [, list]) => n + list.length, 0)
const withControl = entries.reduce((n, [, list]) => n + list.filter((p) => p.control).length, 0)
console.log(`属性清单已生成：${entries.length} 个组件，${total} 个属性，其中 ${withControl} 个可现场调整`)
