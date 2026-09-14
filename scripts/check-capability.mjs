/**
 * 能力声明与实现的一致性（astra.md §3.0 选项 B 的配套）。
 *
 * pro 层定为全端之后，「某端确实不支持」必须写成一条能力声明并指名替代路径。
 * 这条检查防止那份声明变成待办清单或者过期清单：
 *
 * 1. 不支持必须同时给出 reason 与 fallback，且不能是「暂不支持」这类空话；
 * 2. 声明写着不支持，那个端就不许存在同名实现——存在说明声明过期了，
 *    而过期的声明比没有声明更糟：它让人以为那个端真的没有；
 * 3. 声明里的组件必须真的存在于别的端，否则这是删组件时漏掉的陈旧声明；
 * 4. 同一个组件加同一个端只能声明一次。
 */
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { buildRegistry } from './lib/registry.mjs'

/** 空话清单：写了等于没写，读的人还是不知道该怎么办 */
const EMPTY_WORDS = [/^暂不支持/, /^不支持$/, /^TODO/i, /^待定/, /^以后/, /^后续/]

async function loadExceptions(root) {
  const bundled = await build({
    stdin: {
      contents: `export * from './packages/common/src/contracts/capability.ts'`,
      resolveDir: root,
      loader: 'ts'
    },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  )
  return mod
}

export async function checkCapability(root = process.cwd()) {
  const { capabilityExceptions, END_NAMES } = await loadExceptions(root)
  const rows = buildRegistry(root)
  const byName = new Map(rows.map((r) => [r.name, r]))

  // 重复先单独扫一遍：混在下面的逐条校验里，第一条的其它问题会先报出来，
  // 掩盖掉「这条被声明了两次」
  const seen = new Set()
  for (const e of capabilityExceptions) {
    const key = `${e.component}@${e.end}`
    assert.ok(!seen.has(key), `${key} 被声明了两次，以哪条为准说不清`)
    seen.add(key)
  }

  for (const e of capabilityExceptions) {
    const key = `${e.component}@${e.end}`
    assert.ok(END_NAMES.includes(e.end), `${e.component} 声明了一个不存在的端：${e.end}`)

    for (const [field, label] of [['reason', '原因'], ['fallback', '替代路径']]) {
      const text = String(e[field] ?? '').trim()
      assert.ok(text, `${key} 没写${label}——「某端不支持」必须说清楚`)
      assert.ok(
        text.length >= 8 && !EMPTY_WORDS.some((re) => re.test(text)),
        `${key} 的${label}是空话（「${text}」）：读的人还是不知道该怎么办`
      )
    }

    const row = byName.get(e.component)
    assert.ok(row, `${e.component} 在任何端都不存在，这是删组件时漏掉的陈旧声明`)
    assert.ok(
      !row.ends[e.end],
      `${key} 声明为不支持，但 ${row.sources[e.end]} 确实存在——过期的声明比没有声明更糟`
    )
  }

  return capabilityExceptions.length
    ? `能力声明检查通过：${capabilityExceptions.length} 条例外，均有原因与替代路径，且对应端确无实现`
    : `能力声明检查通过：没有任何组件声明某端不支持（覆盖矩阵里共 ${rows.length} 个组件）`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkCapability().then(
    (msg) => console.log(msg),
    (err) => {
      console.error(`能力声明检查未通过：${err.message}`)
      process.exit(1)
    }
  )
}
