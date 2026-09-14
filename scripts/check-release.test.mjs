/** 故障注入：发布核对的每条断言都要有一个对应的坏例子。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkRelease } from './check-release.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-release-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync('packages', join(root, 'packages'), { recursive: true })
  for (const file of ['package.json', 'CHANGELOG.md', 'VERSIONING.md']) copyFileSync(file, join(root, file))
  return root
}

function patch(root, file, from, to) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：${file} 里找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', (t) => {
  assert.match(checkRelease(fixture(t)), /发布核对通过/)
})

test('某个包的版本号掉队时失败', (t) => {
  const root = fixture(t)
  patch(root, 'packages/react/package.json', '"version": "0.1.0"', '"version": "0.1.1"')
  assert.throws(() => checkRelease(root), /packages\/react 的版本是 0\.1\.1/)
})

test('Flutter 的 pubspec 版本掉队时失败', (t) => {
  const root = fixture(t)
  patch(root, 'packages/flutter/pubspec.yaml', 'version: 0.1.0', 'version: 0.2.0')
  assert.throws(() => checkRelease(root), /pubspec\.yaml 的版本/)
})

test('仓库内的包之间写成版本范围时失败', (t) => {
  const root = fixture(t)
  patch(root, 'packages/vue-next/package.json', '"@i-design/common": "0.1.0"', '"@i-design/common": "^0.1.0"')
  assert.throws(() => checkRelease(root), /写死同一个版本/)
})

test('CHANGELOG 里既没有当前版本也没有未发布一节时失败', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'CHANGELOG.md'), '# 变更记录\n\n还没开始记。\n')
  assert.throws(() => checkRelease(root), /CHANGELOG 里既没有/)
})

test('弃用条目没写移除版本时失败——「先标着以后再说」会一直标着', (t) => {
  const root = fixture(t)
  patch(root, 'CHANGELOG.md', '- （无）', '- `IFoo` 的 `type` 属性已弃用，改用 `variant`。')
  assert.throws(() => checkRelease(root), /弃用条目没写移除版本/)
})

test('写了移除版本的弃用条目通过', (t) => {
  const root = fixture(t)
  patch(root, 'CHANGELOG.md', '- （无）', '- `IFoo` 的 `type` 属性已弃用，改用 `variant`，计划在 0.4.0 移除。')
  assert.match(checkRelease(root), /发布核对通过/)
})
