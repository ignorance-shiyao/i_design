import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { checkCatalog } from './check-catalog.mjs'
import { inventoryFile, inventorySource } from './build-component-inventory.mjs'
import { build } from 'esbuild'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'i-design-catalog-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const dir of ['src/data', 'src/router', 'src/components', 'packages/mobile-vue/src/components']) {
    cpSync(dir, join(root, dir), { recursive: true })
  }
  return root
}

async function loadData(root) {
  const result = await build({
    stdin: { contents: `export * from './componentCatalog'; export * from './components'; export * from './componentStatus';`,
      resolveDir: join(root, 'src/data'), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

test('F0 已落地组件、移动专有项和组合能力按真实源码呈现', async (t) => {
  const root = fixture(t)
  const { componentCatalog, componentCategories, implementationStatus } = await loadData(root)
  const catalog = componentCatalog.flatMap((g) => g.items)
  for (const api of ['ILayout', 'ISplitter', 'ITimePicker', 'ITransfer', 'IAutoComplete',
    'IMentions', 'IColorPicker', 'IImageViewer', 'ICarousel', 'ICalendar', 'ITour', 'IWatermark', 'ISticky', 'IQrcode']) {
    assert.equal(catalog.find((i) => i.api === api)?.status, 'ready', api)
  }
  assert.deepEqual(catalog.filter((i) => i.status === 'planned').map((i) => i.api), ['IFloatButton', 'IChatList'])
  for (const api of ['ICell', 'INavBar', 'IToast', 'IRow / ICol', 'IAvatar / IAvatarGroup', 'message()', 'notification', 'Confirm', 'Marquee', 'Minimap', 'Snapshot']) {
    assert.equal(implementationStatus(api), 'ready', api)
  }
  const overview = componentCategories.flatMap((g) => g.items)
  for (const name of ['TimePicker', 'Transfer']) {
    assert.equal(overview.find((i) => i.name === name)?.to, '/components/data-entry')
    assert.equal(overview.find((i) => i.name === name)?.status, 'ready')
  }
  await checkCatalog(root)
})

test('新增规划组件时，陈旧清单失败；生成后目录状态自动更新', async (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'src/components/IFloatButton.vue'), '<template><button /></template>')
  await assert.rejects(checkCatalog(root), /组件源码清单过期/)
  writeFileSync(join(root, inventoryFile), inventorySource(root))
  const { componentCatalog } = await loadData(root)
  assert.equal(componentCatalog.flatMap((g) => g.items).find((i) => i.api === 'IFloatButton').status, 'ready')
  await checkCatalog(root)
})

test('删除组合组件的一部分或命令式宿主后，不能继续显示可用', async (t) => {
  const root = fixture(t)
  rmSync(join(root, 'src/components/ICol.vue'))
  rmSync(join(root, 'src/components/IMessageList.vue'))
  await assert.rejects(checkCatalog(root), /组件源码清单过期/)
  writeFileSync(join(root, inventoryFile), inventorySource(root))
  const { implementationStatus } = await loadData(root)
  assert.equal(implementationStatus('IRow / ICol'), 'planned')
  assert.equal(implementationStatus('message()'), 'planned')
})

test('移动端 IFab 不会把 Web FloatButton 标成可用', async (t) => {
  const { implementationStatus } = await loadData(fixture(t))
  assert.equal(implementationStatus('IFab'), 'ready')
  assert.equal(implementationStatus('IFloatButton'), 'planned')
})

test('手填错误状态、已实现却标不做、空链接均会失败', async (t) => {
  for (const [file, from, to, error] of [
    ['componentCatalog.ts', 'item.status ?? implementationStatus(item.api)', "item.api === 'ILayout' ? 'planned' : item.status ?? implementationStatus(item.api)", /全景状态与源码不一致：ILayout/],
    ['componentCatalog.ts', 'item.status ?? implementationStatus(item.api)', "item.api === 'IQrcode' ? 'excluded' : item.status ?? implementationStatus(item.api)", /已存在的组件不能标为不做：IQrcode/],
    ['components.ts', "name: 'TimePicker', cn: '时间选择器', to: '/components/data-entry'", "name: 'TimePicker', cn: '时间选择器', to: ''", /可用组件缺少有效文档入口：TimePicker/]
  ]) {
    const root = fixture(t)
    const path = join(root, 'src/data', file)
    const text = readFileSync(path, 'utf8')
    assert.ok(text.includes(from))
    writeFileSync(path, text.replace(from, to))
    await assert.rejects(checkCatalog(root), error)
  }
})
