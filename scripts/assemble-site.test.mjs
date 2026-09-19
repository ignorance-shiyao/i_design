import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assembleSite } from './assemble-site.mjs'
import { loadApps } from './check-examples.mjs'

async function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-site-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'examples/shell/src'), { recursive: true })
  cpSync('examples/shell/src/apps.ts', join(root, 'examples/shell/src/apps.ts'))
  const { exampleApps } = await loadApps(root)
  for (const id of ['portal', ...exampleApps.filter(a => a.status === 'ready').map(a => a.id)]) {
    mkdirSync(join(root, 'dist-examples', id, 'assets'), { recursive: true })
    writeFileSync(join(root, 'dist-examples', id, 'index.html'), `<script src="./assets/app.js"></script>${id}`)
    writeFileSync(join(root, 'dist-examples', id, 'assets/app.js'), `document.title=${JSON.stringify(id)}`)
  }
  mkdirSync(join(root, 'dist/examples'), { recursive: true })
  writeFileSync(join(root, 'dist/index.html'), 'docs')
  writeFileSync(join(root, 'dist/examples/previous.txt'), 'keep until validated')
  return root
}
test('按登记表组装入口和资源，清除旧应用，不覆盖文档首页', async t => {
  const root = await fixture(t)
  const ids = await assembleSite(root)
  assert.ok(ids.includes('oa'))
  for (const id of ids) {
    assert.equal(readFileSync(join(root, 'dist/examples', id, 'index.html'), 'utf8'), `<script src="./assets/app.js"></script>${id}`)
    assert.ok(existsSync(join(root, 'dist/examples', id, 'assets/app.js')))
  }
  assert.equal(readFileSync(join(root, 'dist/index.html'), 'utf8'), 'docs')
  assert.equal(existsSync(join(root, 'dist/examples/previous.txt')), false)
  assert.equal(existsSync(join(root, 'dist/examples/analytics')), false)
})
test('故障注入：删除 OA 构建入口，拒绝组装且保留上次产物', async t => {
  const root = await fixture(t)
  rmSync(join(root, 'dist-examples/oa/index.html'))
  await assert.rejects(assembleSite(root), /示例未构建：oa/)
  assert.ok(existsSync(join(root, 'dist/examples/previous.txt')))
})
test('故障注入：删除门户入口，拒绝产生单向死链', async t => {
  const root = await fixture(t)
  rmSync(join(root, 'dist-examples/portal/index.html'))
  await assert.rejects(assembleSite(root), /示例未构建：portal/)
})
test('故障注入：删除文档首页，拒绝用示例掩盖缺失的主站', async t => {
  const root = await fixture(t)
  rmSync(join(root, 'dist/index.html'))
  await assert.rejects(assembleSite(root), /先构建文档站/)
})
