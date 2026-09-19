/** 故障注入：示例链接这条检查真的会红吗。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkExamples } from './check-examples.mjs'

const APPS = 'examples/shell/src/apps.ts'
const PORTAL = 'examples/portal/src/App.vue'
const DOCS = 'src/pages/ResourcesPage.vue'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-examples-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync('examples', join(root, 'examples'), { recursive: true })
  cpSync(DOCS, join(root, DOCS), { recursive: true })
  return root
}

function patch(root, file, from, to) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

test('当前仓库通过', async () => {
  assert.match(await checkExamples(), /示例链接检查通过/)
})

test('登记为 ready 却没有应用目录时失败——门户上的入口点进去是 404', async (t) => {
  const root = fixture(t)
  rmSync(join(root, 'examples/oa'), { recursive: true, force: true })
  await assert.rejects(checkExamples(root), /examples\/oa/)
})

test('源码路径指到不存在的地方时失败', async (t) => {
  const root = fixture(t)
  patch(root, APPS, "source: 'examples/erp',", "source: 'examples/erp-moved',")
  await assert.rejects(checkExamples(root), /源码路径不存在/)
})

test('两个应用用了同一个 id 时失败', async (t) => {
  const root = fixture(t)
  patch(root, APPS, "    id: 'oa',", "    id: 'erp',")
  await assert.rejects(checkExamples(root), /id 重复/)
})

test('两个应用指向同一个路径时失败', async (t) => {
  const root = fixture(t)
  patch(root, APPS, "    path: '../oa/',", "    path: '../erp/',")
  await assert.rejects(checkExamples(root), /路径重复/)
})

test('门户不再按 status 分档时失败——规划中的应用会拿到空白入口', async (t) => {
  const root = fixture(t)
  patch(root, PORTAL, 'const ready = computed(() => readyApps())', 'const ready = computed(() => exampleApps)')
  await assert.rejects(checkExamples(root), /没有按 status 分档/)
})

test('门户丢掉回文档站的链接时失败——双向变单向', async (t) => {
  const root = fixture(t)
  patch(root, PORTAL, "const docsHref = import.meta.env.VITE_DOCS_BASE || '../../'", "const back = '../../'")
  await assert.rejects(checkExamples(root), /回文档站/)
})

test('文档站丢掉示例入口时失败', async (t) => {
  const root = fixture(t)
  const path = join(root, DOCS)
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('示例应用', '别的东西').replaceAll('examples/portal', 'nowhere'))
  await assert.rejects(checkExamples(root), /没有示例入口/)
})
