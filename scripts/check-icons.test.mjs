/** 故障注入：图标元数据这条检查真的会红吗。 */
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkIcons } from './check-icons.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-icons-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync('packages/common/src/icons', join(root, 'packages/common/src/icons'), { recursive: true })
  return root
}

function patch(root, file, from, to) {
  const path = join(root, file)
  const text = readFileSync(path, 'utf8')
  assert.ok(text.includes(from), `测试样本失效：找不到 ${from}`)
  writeFileSync(path, text.replace(from, to))
}

const ICONS = 'packages/common/src/icons/index.ts'
const META = 'packages/common/src/icons/meta.ts'

test('当前仓库通过', async () => {
  assert.match(await checkIcons(), /图标检查通过/)
})

test('新增图标却没写元数据时失败——它在检索里等于不存在', async (t) => {
  const root = fixture(t)
  patch(root, ICONS, "  menu: 'M4 7h16M4 12h16M4 17h16',", "  menu: 'M4 7h16M4 12h16M4 17h16',\n  'brand-new': 'M4 4h16v16H4z',")
  await assert.rejects(checkIcons(root), /没有元数据/)
})

test('元数据里留着已经删掉的图标时失败', async (t) => {
  const root = fixture(t)
  patch(root, META, "  github: {", "  'ghost-icon': { cn: '幽灵', category: 'brand' },\n  github: {")
  await assert.rejects(checkIcons(root), /本体已经不存在/)
})

test('分类不在语义域清单里时失败', async (t) => {
  const root = fixture(t)
  patch(root, META, "github: { cn: 'GitHub', category: 'brand'", "github: { cn: 'GitHub', category: 'misc'")
  await assert.rejects(checkIcons(root), /不在语义域清单里/)
})

test('同一条别名被两个图标占用时失败', async (t) => {
  const root = fixture(t)
  patch(root, META, "aliases: ['仓库', 'repo']", "aliases: ['仓库', 'repo', '回收站']")
  await assert.rejects(checkIcons(root), /同时属于/)
})

test('图标路径被清空时失败', async (t) => {
  const root = fixture(t)
  patch(root, ICONS, "  menu: 'M4 7h16M4 12h16M4 17h16',", "  menu: '',")
  await assert.rejects(checkIcons(root), /没有路径数据/)
})

test('两个图标画得一模一样时失败——其中一个多半是误加的', async (t) => {
  const root = fixture(t)
  patch(root, ICONS, "  menu: 'M4 7h16M4 12h16M4 17h16',", "  menu: 'M4 7h16M4 12h16M4 17h16',\n  'menu-copy': 'M4 7h16M4 12h16M4 17h16',")
  patch(root, META, "  github: {", "  'menu-copy': { cn: '菜单副本', category: 'media' },\n  github: {")
  await assert.rejects(checkIcons(root), /形状完全相同/)
})

test('单图标导出没跟着重新生成时失败', async (t) => {
  const root = fixture(t)
  patch(root, ICONS, "  menu: 'M4 7h16M4 12h16M4 17h16',", "  menu: 'M4 7h16M4 12h16M4 18h16',")
  await assert.rejects(checkIcons(root), /单图标导出过期/)
})

test('业务词检索不到对应图标时失败——这是整层元数据存在的理由', async (t) => {
  const root = fixture(t)
  // 中文名本身就能命中，所以要把名字也一并改掉，才测得到「别名没覆盖业务词」这条路径
  patch(root, META, "trash: { cn: '删除', category: 'action', aliases: ['回收站', '作废', '丢弃', 'delete'] }",
    "trash: { cn: '废纸篓', category: 'action', aliases: ['回收站'] }")
  await assert.rejects(checkIcons(root), /搜「删除」/)
})
