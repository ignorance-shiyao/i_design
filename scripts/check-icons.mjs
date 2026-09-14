/**
 * 图标本体与元数据的一致性（astra.md 的 C01）。
 *
 * 图标库真正的可用性不在数量上，在「想得到的词能不能找到东西」。
 * 所以元数据不是装饰：少一条，那个图标在检索里就不存在；
 * 多一条，图标浏览器会渲染一个不存在的图标（或者干脆报错）。
 *
 * 查五件事：一一对应、路径非空且只含路径数据、分类合法、
 * 别名不跨图标重复（重复的话搜出来的第一个多半不是他要的）、
 * 弃用项指向的替代品确实存在。
 */
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

async function load(root) {
  const bundled = await build({
    stdin: {
      contents: `export { icons } from './packages/common/src/icons/index.ts'
        export * from './packages/common/src/icons/meta.ts'`,
      resolveDir: root,
      loader: 'ts'
    },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  return import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)
}

export async function checkIcons(root = process.cwd()) {
  const { icons, iconMeta, ICON_CATEGORIES, metaGaps, searchIcons, missingCategories } = await load(root)

  const gaps = metaGaps()
  assert.deepEqual(gaps.missingMeta, [], `这些图标没有元数据，检索不到它们：${gaps.missingMeta.join('、')}`)
  assert.deepEqual(gaps.staleMeta, [], `元数据里有本体已经不存在的图标：${gaps.staleMeta.join('、')}`)

  const aliasOwner = new Map()
  for (const [name, meta] of Object.entries(iconMeta)) {
    const path = icons[name]
    assert.ok(path && path.trim(), `图标 ${name} 没有路径数据`)
    assert.ok(
      /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/.test(path),
      `图标 ${name} 的路径里混进了路径数据以外的东西`
    )
    assert.ok(meta.cn && meta.cn.trim(), `图标 ${name} 没有中文名`)
    assert.ok(ICON_CATEGORIES.includes(meta.category), `图标 ${name} 的分类 ${meta.category} 不在语义域清单里`)
    if (meta.deprecatedBy) {
      assert.ok(icons[meta.deprecatedBy], `图标 ${name} 指向的替代品 ${meta.deprecatedBy} 不存在`)
    }
    for (const alias of meta.aliases ?? []) {
      const owner = aliasOwner.get(alias)
      assert.ok(!owner, `别名「${alias}」同时属于 ${owner} 与 ${name}：搜出来的第一个多半不是他要的那个`)
      aliasOwner.set(alias, name)
    }
  }

  // 业务词能检索到图标——这条是整层元数据存在的理由，所以它自己也要被测
  for (const [word, expected] of [['删除', 'trash'], ['导出', 'download'], ['驳回', 'error-circle'], ['排期', 'calendar']]) {
    assert.equal(searchIcons(word)[0], expected, `搜「${word}」应当先给出 ${expected}`)
  }

  const missing = missingCategories()
  return `图标检查通过：${Object.keys(icons).length} 个图标元数据齐全，` +
    `${aliasOwner.size} 条别名无重复` +
    (missing.length ? `；还没有图标的语义域：${missing.join('、')}` : '')
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(await checkIcons())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
