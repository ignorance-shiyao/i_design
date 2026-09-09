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
const { resolveOverlay, moveMenuActive, firstMenuActive } = await bundle(
  'packages/common/src/logic/overlay.ts',
  'overlay'
)
const {
  flattenTree, resolveCheckState, toggleChecked, searchTree, leafKeys,
  cascaderColumns, cascaderActivate, nodePath
} = await bundle('packages/common/src/logic/tree.ts', 'tree')

/* ---------- 浮层定位 ---------- */
/*
 * 覆盖三类容易在移植时抄错的分支：正常摆放、空间不足翻转、贴边推回。
 * 箭头位置一并断言——它错了不会报任何错，只是气泡指向旁边一个控件。
 */
const overlayCases = [
  // [触发x, 触发y, 触发宽, 触发高, 浮层宽, 浮层高, 方向]
  [400, 300, 80, 32, 200, 100, 'top'],
  [400, 10, 80, 32, 200, 100, 'top'],      // 顶部放不下 → 翻到下方
  [400, 560, 80, 32, 200, 100, 'bottom'],  // 底部放不下 → 翻到上方
  [960, 300, 40, 32, 200, 100, 'bottom'],  // 贴右缘 → 推回视口
  [4, 300, 40, 32, 200, 100, 'bottom'],    // 贴左缘 → 推回视口
  [400, 300, 80, 32, 200, 100, 'right'],
  [960, 300, 40, 32, 200, 100, 'right'],   // 右侧放不下 → 翻到左侧
]
const dartPlacement = (p) => `IPlacement.${p}`

// start 对齐：下拉菜单与选择器用，面板起始边贴齐触发器
const alignCases = [
  [400, 300, 80, 32, 300, 100, 'bottom'],
  [900, 300, 80, 32, 300, 100, 'bottom'],  // 贴右缘仍要推回视口
  [400, 300, 80, 32, 200, 300, 'right'],
]
const alignExpectations = alignCases.map(([tx, ty, tw, th, pw, ph, placement]) => {
  const r = resolveOverlay({
    trigger: { x: tx, y: ty, width: tw, height: th },
    popup: { x: 0, y: 0, width: pw, height: ph },
    viewport: { x: 0, y: 0, width: 1000, height: 600 },
    placement, align: 'start'
  })
  return `    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(${tx}, ${ty}, ${tw}, ${th}),
          popup: const IOverlayRect(0, 0, ${pw}, ${ph}),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: ${dartPlacement(placement)},
          align: IOverlayAlign.start,
        ),
        ${r.x}, ${r.y}, ${dartPlacement(r.placement)}, ${r.arrow},
        'resolveOverlay(${tx},${ty} ${placement} start)');`
})
const overlayExpectations = overlayCases.map(([tx, ty, tw, th, pw, ph, placement]) => {
  const r = resolveOverlay({
    trigger: { x: tx, y: ty, width: tw, height: th },
    popup: { x: 0, y: 0, width: pw, height: ph },
    viewport: { x: 0, y: 0, width: 1000, height: 600 },
    placement
  })
  return `    _expectOverlay(
        resolveOverlay(
          trigger: const IOverlayRect(${tx}, ${ty}, ${tw}, ${th}),
          popup: const IOverlayRect(0, 0, ${pw}, ${ph}),
          viewport: const IOverlayRect(0, 0, 1000, 600),
          placement: ${dartPlacement(placement)},
        ),
        ${r.x}, ${r.y}, ${dartPlacement(r.placement)}, ${r.arrow},
        'resolveOverlay(${tx},${ty} ${placement})');`
})

// 菜单导航：true 表示可选，false 表示禁用或分隔线
const menuSelectable = [true, false, false, true, true]
const menuItems = menuSelectable.map((ok) => (ok ? {} : { disabled: true }))
const menuCases = [[0, 1], [0, -1], [3, 1], [4, 1], [4, -1]]
const menuExpectations = menuCases.map(([current, step]) =>
  `    expect(moveMenuActive(selectable, ${current}, ${step}), ${moveMenuActive(menuItems, current, step)});`)

