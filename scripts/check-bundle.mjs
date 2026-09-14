/**
 * 按需引入的隔离与体积回归。
 *
 * 两条：
 *   ① 只引一个按钮时，产物里不许出现流程画布、图表、三维那三套；
 *   ② 体积不许悄悄长——与提交在 BUNDLE.md 里的实测值比，超出预算就失败。
 *
 * 为什么要盯着：摇树失效不会让任何构建变红。此前只引一个按钮的产物是
 * 815 kB gzip，其中绝大部分是与按钮毫无关系的插画——它们被 Vite 的
 * library 模式内联成了 data URI，内联之后再怎么摇也摇不掉。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { bundleReport, reportFile, reportSource } from './build-bundle-report.mjs'

/** 允许的自然波动：实现变化会带来几个百分点，一路放大到 5% 就失去意义了 */
const BUDGET = 1.05

/** 从提交的报告里读回上一次的实测值 */
export function recordedSizes(root = process.cwd()) {
  const text = readFileSync(resolve(root, reportFile), 'utf8')
  const sizes = new Map()
  for (const [, title, , gzip] of text.matchAll(/^\| (.+?) \| ([\d.]+) kB \| ([\d.]+) kB \|/gm)) {
    sizes.set(title, Number(gzip) * 1024)
  }
  return sizes
}

export async function checkBundle(root = process.cwd()) {
  const rows = await bundleReport()
  const recorded = recordedSizes(root)

  for (const row of rows) {
    if (row.id === 'all') continue // 全量引入本来就该带上全部能力
    assert.equal(
      row.carried.length, 0,
      `${row.title} 把${row.carried.join('、')}也带进去了：摇树没生效，使用方会为用不到的东西付首屏`
    )
  }

  for (const row of rows) {
    const before = recorded.get(row.title)
    assert.ok(before, `BUNDLE.md 里没有「${row.title}」这一行：运行 npm run build:bundle 重新生成`)
    assert.ok(
      row.gzip <= before * BUDGET,
      `${row.title} 的体积从 ${(before / 1024).toFixed(1)} kB 涨到 ${(row.gzip / 1024).toFixed(1)} kB，` +
      `超过 ${Math.round((BUDGET - 1) * 100)}% 预算。确实需要变大的话，重新生成 BUNDLE.md 并在提交信息里说明为什么`
    )
  }

  assert.equal(readFileSync(resolve(root, reportFile), 'utf8'), reportSource(rows),
    `${reportFile} 过期：运行 npm run build:bundle 并提交生成物`)

  const button = rows.find((r) => r.id === 'button')
  return `体积检查通过：只引一个按钮 ${(button.gzip / 1024).toFixed(1)} kB（gzip），没有带进重资源`
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(await checkBundle())
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
