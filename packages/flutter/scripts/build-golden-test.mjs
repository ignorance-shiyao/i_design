/**
 * 用 TypeScript 的实现算出期望值，生成 Flutter 端的黄金测试。
 *
 * 这个仓库里没有 Dart SDK，跑不了 `flutter test`；但期望值必须来自公共层，
 * 而不是照着 Dart 代码反写——否则移植时抄错的分支会连测试一起抄错。
 * 生成的文件提交进仓库，装有 Flutter 的开发者与 CI 直接 `flutter test` 即可。
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const out = join(repo, 'packages/flutter/test')

const bundle = (entry, name) => {
  const file = `/tmp/golden-${name}.mjs`
  execFileSync('node_modules/.bin/esbuild',
    [entry, '--bundle', '--format=esm', `--outfile=${file}`],
    { cwd: repo, stdio: 'pipe' })
  return import(file)
}

const { buildPages, pageCountOf, clampPage } = await bundle('packages/common/src/logic/pagination.ts', 'pagination')
const { nextSortOrder, sortRows } = await bundle('packages/common/src/logic/table.ts', 'table')
const { moveActive, moveActiveLoop } = await bundle('packages/common/src/logic/select.ts', 'select')
const { clampNumber, roundTo, stepValue, ratioOf, valueFromRatio } = await bundle(
  'packages/common/src/logic/number.ts',
  'number'
)

/* ---------- 分页 ---------- */
const pageCases = [
  [1, 100, 5], [7, 100, 5], [50, 100, 5], [98, 100, 5], [100, 100, 5],
  [1, 3, 5], [2, 7, 5], [4, 8, 3], [1, 0, 5], [3, 12, 7],
]
const dartPageItem = (item) =>
  typeof item === 'number' ? `const IPageItem.page(${item})` : `const IPageItem.gap('${item}')`

const pageExpectations = pageCases.map(([current, count, max]) => {
  const items = buildPages(current, count, max)
  return `    _expectPages(buildPages(${current}, ${count}, ${max}), <IPageItem>[${items.map(dartPageItem).join(', ')}],
        'buildPages(${current}, ${count}, ${max})');`
})

const countCases = [[0, 10], [1, 10], [10, 10], [11, 10], [95, 10], [7, 0]]
const countExpectations = countCases.map(([total, size]) =>
  `    expect(pageCountOf(${total}, ${size}), ${pageCountOf(total, size)});`)

const clampCases = [[0, 5], [1, 5], [5, 5], [9, 5], [-3, 5], [2, 0]]
const clampExpectations = clampCases.map(([page, count]) =>
  `    expect(clampPage(${page}, ${count}), ${clampPage(page, count)});`)

/* ---------- 排序 ----------
 * 只取数值与 ASCII：中文排序两端本就不同（TS 用 localeCompare('zh-CN')，
 * Dart 用码点比较），把它写进黄金测试只会得到一条必然失败的断言。
 */
const dartOrder = (o) => (o === null ? 'null' : `ISortOrder.${o}`)
const orderExpectations = [null, 'asc', 'desc'].map((o) =>
  `    expect(nextSortOrder(${dartOrder(o)}), ${dartOrder(nextSortOrder(o))});`)

const rows = [
  { name: 'b', score: 8 },
  { name: 'a', score: 3 },
  { name: 'c', score: null },
  { name: 'd', score: 5 },
]
const dartRows = `<Map<String, Object?>>[
${rows.map((r) => `      {'name': '${r.name}', 'score': ${r.score === null ? 'null' : r.score}},`).join('\n')}
    ]`

const sortExpectations = [['score', 'asc'], ['score', 'desc'], ['name', 'asc']].map(([key, order]) => {
  const names = sortRows(rows, key, order).map((r) => `'${r.name}'`).join(', ')
  return `    expect(sortRows(rows, '${key}', ISortOrder.${order}).map((r) => r['name']).toList(),
        <String>[${names}]);`
})

