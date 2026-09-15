/**
 * 每个能用的组件都要在组件总览里出现。
 *
 * 真实发生过：连着加了五个业务组合件，源码、导出、覆盖矩阵、Lab 全都有它们，
 * 唯独组件总览还是旧的——使用者按总览选型，于是那五个组件对他来说等于不存在。
 * 这种缺失不会让任何构建或测试变红，因为总览是一份人工维护的清单。
 *
 * 所以这里按注册表反向核对：注册表里的组件，要么在总览里，要么写进下面的
 * 豁免表并说明为什么。豁免只有一类理由——它不是独立选型对象，
 * 而是某个组件的组成部分（Row 之于 Grid、FormItem 之于 Form）。
 */
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { buildRegistry } from './lib/registry.mjs'

/**
 * 不单独进总览的组件。键是组件名，值写清楚它属于谁——
 * 「它是某个组件的一部分」是唯一可接受的理由，「暂时没写」不是。
 */
export const PART_OF = {
  IRow: 'Grid 的一半，单独一个 Row 没有意义',
  ICol: 'Grid 的另一半，与 Row 成对使用',
  IFormItem: 'Form 的字段容器，脱离 Form 没有用法',
  ICheckboxGroup: 'Checkbox 的多选容器',
  IRadioGroup: 'Radio 的单选容器',
  IButtonGroup: 'Button 的并排容器',
  IAvatarGroup: 'Avatar 的堆叠容器',
  INotificationLayer: '通知的挂载层，由 notification() 命令式调用，不直接写进页面'
}

async function overviewNames(root) {
  const bundled = await build({
    stdin: {
      contents: `export { componentCategories } from './components'`,
      resolveDir: `${root}/src/data`,
      loader: 'ts'
    },
    bundle: true, write: false, format: 'esm', platform: 'node'
  })
  const { componentCategories } = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  )
  return {
    names: new Set(componentCategories.flatMap((g) => g.items).map((i) => `I${i.name}`)),
    groups: componentCategories
  }
}

export async function checkOverviewCoverage(root = process.cwd()) {
  const { names, groups } = await overviewNames(root)
  const rows = buildRegistry(root)

  const missing = rows
    .map((r) => r.name)
    .filter((name) => !names.has(name) && !(name in PART_OF))
  assert.deepEqual(
    missing,
    [],
    `这些组件不在组件总览里，使用者按总览选型时等于它们不存在：${missing.join('、')}\n` +
      '要么把它们归到合适的分类里，要么写进 PART_OF 并说明它是谁的一部分。'
  )

  // 豁免表也会过期：组件删了却还留着一条豁免，下次读的人会以为它还在
  const known = new Set(rows.map((r) => r.name))
  const stale = Object.keys(PART_OF).filter((name) => !known.has(name))
  assert.deepEqual(stale, [], `豁免表里有已经不存在的组件：${stale.join('、')}`)

  // 同一个组件在总览里出现两次，读者会以为是两个东西
  const seen = new Set()
  for (const group of groups) {
    for (const item of group.items) {
      const key = `I${item.name}`
      assert.ok(!seen.has(key), `${item.name} 在总览里出现了两次，读者会以为是两个组件`)
      seen.add(key)
    }
  }

  return `总览覆盖检查通过：${rows.length} 个组件全部可选型（其中 ${Object.keys(PART_OF).length} 个作为组成部分不单列）`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkOverviewCoverage().then(
    (msg) => console.log(msg),
    (err) => {
      console.error(`总览覆盖检查未通过：${err.message}`)
      process.exit(1)
    }
  )
}
