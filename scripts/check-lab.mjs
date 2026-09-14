/**
 * Patterns Lab 的覆盖检查。
 *
 * 覆盖率这件事最容易骗自己：页面上列出一百多个名字，看起来样样都有，
 * 而其中某几个组件早就渲染不出来了——名字还在，所以谁也没发现。
 * 所以这里只认「真的渲染出了东西」：
 *
 *   ① 注册表里的每个组件都要在 Lab 里有一个格子（命令式宿主除外）；
 *   ② 格子里要么真的渲染出节点，要么被标成「需要交互」并给出可运行演示的链接；
 *   ③ 整页零控制台报错——一个组件抛错时它的格子往往还在，只是空着。
 */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
}

function serve(dir) {
  const server = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0])
    const file = join(dir, rel === '/' ? 'index.html' : rel)
    try {
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
      res.end(readFileSync(file))
    } catch {
      // hash 路由：未知路径一律回首页，由前端接管
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(readFileSync(join(dir, 'index.html')))
    }
  })
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })))
}

/** 注册表里应当出现在 Lab 的组件（命令式宿主自己挂到 body 上，没有可看的形态） */
const HOSTS = ['IMessageList', 'IConfirmLayer', 'INotificationLayer']

export async function checkLab(root = process.cwd(), dist = 'dist') {
  const registry = readFileSync(resolve(root, 'src/data/capabilityRegistry.ts'), 'utf8')
  const expected = [...registry.matchAll(/"name":\s*"(I[A-Za-z0-9]+)"/g)]
    .map((m) => m[1])
    .filter((name) => !HOSTS.includes(name))
  assert.ok(expected.length > 0, '注册表里一个组件都没读到')

  const { server, port } = await serve(resolve(root, dist))
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

    await page.goto(`http://localhost:${port}/#/design/lab`, { waitUntil: 'networkidle' })
    // 组件实现是按需加载的，给它们装载的时间；装不完会在下面被判成空格子
    await page.waitForTimeout(2500)

    const cells = await page.evaluate(() =>
      [...document.querySelectorAll('[data-component]')].map((cell) => {
        const stage = cell.querySelector('.lab__stage')
        const note = cell.querySelector('.lab__blocked')
        return {
          name: cell.dataset.component,
          rendered: Boolean(stage && (stage.children.length > 0 || stage.textContent.trim() !== '')
            && !stage.querySelector('.lab__loading')),
          note: note ? note.textContent.replace(/\s+/g, ' ').trim() : null,
          hasDemoLink: Boolean(note && note.querySelector('a'))
        }
      })
    )

    const found = new Set(cells.map((c) => c.name))
    for (const name of expected) {
      assert.ok(found.has(name), `${name} 在 Patterns Lab 里没有格子：新组件要自动出现在这里`)
    }

    for (const cell of cells) {
      if (cell.rendered) continue
      assert.ok(cell.note, `${cell.name} 的演示区是空的：只有名字不算覆盖`)
      assert.ok(
        cell.hasDemoLink,
        `${cell.name} 默认不可见，但没给出可运行演示的位置：${cell.note}`
      )
    }

    assert.equal(errors.length, 0, `Patterns Lab 有控制台报错：${errors.slice(0, 3).join(' / ')}`)

    const live = cells.filter((c) => c.rendered).length
    return `Patterns Lab 覆盖检查通过：${cells.length} 个组件，${live} 个当场渲染，` +
      `${cells.length - live} 个默认不可见但给出了演示入口，零控制台报错`
  } finally {
    await browser.close()
    server.close()
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(await checkLab())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
