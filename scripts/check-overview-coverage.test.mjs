/** 故障注入：总览覆盖这条检查真的会红吗。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkOverviewCoverage } from './check-overview-coverage.mjs'

const LIST = 'src/data/components.ts'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-overview-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  // 这条检查要同时读总览与各端源码目录，只拷一份清单的话无从判定
  for (const dir of ['src', 'packages']) cpSync(dir, join(root, dir), { recursive: true })
  return root
}

function patch(root, from, to) {
  const path = join(root, LIST)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', async () => {
  assert.match(await checkOverviewCoverage(), /总览覆盖检查通过/)
})

test('组件没进总览时失败——使用者按总览选型，等于它不存在', async (t) => {
  const root = fixture(t)
  patch(root, "{ name: 'ProTable', cn: '查询表格'", "{ name: 'ProTableX', cn: '查询表格'")
  await assert.rejects(checkOverviewCoverage(root), /IProTable/)
})

test('同一个组件在总览里出现两次时失败', async (t) => {
  const root = fixture(t)
  patch(
    root,
    "      { name: 'ProTable', cn: '查询表格'",
    "      { name: 'ProTable', cn: '查询表格（重复）', to: '/components/table', desc: '重复的一条' },\n      { name: 'ProTable', cn: '查询表格'"
  )
  await assert.rejects(checkOverviewCoverage(root), /出现了两次/)
})

test('豁免表里留着已经删掉的组件时失败', async (t) => {
  const root = fixture(t)
  rmSync(join(root, 'src/components/IRow.vue'))
  rmSync(join(root, 'packages/react/src/components/Grid.tsx'), { force: true })
  await assert.rejects(checkOverviewCoverage(root), /已经不存在的组件/)
})