/* ---------- 树：半选传播与禁用继承 ----------
 * 这两处是移植时最容易抄错的分支，尤其「禁用子节点不该拖住父节点」——
 * 抄错了界面上表现为父节点永远勾不上，很难复现。
 */
const treeData = [
  { key: 'a', label: '平台', children: [
    { key: 'a1', label: '账号' },
    { key: 'a2', label: '权限', children: [
      { key: 'a2x', label: '角色' },
      { key: 'a2y', label: '策略', disabled: true }
    ]}
  ]},
  { key: 'b', label: '计费', children: [{ key: 'b1', label: '账单' }] },
  { key: 'c', label: '归档', disabled: true, children: [{ key: 'c1', label: '旧数据' }] }
]
const treeEntities = flattenTree(treeData)
const dartTreeData = `<ITreeNode>[
      ITreeNode(key: 'a', label: '平台', children: <ITreeNode>[
        ITreeNode(key: 'a1', label: '账号'),
        ITreeNode(key: 'a2', label: '权限', children: <ITreeNode>[
          ITreeNode(key: 'a2x', label: '角色'),
          ITreeNode(key: 'a2y', label: '策略', disabled: true),
        ]),
      ]),
      ITreeNode(key: 'b', label: '计费', children: <ITreeNode>[
        ITreeNode(key: 'b1', label: '账单'),
      ]),
      ITreeNode(key: 'c', label: '归档', disabled: true, children: <ITreeNode>[
        ITreeNode(key: 'c1', label: '旧数据'),
      ]),
    ]`
const sorted = (set) => [...set].sort()
const dartSet = (set) => `<String>{${sorted(set).map((k) => `'${k}'`).join(', ')}}`

// [起始选中, 要切换的 key, 切换为]
const checkCases = [
  [[], 'a2', true],
  [[], 'a', true],
  [['a1'], 'a2', true],
  [['a1', 'a2'], 'a2x', false],
  [[], 'c', true],
]
const checkExpectations = checkCases.map(([start, key, next]) => {
  const result = toggleChecked(treeEntities, start, key, next)
  const state = resolveCheckState(treeEntities, result)
  const startLiteral = `<String>[${start.map((k) => `'${k}'`).join(', ')}]`
  return `    _expectTreeState(
        resolveCheckState(entities, toggleChecked(entities, ${startLiteral}, '${key}', ${next})),
        ${dartSet(state.checked)}, ${dartSet(state.halfChecked)},
        'toggleChecked(${key}, ${next})');`
})

const searchCases = ['角色', '平台', '账']
const searchExpectations = searchCases.map((word) => {
  const r = searchTree(treeEntities, word)
  return `    _expectTreeSearch(searchTree(entities, '${word}'),
        ${dartSet(r.visible)}, ${dartSet(r.expand)}, ${dartSet(r.matched)}, 'searchTree(${word})');`
})

const leafExpectation = (() => {
  const state = resolveCheckState(treeEntities, toggleChecked(treeEntities, [], 'a', true))
  const leaves = leafKeys(treeEntities, state.checked).sort()
  return `    expect(
        (leafKeys(entities, resolveCheckState(entities, toggleChecked(entities, <String>[], 'a', true)).checked)..sort()),
        <String>[${leaves.map((k) => `'${k}'`).join(', ')}]);`
})()

/* ---------- 级联：列生成与换列截断 ----------
 * 「在第 2 列换一个选项时第 3 列必须作废」是级联最常见的错误，
 * 只追加不截断的实现在界面上表现为右侧残留上一次的子项。
 */
