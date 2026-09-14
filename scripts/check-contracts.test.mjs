/** 故障注入：契约边界这条检查真的会红吗，以及它会不会误伤同名字段。 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkContracts } from './check-contracts.mjs'

function fixture(t, source) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-contracts-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src/components'), { recursive: true })
  writeFileSync(join(root, 'src/components/IProbe.vue'), source)
  return root
}

test('当前仓库通过', () => {
  assert.match(checkContracts(), /契约边界检查通过/)
})

test('组件从事件的 raw 里取字段时失败', (t) => {
  assert.throws(
    () => checkContracts(fixture(t, '<script setup lang="ts">\nconst text = event.raw.choices\n</script>')),
    /直接读了事件的 raw/
  )
})

test('供应商特有字段出现在渲染层时失败', (t) => {
  assert.throws(
    () => checkContracts(fixture(t, '<script setup>\nconst t = payload.completion_tokens\n</script>')),
    /供应商特有字段/
  )
})

test('同名但无关的字段不误伤——上传组件的 item.raw 是一个 File', (t) => {
  assert.match(
    checkContracts(fixture(t, '<script setup>\nif (!item.raw) return\nconst raw = el.value\n</script>')),
    /契约边界检查通过/
  )
})
