/**
 * 从图标表生成「每个图标一个具名导出」的模块。
 *
 * 为什么需要它：`icons` 是一个对象，摇树摇不掉里面没用到的那些——
 * 只用一个图标的使用方，产物里躺着全部 path 数据。实测过：图标从 53 个
 * 加到 87 个时，只引一个按钮的产物涨了 1.1 kB（gzip），涨的全是用不到的形状。
 *
 * 具名常量则是逐个可摇的：`import { iconTrash }` 只会带走那一条。
 * 生成而不是手写——手写必然与图标表漂移，而漂移不会让构建失败。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const pathsFile = 'packages/common/src/icons/paths.ts'

/** check-circle → iconCheckCircle */
export const constName = (name) =>
  `icon${name.replace(/(^|-)([a-z0-9])/g, (_, __, ch) => ch.toUpperCase())}`

export function readIcons(root = process.cwd()) {
  const text = readFileSync(resolve(root, 'packages/common/src/icons/index.ts'), 'utf8')
  const body = text.slice(text.indexOf('export const icons = {'))
  return [...body.matchAll(/^\s{2}'?([\w-]+)'?:\s*\n?\s*'([^']+)'/gm)].map(([, name, path]) => ({ name, path }))
}

export function pathsSource(root = process.cwd()) {
  const list = readIcons(root)
  return [
    '/**',
    ' * 由 scripts/build-icon-paths.mjs 从 icons/index.ts 生成，请勿手改。',
    ' *',
    ' * 每个图标一个具名常量：只用一个图标时，摇树只会带走那一条，',
    ' * 而从 `icons` 对象里取是整张表一起走。需要极致体积时，',
    ' * 把常量传给 IIcon 的 path 属性，而不是传 name。',
    ' */',
    '',
    ...list.map(({ name, path }) => `export const ${constName(name)} = '${path}'`),
    ''
  ].join('\n')
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const source = pathsSource()
  writeFileSync(pathsFile, source)
  console.log(`单图标导出已生成：${readIcons().length} 个`)
}
