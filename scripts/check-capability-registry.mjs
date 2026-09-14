/**
 * 能力注册表的检查：注册表必须是新鲜的，且它记录的能力必须真的拿得到。
 *
 * 「有源码」和「用得上」是两件事：组件写完了却忘了从入口导出，
 * 覆盖矩阵照样是绿的（它只看文件在不在），而使用方 import 不到。
 * 这条检查就是为这个缺口设的。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildRegistry, registryFile, registrySource, imperativeHosts } from './lib/registry.mjs'

export function checkRegistry(root = process.cwd()) {
  // 先检查新鲜度再看内容：顺序反过来，忘记提交生成物就查不出来了
  assert.equal(
    readFileSync(resolve(root, registryFile), 'utf8'),
    registrySource(root),
    '能力注册表过期：运行 npm run build:registry 并提交生成物'
  )

  const rows = buildRegistry(root)
  assert.ok(rows.length > 0, '能力注册表是空的：组件目录没读到东西')

  for (const row of rows) {
    for (const [end, has] of Object.entries(row.ends)) {
      assert.ok(has, `跨端缺口：${row.name} 没有 ${end} 实现`)
      assert.ok(
        row.consumable[end],
        `${row.name} 在 ${end} 有源码（${row.sources[end]}）却没从入口导出，使用方 import 不到`
      )
    }
    if (imperativeHosts.includes(row.name)) continue
    assert.ok(
      row.doc || row.demoRoutes.length,
      `${row.name} 在文档站里没有任何演示：既没有自己的文档页，也没在别的页面出现过`
    )
    if (row.doc) {
      assert.ok(row.doc.demos > 0, `${row.name} 的文档页 ${row.doc.page} 一个演示都没有`)
    }
  }

  const stable = rows.filter((r) => r.maturity === 'stable').length
  return `能力注册表检查通过：${rows.length} 个组件，${stable} 个五端齐备，${rows.filter((r) => r.doc).length} 个有独立文档页`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(await checkRegistry())
}
