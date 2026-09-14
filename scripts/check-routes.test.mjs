/** 故障注入：路由三种错误各造一个。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkRoutes } from './check-routes.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-routes-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['src/router', 'src/pages', 'src/site', 'src/data', 'src/components']) {
    cpSync(dir, join(root, dir), { recursive: true })
  }
  return root
}

function patch(root, file, from, to) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：${file} 里找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', (t) => {
  assert.match(checkRoutes(fixture(t)), /路由检查通过/)
})

test('同一个 path 写两次时失败', (t) => {
  const root = fixture(t)
  patch(root, 'src/router/index.ts',
    "      { path: 'lab', component: () => import('@/pages/LabPage.vue') }",
    "      { path: 'lab', component: () => import('@/pages/LabPage.vue') },\n      { path: 'lab', component: () => import('@/pages/CatalogPage.vue') }")
  assert.throws(() => checkRoutes(root), /路由重名/)
})

test('导航指向不存在的路由时失败', (t) => {
  const root = fixture(t)
  patch(root, 'src/data/nav.ts', "{ to: '/design/lab', label: 'Patterns Lab' }", "{ to: '/design/labb', label: 'Patterns Lab' }")
  assert.throws(() => checkRoutes(root), /没有对应路由/)
})

test('页面写完了却没有任何入口时失败', (t) => {
  const root = fixture(t)
  patch(root, 'src/router/index.ts',
    "      { path: 'lab', component: () => import('@/pages/LabPage.vue') }",
    "      { path: 'lab', component: () => import('@/pages/LabPage.vue') },\n      { path: 'orphan', component: () => import('@/pages/CatalogPage.vue') }")
  assert.throws(() => checkRoutes(root), /没有任何入口/)
})