/* ---------- 高亮移动 ---------- */
const options = [
  { value: 'a' }, { value: 'b', disabled: true }, { value: 'c' },
  { value: 'd', disabled: true }, { value: 'e' },
]
const disabledLiteral = `<bool>[${options.map((o) => (o.disabled ? 'true' : 'false')).join(', ')}]`

const moveCases = [[0, 1], [0, -1], [2, 1], [4, 1], [4, -1], [2, -1]]
const moveExpectations = moveCases.flatMap(([current, step]) => [
  `    expect(moveActive(disabled, ${current}, ${step}), ${moveActive(options, current, step)});`,
  `    expect(moveActiveLoop(disabled, ${current}, ${step}), ${moveActiveLoop(options, current, step)});`,
])

/* ---------- 数值：夹取、取整、步进、比例 ---------- */
const numberExpectations = [
  ...[[5, 0, 10], [-3, 0, 10], [99, 0, 10]].map(
    ([v, lo, hi]) => `    expect(clampNumber(${v}, ${lo}, ${hi}), ${clampNumber(v, lo, hi)});`
  ),
  ...[[0.30000000000000004, 2], [1.005, 2], [2.5, 0]].map(
    ([v, p]) => `    expect(roundTo(${v}, ${p}), ${roundTo(v, p)});`
  ),
  ...[[0.1, 0.2, 0, 1, 2], [9.5, 1, 0, 10, 1], [0, -1, 0, 10, 0]].map(
    ([cur, st, lo, hi, p]) =>
      `    expect(stepValue(${cur}, ${st}, ${lo}, ${hi}, ${p}), ${stepValue(cur, st, lo, hi, p)});`
  ),
  ...[[25, 0, 100], [0, 0, 100], [7, 5, 5]].map(
    ([v, lo, hi]) => `    expect(ratioOf(${v}, ${lo}, ${hi}), ${ratioOf(v, lo, hi)});`
  ),
  ...[[0.37, 0, 100, 5, 0], [0.5, 0, 1, 0.1, 1], [1.2, 0, 10, 1, 0]].map(
    ([r, lo, hi, st, p]) =>
      `    expect(valueFromRatio(${r}, ${lo}, ${hi}, ${st}, ${p}), ${valueFromRatio(r, lo, hi, st, p)});`
  )
]

const file = `// 由 packages/flutter/scripts/build-golden-test.mjs 生成，请勿手改。
//
// 期望值全部由 packages/common 的 TypeScript 实现算出，因此这份测试校验的是
// 「Dart 移植与公共层是否一致」，而不是「Dart 移植与自己是否一致」。
import 'package:flutter_test/flutter_test.dart';
import 'package:i_design/src/logic/pagination.dart';
import 'package:i_design/src/logic/number.dart';
import 'package:i_design/src/logic/select.dart';
import 'package:i_design/src/logic/table.dart';

void _expectPages(List<IPageItem> actual, List<IPageItem> expected, String label) {
  expect(actual.length, expected.length, reason: '\$label 长度不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].page, expected[i].page, reason: '\$label 第 \$i 项页码不一致');
    expect(actual[i].gap, expected[i].gap, reason: '\$label 第 \$i 项省略位不一致');
  }
}

void main() {
  test('buildPages 与 Web 端逐项一致', () {
${pageExpectations.join('\n')}
  });

  test('pageCountOf 与 Web 端一致', () {
${countExpectations.join('\n')}
  });

  test('clampPage 与 Web 端一致', () {
${clampExpectations.join('\n')}
  });

  test('nextSortOrder 三态循环与 Web 端一致', () {
${orderExpectations.join('\n')}
  });

  test('sortRows 顺序与 Web 端一致（空值恒在末尾）', () {
    final rows = ${dartRows};
${sortExpectations.join('\n')}
  });

  test('数值夹取 / 取整 / 步进 / 比例换算与 Web 端一致', () {
${numberExpectations.join('\n')}
  });

  test('moveActive / moveActiveLoop 与 Web 端一致', () {
    final disabled = ${disabledLiteral};
${moveExpectations.join('\n')}
  });
}
`

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'logic_parity_test.dart'), file)
console.log(`logic_parity_test.dart 已生成：${file.split('expect(').length - 1} 条断言`)
