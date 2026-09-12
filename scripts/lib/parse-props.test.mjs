/**
 * parse-props 把 defineProps 的类型体切成条目。
 * 切错的话 playground 控件会丢、Vue 2 的 d.ts 会写成非法语法，两边都不会在构建时报。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseVueProps, topLevelEntries } from './parse-props.mjs'

test('Record<string, T> 里的逗号不是属性分隔', () => {
  const entries = topLevelEntries(
    "    model: Record<string, any>\n    rules?: Record<string, FormRule[]>\n    labels?: Partial<Record<string, string>>"
  )
  assert.equal(entries.length, 3)
  assert.equal(entries[0].trim(), 'model: Record<string, any>')
  assert.equal(entries[1].trim(), 'rules?: Record<string, FormRule[]>')
  assert.equal(entries[2].trim(), 'labels?: Partial<Record<string, string>>')
})

test('箭头类型里的 => 不把泛型深度减穿', () => {
  const entries = topLevelEntries("    onChange?: (next: boolean) => void\n    name: string")
  assert.equal(entries.length, 2)
  assert.equal(entries[0].trim(), 'onChange?: (next: boolean) => void')
  assert.equal(entries[1].trim(), 'name: string')
})

test('IForm / IChartSankey 的 Record 属性类型完整保留', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const form = parseVueProps(join(root, 'src/components/IForm.vue'))
  const model = form.props.find((p) => p.name === 'model')
  const rules = form.props.find((p) => p.name === 'rules')
  assert.equal(model?.type, 'Record<string, any>')
  assert.equal(rules?.type, 'Record<string, FormRule[]>')

  const sankey = parseVueProps(join(root, 'src/components/IChartSankey.vue'))
  const labels = sankey.props.find((p) => p.name === 'labels')
  assert.equal(labels?.type, 'Record<string, string>')
})