const cascaderData = [
  { key: 'cn', label: '中国', children: [
    { key: 'zj', label: '浙江', children: [{ key: 'hz', label: '杭州' }, { key: 'nb', label: '宁波' }] },
    { key: 'js', label: '江苏', children: [{ key: 'nj', label: '南京' }] }
  ]},
  { key: 'us', label: '美国', children: [{ key: 'ca', label: '加州' }] }
]
const cascaderEntities = flattenTree(cascaderData)
const dartCascaderData = `<ITreeNode>[
      ITreeNode(key: 'cn', label: '中国', children: <ITreeNode>[
        ITreeNode(key: 'zj', label: '浙江', children: <ITreeNode>[
          ITreeNode(key: 'hz', label: '杭州'),
          ITreeNode(key: 'nb', label: '宁波'),
        ]),
        ITreeNode(key: 'js', label: '江苏', children: <ITreeNode>[
          ITreeNode(key: 'nj', label: '南京'),
        ]),
      ]),
      ITreeNode(key: 'us', label: '美国', children: <ITreeNode>[
        ITreeNode(key: 'ca', label: '加州'),
      ]),
    ]`
const dartList = (arr) => `<String>[${arr.map((k) => `'${k}'`).join(', ')}]`

const columnCases = [[], ['cn'], ['cn', 'zj'], ['cn', 'zj', 'hz']]
const columnExpectations = columnCases.map((path) => {
  const cols = cascaderColumns(cascaderData, cascaderEntities, path)
  const shape = cols.map((c) => c.map((n) => n.key))
  return `    _expectColumns(cascaderColumns(data, entities, ${dartList(path)}),
        <List<String>>[${shape.map((c) => dartList(c)).join(', ')}],
        'cascaderColumns(${path.join('/')})');`
})

// 从 cn/zj/hz 切到 js：路径必须被截断为 cn/js
const activateCases = [[['cn', 'zj', 'hz'], 'js'], [['cn'], 'us'], [[], 'hz']]
const activateExpectations = activateCases.map(([path, key]) =>
  `    expect(cascaderActivate(entities, ${dartList(path)}, '${key}'),
        ${dartList(cascaderActivate(cascaderEntities, path, key))});`)

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

/* ---------- 散点：气泡半径与最小二乘拟合 ----------
 * 拟合最容易在移植时抄错分母，一旦抄错，两端的趋势线会指向不同方向。
 */
const { bubbleRadius, trendLine } = await bundle('packages/common/src/logic/chart.ts', 'chart')

const bubbleCases = [[0, 0, 100], [50, 0, 100], [100, 0, 100], [7, 5, 5], [-3, 0, 10]]
const bubbleExpectations = bubbleCases.map(
  ([v, lo, hi]) =>
    `    expect(bubbleRadius(${v.toFixed(1)}, ${lo.toFixed(1)}, ${hi.toFixed(1)}),
        closeTo(${bubbleRadius(v, lo, hi)}, 1e-9));`
)

const trendCases = [
  [[1, 2], [2, 4], [3, 6], [4, 8]],
  [[1, 3], [2, 1], [3, 4], [4, 2], [5, 6]],
  [[1, 5], [2, 5]],
  [[2, 1], [2, 4], [2, 9]]
]
const dartPoints = (pts) =>
  `<ScatterPoint>[${pts.map(([x, y]) => `ScatterPoint(x: ${x.toFixed(1)}, y: ${y.toFixed(1)})`).join(', ')}]`
const trendExpectations = trendCases.map((pts, i) => {
  const fit = trendLine(pts.map(([x, y]) => ({ x, y })))
  if (fit === null) return `    expect(trendLine(${dartPoints(pts)}), isNull, reason: '第 ${i} 组应当不拟合');`
  return `    final fit${i} = trendLine(${dartPoints(pts)})!;
    expect(fit${i}.slope, closeTo(${fit.slope}, 1e-9));
    expect(fit${i}.intercept, closeTo(${fit.intercept}, 1e-9));
    expect(fit${i}.r2, closeTo(${fit.r2}, 1e-9));`
})

