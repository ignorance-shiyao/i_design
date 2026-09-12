import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { inventoryFile, inventorySource } from './build-component-inventory.mjs'

export async function checkCatalog(root = process.cwd()) {
  // 先检查，再生成；否则检查会先修好陈旧产物，漏掉忘记提交清单的改动。
  assert.equal(readFileSync(resolve(root, inventoryFile), 'utf8'), inventorySource(root),
    '组件源码清单过期：运行 npm run build:catalog 并提交生成物')
  const bundled = await build({
    stdin: {
      contents: `export { componentCatalog } from './componentCatalog';
        export { componentCategories } from './components';
        export { implementationStatus } from './componentStatus';`,
      resolveDir: resolve(root, 'src/data'), loader: 'ts'
    },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  const { componentCatalog, componentCategories, implementationStatus } = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  )
  const catalog = componentCatalog.flatMap((group) => group.items)
  const overview = componentCategories.flatMap((group) => group.items)
  for (const item of catalog) {
    assert.ok(item.api, `全景缺少稳定组件标识：${item.label}`)
    const actual = implementationStatus(item.api)
    if (item.status === 'excluded') {
      assert.equal(actual, 'planned', `已存在的组件不能标为不做：${item.api}`)
    } else {
      assert.equal(item.status, actual, `全景状态与源码不一致：${item.api}`)
    }
  }
  const router = readFileSync(resolve(root, 'src/router/index.ts'), 'utf8')
  const paths = new Set([...router.matchAll(/path:\s*'([^']*)'/g)].map((match) => match[1]))
  for (const item of overview) {
    assert.equal(item.status, implementationStatus(item.name), `总览状态与源码不一致：${item.name}`)
    if (item.status === 'ready') {
      assert.ok(item.to.startsWith('/components/') && paths.has(item.to.slice('/components/'.length)),
        `可用组件缺少有效文档入口：${item.name} (${item.to})`)
    }
  }
  return `目录检查通过：全景 ${catalog.length} 项（规划中 ${catalog.filter((i) => i.status === 'planned').length}），总览 ${overview.length} 项`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(await checkCatalog())
}
