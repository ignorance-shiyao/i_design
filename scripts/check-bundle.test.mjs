/**
 * 故障注入：体积这条检查真的会红吗。
 *
 * 用的是报告里的记录值：把记录值改小，等价于「体积涨上去了」；
 * 把重资源的判据换成按钮一定会命中的字样，等价于「摇树失效了」。
 */
import assert from 'node:assert/strict'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkBundle, recordedSizes } from './check-bundle.mjs'
import { HEAVY_MARKERS, measure, SCENARIOS, reportFile } from './build-bundle-report.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-bundle-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  copyFileSync(reportFile, join(root, reportFile))
  return root
}

test('当前仓库通过', async () => {
  assert.match(await checkBundle(), /体积检查通过/)
})

test('体积涨过预算时失败', async (t) => {
  const root = fixture(t)
  const text = readFileSync(join(root, reportFile), 'utf8')
  // 把「只引一个按钮」那一行的记录值改成 1 kB：等价于这次改动让它涨了几十倍
  writeFileSync(join(root, reportFile), text.replace(/^(\| 只引一个按钮 \| [\d.]+ kB \| )[\d.]+ kB/m, '$11.0 kB'))
  await assert.rejects(checkBundle(root), /超过 5% 预算/)
})

test('报告里少了某个场景时失败', async (t) => {
  const root = fixture(t)
  const text = readFileSync(join(root, reportFile), 'utf8')
  writeFileSync(join(root, reportFile), text.replace(/^\| 只引一个按钮 .*$/m, ''))
  await assert.rejects(checkBundle(root), /BUNDLE\.md 里没有/)
})

test('重资源的判据确实能在产物里命中——不是一条永远为假的正则', async () => {
  const all = await measure(SCENARIOS.find((s) => s.id === 'all'))
  assert.ok(all.carried.includes('流程画布'), '全量产物里应当认出流程画布')
  assert.ok(all.carried.includes('图表'), '全量产物里应当认出图表')
  // 只引按钮时这几条都不该命中，否则上面那条断言等于没测
  const button = await measure(SCENARIOS.find((s) => s.id === 'button'))
  assert.deepEqual(button.carried, [])
  assert.equal(Object.keys(HEAVY_MARKERS).length, 3)
})

test('记录值能从报告里读回来', () => {
  const sizes = recordedSizes()
  assert.ok(sizes.get('只引一个按钮') > 0)
})
