/**
 * 按目录生成 Flutter 端的导出清单。
 *
 * 手写清单会漏——React 端就曾经漏掉 17 个已实现却从未导出的组件，
 * 而 Dart 的 barrel 缺失同样不会让编译失败，只会让使用方 import 不到。
 */
import { readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const list = (dir) =>
  readdirSync(join(root, 'lib', dir))
    .filter((f) => f.endsWith('.dart'))
    .sort()
    .map((f) => `export '${dir}/${f}';`)

const out = `/// Ignorance Design · Flutter
///
/// Flutter 是唯一无法共享 CSS 与 TypeScript 的一端，因此：
///   - 令牌由 packages/common 的编译器生成 Dart 常量，逐值与 Web 端一致；
///   - 交互规则按同一套算法移植（见 src/logic/），由 scripts/check-parity.mjs 兜底。
///
/// 本文件由 packages/flutter/scripts/build-barrel.mjs 按目录生成，勿手改。
library i_design;

${list('src/tokens').join('\n')}
${list('src/theme').join('\n')}
${list('src/icons').join('\n')}
${list('src/logic').join('\n')}
${list('src/components').join('\n')}
`

writeFileSync(join(root, 'lib', 'i_design.dart'), out)
console.log(`i_design.dart 已生成：${out.split('\n').filter((l) => l.startsWith('export')).length} 个导出`)
