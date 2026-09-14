/**
 * 路由与导航的一致性（astra.md 的 H01）。
 *
 * 三种错误在本仓库里都不会让任何东西变红，也都真的发生过：
 *
 * - **重名路由**：同一个 path 写了两次，后写的那条永远命中不到。
 *   页面还在、代码还在，只是谁也打不开它。
 * - **孤立路由**：页面写完了，但侧栏没登记、也没有任何一页链接过去。
 *   等于没上线，而覆盖矩阵照样把它算成「有」。
 * - **断链**：导航里的项指向一个不存在的路由，点下去是空白页。
 *
 * 判据全部从源码读：路由表、导航数据、各页面里的 RouterLink。
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** 从路由表里读出所有可访问路径（含父路径拼接） */
export function routes(root = process.cwd()) {
  const src = readFileSync(resolve(root, 'src/router/index.ts'), 'utf8')
  const out = []
  let group = ''
  for (const line of src.split('\n')) {
    const parent = /path:\s*'(\/[a-z0-9-]*)'/.exec(line)
    const child = /path:\s*'([a-z0-9-]+)'/.exec(line)
    const redirect = /redirect:/.test(line)
    if (parent) {
      group = parent[1] === '/' ? '' : parent[1]
      out.push({ path: parent[1], line })
    } else if (child && !redirect) {
      out.push({ path: `${group}/${child[1]}`, line })
    }
  }
  return out
}

/** 页面与导航里出现过的站内链接 */
function links(root) {
  const files = []
  const walk = (dir) => {
    for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${dir}/${entry.name}`)
      else if (/\.(vue|ts)$/.test(entry.name)) files.push(`${dir}/${entry.name}`)
    }
  }
  for (const dir of ['src/pages', 'src/site', 'src/data', 'src/components']) walk(dir)

  const found = new Set()
  for (const file of files) {
    const text = readFileSync(resolve(root, file), 'utf8')
    for (const [, href] of text.matchAll(/\bto="(\/[^"]*)"/g)) found.add(href)
    for (const [, href] of text.matchAll(/\bto:\s*'(\/[^']*)'/g)) found.add(href)
    for (const [, href] of text.matchAll(/:to="`(\/[^`$]*)`"/g)) found.add(href)
  }
  return found
}

export function checkRoutes(root = process.cwd()) {
  const all = routes(root)
  const seen = new Map()
  for (const route of all) {
    assert.ok(!seen.has(route.path), `路由重名：${route.path} 写了两次，后写的那条永远命中不到`)
    seen.set(route.path, true)
  }

  const linked = links(root)
  const navText = readFileSync(resolve(root, 'src/data/nav.ts'), 'utf8')
  const navPaths = [...navText.matchAll(/to:\s*'(\/[^']*)'/g)].map((m) => m[1])

  for (const path of navPaths) {
    assert.ok(seen.has(path), `导航里的 ${path} 没有对应路由：点下去是空白页`)
  }

  /*
   * 组件文档页有一条额外要求：它们要么在侧栏里，要么被别的页面链到。
   * 首页、404 这类入口页不适用——它们靠地址栏或兜底路由到达。
   */
  const ENTRY = new Set(['/', '/components', '/design', '/:pathMatch(.*)*'])
  const orphans = all
    .map((r) => r.path)
    .filter((path) => path.startsWith('/components/') || path.startsWith('/design/'))
    .filter((path) => !ENTRY.has(path) && !navPaths.includes(path) && !linked.has(path))

  assert.deepEqual(orphans, [], `这些页面写完了却没有任何入口（侧栏没登记，也没有页面链过去）：${orphans.join('、')}`)

  return `路由检查通过：${all.length} 条路由无重名，导航 ${navPaths.length} 项全部有对应页面，无孤立页面`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(checkRoutes())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
