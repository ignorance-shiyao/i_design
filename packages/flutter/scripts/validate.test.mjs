/**
 * 故障注入：把「生成的跨端对齐测试编译不过」这件事真的做出来，确认校验器会红。
 *
 * 为什么非要测这一条：这个仓库里没有 Dart SDK，`flutter test` 跑不起来，
 * 所以 `logic_parity_test.dart` 能不能编译，**只有这个校验器会管**。
 * 它漏掉过一次——生成器少写一个右括号，两千多条断言一条也没跑，
 * 而 check:flutter 一路绿灯，因为那时它只扫 lib/。
 *
 * 校验器是个跑完就退出的脚本，不导出函数，所以这里按它真实的用法测：
 * 改坏真实文件 → 起子进程跑它 → 断言非零退出且指名那一类问题 → 无论如何都还原。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const validator = join(here, 'validate.mjs')
const goldenTest = join(here, '../test/logic_parity_test.dart')

/** 跑一次校验器，返回 { ok, output } */
function runValidator() {
  try {
    return { ok: true, output: execFileSync('node', [validator], { encoding: 'utf8' }) }
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

test('当前仓库通过，且生成的对齐测试确实被扫到了', () => {
  const { ok, output } = runValidator()
  assert.equal(ok, true, output)
  // 报告里点名它：不然「220 个文件」里看不出测试文件到底有没有进扫描范围
  assert.match(output, /含生成的跨端对齐测试/)
})

test('对齐测试少一个右括号——必须红，而不是继续绿着', () => {
  const original = readFileSync(goldenTest, 'utf8')
  try {
    // 就是当初那个真实的故障：一处 expect 少收一个括号
    writeFileSync(goldenTest, original.replace('expect(', 'expect((', 1))
    const { ok, output } = runValidator()
    assert.equal(ok, false, '文件编译不过了，校验器却说通过')
    assert.match(output, /圆括号不配对/)
    assert.match(output, /logic_parity_test\.dart/)
  } finally {
    writeFileSync(goldenTest, original)
  }
})

test('还原之后立刻恢复绿色——这条防的是上一条把文件改坏了没收拾', () => {
  assert.equal(runValidator().ok, true)
})
