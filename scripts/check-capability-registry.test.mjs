/**
 * 故障注入：这条检查真的会红吗。
 *
 * 这个仓库出现过「检查加了但永远不会失败」，所以每条断言都要有一个对应的坏例子——
 * 把源码、导出、文档演示分别弄坏一处，确认报出的是那一处。
 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkRegistry } from './check-capability-registry.mjs'
import { registryFile, registrySource } from './lib/registry.mjs'

const DIRS = [
  'src/components', 'src/router', 'src/pages/components', 'src/data',
  'packages/vue/src', 'packages/vue-next/src', 'packages/react/src',
  'packages/miniprogram/src/components', 'packages/flutter/lib'
]

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-registry-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of DIRS) cpSync(dir, join(root, dir), { recursive: true })
  return root
}

/** 改完源码后重新生成注册表，好让后面的断言检查内容而不是新鲜度 */
function regenerate(root) {
  writeFileSync(join(root, registryFile), registrySource(root))
}

function patch(root, file, from, to) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：${file} 里找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', (t) => {
  assert.match(checkRegistry(fixture(t)), /能力注册表检查通过/)
})

test('注册表没重新生成就提交，会被判为过期', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'src/components/IDraftBox.vue'), '<template><ul /></template>')
  assert.throws(() => checkRegistry(root), /能力注册表过期/)
})

test('删掉某一端的实现，会报出是哪个组件的哪一端', (t) => {
  const root = fixture(t)
  rmSync(join(root, 'packages/react/src/components/Button.tsx'))
  regenerate(root)
  assert.throws(() => checkRegistry(root), /IButton 没有 react 实现/)
})

test('有源码但忘了从入口导出，不能算这一端已经支持', (t) => {
  for (const [file, from, to, error] of [
    ['packages/react/src/index.ts', 'Button,', '', /IButton 在 react 有源码.*却没从入口导出/],
    ['packages/vue/src/index.ts', "export { default as IButton } from './components/IButton.vue'", '', /IButton 在 vue 有源码.*却没从入口导出/],
    ['packages/flutter/lib/i_design.dart', "export 'src/components/i_button.dart';", '', /IButton 在 flutter 有源码.*却没从入口导出/]
  ]) {
    const root = fixture(t)
    patch(root, file, from, to)
    regenerate(root)
    assert.throws(() => checkRegistry(root), error)
  }
})

test('文档页一个演示都不剩时失败', (t) => {
  const root = fixture(t)
  const page = join(root, 'src/pages/components/ButtonPage.vue')
  writeFileSync(page, readFileSync(page, 'utf8').replace(/<DemoBlock/g, '<section'))
  regenerate(root)
  assert.throws(() => checkRegistry(root), /IButton 的文档页.*一个演示都没有/)
})

test('新组件没有任何演示时失败——只有源码不算交付', (t) => {
  const root = fixture(t)
  const stub = '<template><div /></template>'
  writeFileSync(join(root, 'src/components/IDraftBox.vue'), stub)
  writeFileSync(join(root, 'packages/vue/src/components/IDraftBox.vue'), stub)
  writeFileSync(join(root, 'packages/vue-next/src/IDraftBox.vue'), stub)
  writeFileSync(join(root, 'packages/react/src/components/DraftBox.tsx'), 'export const DraftBox = () => null\n')
  cpSync(join(root, 'packages/miniprogram/src/components/button'),
    join(root, 'packages/miniprogram/src/components/draft-box'), { recursive: true })
  writeFileSync(join(root, 'packages/flutter/lib/src/components/i_draft_box.dart'),
    'class IDraftBox extends StatelessWidget {}\n')
  patch(root, 'packages/react/src/index.ts', 'export {', 'export { DraftBox } from \'./components/DraftBox\'\nexport {')
  patch(root, 'packages/vue/src/index.ts', 'export {', 'export { default as IDraftBox } from \'./components/IDraftBox.vue\'\nexport {')
  patch(root, 'packages/vue-next/src/index.ts', 'export {', 'export { default as IDraftBox } from \'./IDraftBox.vue\'\nexport {')
  patch(root, 'packages/flutter/lib/i_design.dart', "export 'src/components/i_button.dart';",
    "export 'src/components/i_button.dart';\nexport 'src/components/i_draft_box.dart';")
  regenerate(root)
  assert.throws(() => checkRegistry(root), /IDraftBox 在文档站里没有任何演示/)
})