const file = `// 由 packages/flutter/scripts/build-golden-test.mjs 生成，请勿手改。
//
// 期望值全部由 packages/common 的 TypeScript 实现算出，因此这份测试校验的是
// 「Dart 移植与公共层是否一致」，而不是「Dart 移植与自己是否一致」。
import 'package:flutter_test/flutter_test.dart';
import 'package:i_design/src/logic/pagination.dart';
import 'package:i_design/src/logic/number.dart';
import 'package:i_design/src/logic/select.dart';
import 'package:i_design/src/logic/table.dart';
import 'package:i_design/src/logic/overlay.dart';
import 'package:i_design/src/logic/tree.dart';
import 'package:i_design/src/logic/chart.dart';

void _expectPages(List<IPageItem> actual, List<IPageItem> expected, String label) {
  expect(actual.length, expected.length, reason: '\$label 长度不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].page, expected[i].page, reason: '\$label 第 \$i 项页码不一致');
    expect(actual[i].gap, expected[i].gap, reason: '\$label 第 \$i 项省略位不一致');
  }
}

void _expectOverlay(IOverlayPosition actual, double x, double y,
    IPlacement placement, double arrow, String label) {
  expect(actual.x, closeTo(x, 1e-9), reason: '\$label x 不一致');
  expect(actual.y, closeTo(y, 1e-9), reason: '\$label y 不一致');
  expect(actual.placement, placement, reason: '\$label 方向不一致');
  expect(actual.arrow, closeTo(arrow, 1e-9), reason: '\$label 箭头位置不一致');
}

void _expectTreeState(ITreeCheckState actual, Set<String> checked,
    Set<String> halfChecked, String label) {
  expect(actual.checked, checked, reason: '\$label 选中集合不一致');
  expect(actual.halfChecked, halfChecked, reason: '\$label 半选集合不一致');
}

void _expectTreeSearch(ITreeSearchResult actual, Set<String> visible,
    Set<String> expand, Set<String> matched, String label) {
  expect(actual.visible, visible, reason: '\$label 可见集合不一致');
  expect(actual.expand, expand, reason: '\$label 展开集合不一致');
  expect(actual.matched, matched, reason: '\$label 命中集合不一致');
}

void _expectColumns(List<List<ITreeNode>> actual, List<List<String>> expected,
    String label) {
  expect(actual.length, expected.length, reason: '\$label 列数不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].map((n) => n.key).toList(), expected[i],
        reason: '\$label 第 \$i 列内容不一致');
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

  test('bubbleRadius 按面积映射，与 Web 端一致', () {
${bubbleExpectations.join('\n')}
  });

  test('trendLine 斜率、截距与 R² 与 Web 端一致', () {
${trendExpectations.join('\n')}
  });

  test('moveActive / moveActiveLoop 与 Web 端一致', () {
    final disabled = ${disabledLiteral};
${moveExpectations.join('\n')}
  });

  test('resolveOverlay 落点、翻转与箭头位置与 Web 端一致', () {
${overlayExpectations.join('\n')}
${alignExpectations.join('\n')}
  });

  test('moveMenuActive / firstMenuActive 与 Web 端一致', () {
    final selectable = ${JSON.stringify(menuSelectable)};
    expect(firstMenuActive(selectable), ${firstMenuActive(menuItems)});
${menuExpectations.join('\n')}
  });

  test('树的选中/半选传播与 Web 端一致（含禁用继承）', () {
    final entities = flattenTree(${dartTreeData});
${checkExpectations.join('\n')}
${leafExpectation}
  });

  test('树的搜索命中与祖先展开与 Web 端一致', () {
    final entities = flattenTree(${dartTreeData});
${searchExpectations.join('\n')}
  });

  test('级联列生成与换列截断与 Web 端一致', () {
    final data = ${dartCascaderData};
    final entities = flattenTree(data);
${columnExpectations.join('\n')}
${activateExpectations.join('\n')}
  });
}
`

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'logic_parity_test.dart'), file)
console.log(`logic_parity_test.dart 已生成：${file.split('expect(').length - 1} 条断言`)
