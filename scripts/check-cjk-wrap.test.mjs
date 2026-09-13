import test from 'node:test'
import assert from 'node:assert/strict'
import { findBreaks, fixSource } from './check-cjk-wrap.mjs'

const wrap = (body) => `<script setup></script>\n\n<template>\n${body}\n</template>\n`

test('中文与中文之间的换行被查出来', () => {
  const source = wrap('  <p>\n    用户还在填的时候不打断，\n    离开字段时才给出反馈。\n  </p>')
  assert.equal(findBreaks(source).length, 1)
})

test('接回去之后那个空格就不存在了', () => {
  const source = wrap('  <p>\n    用户还在填的时候不打断，\n    离开字段时才给出反馈。\n  </p>')
  const fixed = fixSource(source)
  assert.match(fixed, /不打断，离开字段/)
  assert.equal(findBreaks(fixed).length, 0)
})

test('连着三行也一次接完', () => {
  const source = wrap('  <p>\n    第一句，\n    第二句，\n    第三句。\n  </p>')
  assert.equal(findBreaks(source).length, 2)
  assert.equal(findBreaks(fixSource(source)).length, 0)
})

test('英文换行不动：单词之间本来就该有空格', () => {
  const source = wrap('  <p>\n    the quick brown\n    fox jumps\n  </p>')
  assert.equal(findBreaks(source).length, 0)
})

test('代码示例里的换行是内容本身，不能接', () => {
  // 接起来就把示例改错了，而示例是照着抄的
  const source = wrap("  <DemoBlock code='<IButton>确定</IButton>\n<IButton>取消</IButton>' />")
  assert.equal(findBreaks(source).length, 0)
  assert.equal(fixSource(source), source)
})

test('<pre> 与 <code> 里的换行要显示出来，也不能接', () => {
  const source = wrap('  <pre>\n第一行\n第二行\n  </pre>')
  assert.equal(findBreaks(source).length, 0)
})

test('script 块里的中文换行不算：它不是渲染出来的文本', () => {
  const source = `<script setup lang="ts">\n/* 注释里换行，\n   不影响页面 */\n</script>\n\n<template>\n  <p>一行</p>\n</template>\n`
  assert.equal(findBreaks(source).length, 0)
})

test('模板注释不渲染，接了只会把一段解释挤成一行长文', () => {
  const source = wrap('  <!--\n    改动统计用文字而不是只用颜色，\n    灰度打印下也读得出来。\n  -->\n  <p>一行</p>')
  assert.equal(findBreaks(source).length, 0)
})
