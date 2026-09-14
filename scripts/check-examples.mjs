/**
 * 示例门户与应用的链接完整性（astra.md 的 G02）。
 *
 * 验收条件里那句「文档与示例双向链接无死路」不是自动成立的：
 * 登记表、门户、文档站三处各写一份的话，删掉一个应用总会漏改一处，
 * 而漏掉的那处会变成 404——「点开是 404」比「没有入口」更糟。
 *
 * 查五件事：
 * 1. 登记为 ready 的应用必须有真目录（index.html + vite.config.ts + src/main.ts），
 *    否则构建时才发现；
 * 2. source 指的路径必须真的存在，「看源码」不能指到空处；
 * 3. 应用 id 不重复，path 不重复；
 * 4. 规划中的应用不许出现在「可打开」的那一档——留一个点进去空白的入口
 *    比没有入口更糟；
 * 5. 文档站必须有指向示例门户的入口，示例门户必须有回文档站的链接（双向）。
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'esbuild'

const PORTAL_APP = 'examples/portal/src/App.vue'
const DOCS_PAGE = 'src/pages/ResourcesPage.vue'

async function loadApps(root) {
  const bundled = await build({
    stdin: { contents: `export * from './examples/shell/src/apps.ts'`, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  return import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  )
}

export async function checkExamples(root = process.cwd()) {
  const { exampleApps } = await loadApps(root)
  assert.ok(exampleApps.length, '示例登记表是空的')

  const ids = new Set()
  const paths = new Set()
  for (const app of exampleApps) {
    assert.ok(!ids.has(app.id), `示例 id 重复：${app.id}`)
    ids.add(app.id)
    assert.ok(!paths.has(app.path), `示例路径重复：${app.path}（${app.id}）`)
    paths.add(app.path)

    assert.ok(
      existsSync(join(root, app.source)) || app.status === 'planned',
      `${app.id} 的源码路径不存在：${app.source}——「看源码」会指到空处`
    )

    if (app.status !== 'ready') continue
    for (const file of ['index.html', 'vite.config.ts', 'src/main.ts']) {
      assert.ok(
        existsSync(join(root, app.source, file)),
        `${app.id} 登记为 ready，却缺 ${app.source}/${file}——门户上的入口点进去会是 404`
      )
    }
  }

  /* 门户：ready 的给链接，planned 的不给 */
  const portal = readFileSync(join(root, PORTAL_APP), 'utf8')
  assert.match(portal, /readyApps\(\)/, '门户没有按 status 分档，规划中的应用会拿到一个点进去空白的入口')
  // 既要有这个地址，也要真的把它挂在链接上——只定义不使用等于没有
  assert.match(portal, /const docsHref/, '门户缺少回文档站的地址，示例与文档之间只剩单向')
  assert.match(portal, /:href="docsHref"/, '门户定义了回文档站的地址却没挂在链接上')

  /* 文档站：要有指向门户的入口 */
  const docs = readFileSync(join(root, DOCS_PAGE), 'utf8')
  assert.match(
    docs,
    /examples\/portal|示例应用/,
    `${DOCS_PAGE} 里没有示例入口：文档站与示例之间是断的`
  )

  const ready = exampleApps.filter((a) => a.status === 'ready')
  return `示例链接检查通过：${exampleApps.length} 个应用（${ready.length} 个可打开），源码路径与入口齐全，文档与门户双向可达`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkExamples().then(
    (msg) => console.log(msg),
    (err) => {
      console.error(`示例链接检查未通过：${err.message}`)
      process.exit(1)
    }
  )
}
