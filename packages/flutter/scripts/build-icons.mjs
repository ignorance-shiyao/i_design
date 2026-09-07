/**
 * 把公共层的图标路径数据编译为 Dart。
 *
 * Flutter 没有 CSS，也无法直接吃 SVG 字符串，社区事实标准是 flutter_svg。
 * 这里生成「图标名 → SVG path」的映射，由 IIcon 组装成完整 SVG 渲染，
 * 颜色不烤进数据、渲染时注入，因此图标依然跟随文字色，与其他六端一致。
 *
 * 不手抄 38 段 path：抄一次就会和 Web 端分叉，那正是设计体系最怕的事。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const tmp = join(root, '.icons.build.mjs')

execFileSync(
  join(root, '../../node_modules/.bin/esbuild'),
  [join(root, '../common/src/icons/index.ts'), '--bundle', '--format=esm', `--outfile=${tmp}`],
  { stdio: 'pipe' }
)
const { icons } = await import(pathToFileURL(tmp).href)
const names = Object.keys(icons)

const entries = names.map((name) => `  '${name}':\n      '${icons[name]}',`).join('\n')

const dart = `// 由 packages/flutter/scripts/build-icons.mjs 从 @i-design/common 生成，请勿手改。
//
// 24×24 网格、2px 描边的线性图标。颜色不写进数据，由 IIcon 渲染时注入，
// 因此图标跟随文字色与主题变化，无需为深色模式准备第二套。

/// 图标名 → SVG path 的 d 属性
const Map<String, String> kIDesignIconPaths = <String, String>{
${entries}
};

/// 把 path 数据包成完整 SVG 源；[color] 为 CSS 颜色字符串
String iDesignIconSvg(String name, {String color = '#000000', double strokeWidth = 1.8}) {
  final path = kIDesignIconPaths[name];
  if (path == null) {
    throw ArgumentError('未知图标: \$name');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
      'stroke="\$color" stroke-width="\$strokeWidth" stroke-linecap="round" '
      'stroke-linejoin="round"><path d="\$path"/></svg>';
}

/// 全部图标名，便于做图标库页面
const List<String> kIDesignIconNames = <String>[
${names.map((n) => `  '${n}',`).join('\n')}
];
`

mkdirSync(join(root, 'lib/src/icons'), { recursive: true })
writeFileSync(join(root, 'lib/src/icons/icons.dart'), dart)
execFileSync('rm', ['-f', tmp])
console.log(`编译 ${names.length} 个图标 → lib/src/icons/icons.dart`)
