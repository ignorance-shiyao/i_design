import test from 'node:test'
import assert from 'node:assert/strict'
import { auditPage } from './check-when-not.mjs'

const page = (items) =>
  `<template>\n  <article>\n    <h1>X</h1>\n    <h2>什么时候不该用它</h2>\n    <ul>\n${items
    .map((t) => `      <li>${t}</li>`)
    .join('\n')}\n    </ul>\n    <h2>API</h2>\n  </article>\n</template>\n`

test('写齐三条就算过', () => {
  assert.equal(auditPage(page(['甲', '乙', '丙'])).ok, true)
})

test('整节缺失要被查出来', () => {
  const src = '<template>\n  <article>\n    <h1>X</h1>\n    <h2>API</h2>\n  </article>\n</template>\n'
  assert.deepEqual(auditPage(src), { ok: false, reason: '缺这一节' })
})

test('只写一两条也不算：那多半是把某个具体限制当成了选型建议', () => {
  const result = auditPage(page(['甲', '乙']))
  assert.equal(result.ok, false)
  assert.match(result.reason, /只有 2 条/)
})

test('只数这一节里的条目，不把后面的清单算进来', () => {
  const src = page(['甲']) + '<ul><li>另一段清单</li><li>还有一条</li></ul>'
  assert.equal(auditPage(src).ok, false)
})
