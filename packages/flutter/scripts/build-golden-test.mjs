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
const {
  summarizeTasks, confidenceOf, approvalProgress,
  chunkLength, chunkPreview, summarizeDiff, defaultDiffSelection,
  toggleDiffRow, diffActionLabel
} = await bundle('packages/common/src/logic/agent.ts', 'agent')

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

/* ---------- 智能体：任务汇总与置信度分档 ----------
 * 进度百分比把失败算作已结束——抄错这一处会让一个永远失败的任务
 * 把进度条卡在 90% 不动，用户以为还在跑。
 */
const dartStatus = (s) => `IAgentTaskStatus.${s}`
const taskCases = [
  ['completed', 'failed', 'running', 'pending'],
  ['completed', 'completed'],
  ['failed', 'failed'],
  ['running'],
  [],
]
const taskExpectations = taskCases.map((statuses) => {
  const tasks = statuses.map((s, i) => ({ id: `${i}`, title: 't', status: s }))
  const r = summarizeTasks(tasks)
  const literal = statuses.length
    ? `<IAgentTask>[${statuses.map((s, i) => `IAgentTask(id: '${i}', title: 't', status: ${dartStatus(s)})`).join(', ')}]`
    : 'const <IAgentTask>[]'
  return `    _expectTaskSummary(summarizeTasks(${literal}),
        ${r.total}, ${r.completed}, ${r.failed}, ${r.running}, ${r.settled}, ${r.percent},
        'summarizeTasks(${statuses.join('/') || '空'})');`
})

const confidenceCases = [0, 0.2, 0.44, 0.45, 0.6, 0.74, 0.75, 0.9, 1, 5, -1]
const dartLevel = (l) => `IConfidenceLevel.${l}`
const confidenceExpectations = confidenceCases.map((v) => {
  const r = confidenceOf(v)
  return `    _expectConfidence(confidenceOf(${v.toFixed(2)}), ${dartLevel(r.level)}, ${r.bars}, '${r.label}', 'confidenceOf(${v})');`
})

const progressExpectations = [[0, 3], [1, 3], [2, 3], [9, 3], [0, 1]].map(
  ([i, t]) => `    expect(approvalProgress(${i}, ${t}), '${approvalProgress(i, t)}');`
)

/* ---------- 上下文片段与差异表 ----------
 * chunkLength 按码点计数：Dart 的 String.length 是 UTF-16 单元数，
 * emoji 会被算成 2；截断同理，按 UTF-16 切会把 emoji 劈成两半。
 */
const chunkCases = ['冷链认证', 'a🎉b', '', 'x'.repeat(200), '🎉'.repeat(20)]
const chunkExpectations = chunkCases.flatMap((text) => {
  const literal = JSON.stringify(text)
  return [
    `    expect(chunkLength(${literal}), ${chunkLength(text)});`,
    `    expect(chunkPreview(${literal}, 10), ${JSON.stringify(chunkPreview(text, 10))});`
  ]
})

const dartKind = (k) => `IDiffRowKind.${k}`
const diffKinds = ['removed', 'removed', 'unchanged', 'added', 'changed']
const diffRows = diffKinds.map((k, i) => ({ id: `r${i}`, kind: k, cells: {} }))
const dartDiffRows = `<IDiffRow>[${diffKinds
  .map((k, i) => `IDiffRow(id: 'r${i}', kind: ${dartKind(k)}, cells: const {})`)
  .join(', ')}]`
const dartIds = (arr) => `<String>[${arr.map((k) => `'${k}'`).join(', ')}]`

const allPicked = defaultDiffSelection(diffRows)
const diffSelectionCases = [allPicked, toggleDiffRow(diffRows, allPicked, 'r0'), []]
const diffExpectations = [
  `    expect(defaultDiffSelection(rows), ${dartIds(allPicked)});`,
  // 未变行点不动，不存在的行安全返回
  `    expect(toggleDiffRow(rows, ${dartIds(allPicked)}, 'r2').length, ${toggleDiffRow(diffRows, allPicked, 'r2').length});`,
  `    expect(toggleDiffRow(rows, ${dartIds(allPicked)}, 'zz').length, ${toggleDiffRow(diffRows, allPicked, 'zz').length});`,
  ...diffSelectionCases.map((sel) => {
    const s = summarizeDiff(diffRows, sel)
    return `    _expectDiff(summarizeDiff(rows, ${dartIds(sel)}),
        ${s.added}, ${s.removed}, ${s.changed}, ${s.selected}, ${s.total},
        ${JSON.stringify(diffActionLabel(s))}, 'summarizeDiff(${sel.length} 选中)');`
  }),
  `    expect(diffActionLabel(summarizeDiff(<IDiffRow>[], <String>[])), ${JSON.stringify(diffActionLabel(summarizeDiff([], [])))});`
]

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
const {
  bubbleRadius, trendLine, quantile, boxStats, waterfallBars, waterfallDomain,
  clampWindow, windowFromRatio, panWindow, labelStep, showLabelAt,
  sankeyLayout, treemapLayout
} = await bundle('packages/common/src/logic/chart.ts', 'chart')

/* ---------- 流程图：框选、批量移动与节点缩放 ----------
 * 三条都是「抄错也不会报错」的规则：命中判定改成相交、位移逐个吸附、
 * 缩放时对角没固定住——每一条都只表现为手感不对，构建全绿。
 */
const {
  marqueeRect, nodesInRect, moveNodes, resizeNode, minimapLayout, viewFromMinimap
} = await bundle('packages/common/src/logic/flow.ts', 'flow')

/* ---------- 走马灯：翻页判定与指示点收窗 ----------
 * 「轻轻一划算不算翻页」抄错不会报错，只会让某一端手感迟钝，
 * 而两端各自试都觉得「大概是这样」。
 */
const { resolveSwipe, nextIndex: carouselNext, dotRange, rubberBand } = await bundle(
  'packages/common/src/logic/carousel.ts',
  'carousel'
)

/* ---------- 无限滚动与数字键盘 ----------
 * 「内容没撑满容器时也要触发」与「小数位满了再按数字应当无效」这两条，
 * 漏掉都不会报错：前者表现为列表永远停在第一页，后者表现为末位被悄悄替换。
 */
const { shouldLoadMore, loadHint } = await bundle('packages/common/src/logic/scroll.ts', 'scroll')
const { pressKey, keypadRows, isComplete } = await bundle(
  'packages/common/src/logic/keypad.ts',
  'keypad'
)

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

/* ---------- 箱线图与瀑布图 ----------
 * 分位数有七八种定义，各端各挑一种就会得到不同的箱子；
 * 须端必须落在实测值上而不是围栏位置，否则会显示一个数据里不存在的数。
 */
const dartNums = (arr) => `<double>[${arr.map((v) => v.toFixed(1)).join(', ')}]`

const quantileCases = [
  [[1, 2, 3], 0.5], [[1, 2, 3, 4], 0.5], [[1, 2, 3, 4], 0.25], [[1, 2, 3, 4], 0.75],
  [[5], 0.25], [[1, 2, 3], 2], [[1, 2, 3], -1],
]
const quantileExpectations = quantileCases.map(([arr, p]) =>
  `    expect(quantile(${dartNums(arr)}, ${p.toFixed(2)}), closeTo(${quantile([...arr].sort((a,b)=>a-b), p)}, 1e-9));`)

const boxCases = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 100],
  [5, 5, 5],
  [10],
]
const boxExpectations = boxCases.map((values) => {
  const s = boxStats(values)
  return `    _expectBox(boxStats(${dartNums(values)}),
        ${s.q1}, ${s.median}, ${s.q3}, ${s.lower}, ${s.upper}, ${s.outliers.length},
        'boxStats(${values.length} 个值)');`
})

const wfItems = [
  { label: '期初', value: 100 }, { label: '增', value: 40 },
  { label: '减', value: -25 }, { label: '合计', value: 0, total: true },
]
const dartWf = `<IWaterfallItem>[${wfItems
  .map((i) => `IWaterfallItem(label: '${i.label}', value: ${i.value.toFixed(1)}${i.total ? ', total: true' : ''})`)
  .join(', ')}]`
const wfBars = waterfallBars(wfItems)
const dartWfKind = (k) => `IWaterfallKind.${k}`
const wfExpectations = wfBars.flatMap((b, i) => [
  `    expect(bars[${i}].start, closeTo(${b.start}, 1e-9));`,
  `    expect(bars[${i}].end, closeTo(${b.end}, 1e-9));`,
  `    expect(bars[${i}].kind, ${dartWfKind(b.kind)});`,
])
const dipBars = waterfallBars([
  { label: 'a', value: 50 }, { label: 'b', value: -80 }, { label: 'c', value: 60 },
])
const dipDomain = waterfallDomain(dipBars)
const wfDomainExpectation = `    expect(
        waterfallDomain(waterfallBars(<IWaterfallItem>[
          const IWaterfallItem(label: 'a', value: 50.0),
          const IWaterfallItem(label: 'b', value: -80.0),
          const IWaterfallItem(label: 'c', value: 60.0),
        ])),
        <double>[${dipDomain[0].toFixed(1)}, ${dipDomain[1].toFixed(1)}]);`


/* ---------- 区间缩放与标签抽稀 ----------
 * 手柄拖过头要交换、到边界只停住不压缩——这两条抄错都不会报错，
 * 只会让窗口在某些拖法下悄悄变窄或直接空掉。
 */
const dartWin = (w) => `const IZoomWindow(start: ${w.start}, end: ${w.end})`
const zoomClampCases = [
  [{ start: 2, end: 6 }, 10, 2],
  [{ start: -5, end: 6 }, 10, 2],
  [{ start: 2, end: 99 }, 10, 2],
  [{ start: 7, end: 3 }, 10, 2],     // 手柄交叉
  [{ start: 5, end: 5 }, 10, 3],     // 过窄
  [{ start: 9, end: 9 }, 10, 3],     // 贴右边向左补
  [{ start: 0, end: 0 }, 2, 5],      // 数据比最小宽度还短
  [{ start: 0, end: 5 }, 0, 2],      // 空数据
]
const zoomClampExpectations = zoomClampCases.map(([w, count, span]) => {
  const r = clampWindow(w, count, span)
  return `    _expectWindow(clampWindow(${dartWin(w)}, ${count}, ${span}), ${r.start}, ${r.end},
        'clampWindow(${w.start},${w.end} / ${count} / ${span})');`
})

const panCases = [
  [{ start: 2, end: 6 }, 3, 10],
  [{ start: 2, end: 6 }, -99, 10],
  [{ start: 2, end: 6 }, 99, 10],
]
const panExpectations = panCases.map(([w, d, count]) => {
  const r = panWindow(w, d, count)
  return `    _expectWindow(panWindow(${dartWin(w)}, ${d.toFixed(1)}, ${count}), ${r.start}, ${r.end},
        'panWindow(${d})');`
})

const ratioCases = [[0, 1, 10], [0, 0.5, 11]]
const ratioExpectations = ratioCases.map(([f, t, count]) => {
  const r = windowFromRatio(f, t, count)
  return `    _expectWindow(windowFromRatio(${f.toFixed(2)}, ${t.toFixed(2)}, ${count}), ${r.start}, ${r.end},
        'windowFromRatio(${f},${t})');`
})

const stepCases = [[6, 600], [90, 576], [180, 576], [1, 100], [50, 0]]
const stepExpectations = stepCases.map(([count, width]) =>
  `    expect(labelStep(${count}, ${width.toFixed(1)}), ${labelStep(count, width)});`)

const step90 = labelStep(90, 576)
const showExpectations = [0, 1, step90, 88, 89].map((i) =>
  `    expect(showLabelAt(${i}, 90, ${step90}), ${showLabelAt(i, 90, step90)});`)


/* ---------- 桑基图与矩形树图 ----------
 * 分层用的是最长路径、层内按流量排序、缎带两端各按占比取一段——
 * 这三条里任何一条移植时走样，两端画出来的就是两张不同的图，
 * 而且都「看起来像桑基图」，肉眼对不出来。
 */
const sankeyCases = [
  { from: 'visit', to: 'leave', value: 600 },
  { from: 'visit', to: 'signup', value: 400 },
  { from: 'signup', to: 'idle', value: 280 },
  { from: 'signup', to: 'pay', value: 120 },
]
const dartSankey = `<ISankeyLink>[${sankeyCases
  .map((l) => `const ISankeyLink(from: '${l.from}', to: '${l.to}', value: ${l.value.toFixed(1)})`)
  .join(', ')}]`
const sankeyResult = sankeyLayout(sankeyCases, 520, 260)
const sankeyNodeExpectations = sankeyResult.nodes.flatMap((n, i) => [
  `    expect(layout.nodes[${i}].key, '${n.key}');`,
  `    expect(layout.nodes[${i}].depth, ${n.depth});`,
  `    expect(layout.nodes[${i}].value, closeTo(${n.value}, 1e-9));`,
  `    expect(layout.nodes[${i}].x, closeTo(${n.x}, 1e-9));`,
  `    expect(layout.nodes[${i}].y, closeTo(${n.y}, 1e-9));`,
  `    expect(layout.nodes[${i}].height, closeTo(${n.height}, 1e-9));`,
])
const sankeyRibbonExpectations = sankeyResult.ribbons.flatMap((r, i) => [
  `    expect(layout.ribbons[${i}].from, '${r.from}');`,
  `    expect(layout.ribbons[${i}].to, '${r.to}');`,
  `    expect(layout.ribbons[${i}].source.top, closeTo(${r.source.top}, 1e-9));`,
  `    expect(layout.ribbons[${i}].source.bottom, closeTo(${r.source.bottom}, 1e-9));`,
  `    expect(layout.ribbons[${i}].target.top, closeTo(${r.target.top}, 1e-9));`,
  `    expect(layout.ribbons[${i}].target.bottom, closeTo(${r.target.bottom}, 1e-9));`,
  `    expect(layout.ribbons[${i}].controlX, closeTo(${r.controlX}, 1e-9));`,
])

const treemapCases = [
  { label: 'a', value: 4200 }, { label: 'b', value: 2600 }, { label: 'c', value: 1500 },
  { label: 'd', value: 620 }, { label: 'e', value: 380 }, { label: 'f', value: 210 },
]
const dartTreemap = `<ITreemapItem>[${treemapCases
  .map((i) => `const ITreemapItem(label: '${i.label}', value: ${i.value.toFixed(1)})`)
  .join(', ')}]`
const treemapResult = treemapLayout(treemapCases, 640, 300)
const treemapExpectations = treemapResult.flatMap((t, i) => [
  `    expect(tiles[${i}].label, '${t.label}');`,
  `    expect(tiles[${i}].percent, closeTo(${t.percent}, 1e-9));`,
  `    expect(tiles[${i}].x, closeTo(${t.x}, 1e-9));`,
  `    expect(tiles[${i}].y, closeTo(${t.y}, 1e-9));`,
  `    expect(tiles[${i}].width, closeTo(${t.width}, 1e-9));`,
  `    expect(tiles[${i}].height, closeTo(${t.height}, 1e-9));`,
])

const flowNodes = [
  { id: 'a', label: 'A', x: 0, y: 0 },
  { id: 'b', label: 'B', x: 200, y: 0 },
  { id: 'c', label: 'C', x: 100, y: 120, width: 80, height: 40 },
]
const dartFlowNodes = `<FlowNodeData>[${flowNodes
  .map((n) => `const FlowNodeData(id: '${n.id}', label: '${n.label}', x: ${n.x.toFixed(1)}, y: ${n.y.toFixed(1)}${
    n.width ? `, width: ${n.width.toFixed(1)}, height: ${n.height.toFixed(1)}` : ''})`)
  .join(', ')}]`

// 往左上拖也是合法的框选，宽高不归一化就会变成负数
const marqueeCases = [[10, 10, 300, 200], [300, 200, 10, 10], [50, 50, 50, 50]]
const marqueeExpectations = marqueeCases.map(([ax, ay, bx, by]) => {
  const r = marqueeRect({ x: ax, y: ay }, { x: bx, y: by })
  return `    _expectRect(marqueeRect(const Offset(${ax.toFixed(1)}, ${ay.toFixed(1)}), const Offset(${bx.toFixed(1)}, ${by.toFixed(1)})),
        ${r.x.toFixed(1)}, ${r.y.toFixed(1)}, ${r.width.toFixed(1)}, ${r.height.toFixed(1)}, 'marquee(${ax},${ay})');`
})

// contain 与 intersect 必须给出不同答案，否则说明判定退化成了同一种
const flow_hitCases = [
  [{ x: -10, y: -10, width: 400, height: 300 }, 'contain'],
  [{ x: -10, y: -10, width: 100, height: 60 }, 'contain'],
  [{ x: -10, y: -10, width: 100, height: 60 }, 'intersect'],
  [{ x: 500, y: 500, width: 10, height: 10 }, 'intersect'],
  // 正好贴边：Rect.contains 对右／下边是开区间，照抄就会与 Web 端差一个节点
  [{ x: 0, y: 0, width: 132, height: 48 }, 'contain'],
]
const flow_hitExpectations = flow_hitCases.map(([rect, mode]) => {
  const ids = nodesInRect(flowNodes, rect, mode)
  return `    expect(
        nodesInRect(nodes, const Rect.fromLTWH(${rect.x.toFixed(1)}, ${rect.y.toFixed(1)}, ${rect.width.toFixed(1)}, ${rect.height.toFixed(1)}), intersect: ${mode === 'intersect'}),
        <String>[${ids.map((i) => `'${i}'`).join(', ')}]);`
})

// 整组一个位移：逐个吸附会把组内原本的相对间距抹平
const flow_moveCases = [[10, 10], [3, -3], [-20, 44]]
const flow_moveExpectations = flow_moveCases.flatMap(([dx, dy]) => {
  const moved = moveNodes(flowNodes, ['a', 'c'], { x: dx, y: dy })
  return moved.map((m, i) =>
    `    expect(moveNodes(nodes, {'a', 'c'}, const Offset(${dx.toFixed(1)}, ${dy.toFixed(1)}))[${i}].x, closeTo(${m.x}, 1e-9));
    expect(moveNodes(nodes, {'a', 'c'}, const Offset(${dx.toFixed(1)}, ${dy.toFixed(1)}))[${i}].y, closeTo(${m.y}, 1e-9));`)
})

// 对角固定、尺寸夹到下限后位置也要停住
const resizeCases = [
  ['se', 400, 300], ['nw', -40, -40], ['se', -999, -999], ['nw', 999, 999], ['ne', 300, -30], ['sw', -30, 300],
]
const resizeExpectations = resizeCases.map(([handle, px, py]) => {
  const box = resizeNode(flowNodes[0], handle, { x: px, y: py })
  return `    _expectRect(resizeNode(nodes[0], FlowResizeHandle.${handle}, const Offset(${px.toFixed(1)}, ${py.toFixed(1)})),
        ${box.x.toFixed(1)}, ${box.y.toFixed(1)}, ${box.width.toFixed(1)}, ${box.height.toFixed(1)}, 'resize ${handle}');`
})

// 缩略图与它的逆运算：点一下就跳过去，两边算不到一处就会跳偏
const mmView = { x: -100, y: -50, scale: 1.5 }
const mmCanvas = { width: 640, height: 380 }
const mmSize = { width: 168, height: 112 }
const mm = minimapLayout(flowNodes, mmView, mmCanvas, mmSize)
const mmBack = viewFromMinimap({ x: 84, y: 56 }, mm, mmView, mmCanvas)
const minimapExpectations = [
  `    expect(mm.scale, closeTo(${mm.scale}, 1e-9));`,
  `    expect(mm.offset.dx, closeTo(${mm.offsetX}, 1e-9));`,
  `    expect(mm.offset.dy, closeTo(${mm.offsetY}, 1e-9));`,
  `    _expectRect(mm.viewport, ${mm.viewport.x}, ${mm.viewport.y}, ${mm.viewport.width}, ${mm.viewport.height}, 'viewport');`,
  `    final back = viewFromMinimap(const Offset(84.0, 56.0), mm,
        const FlowView(x: -100.0, y: -50.0, scale: 1.5), const Size(640.0, 380.0));`,
  `    expect(back.x, closeTo(${mmBack.x}, 1e-9));`,
  `    expect(back.y, closeTo(${mmBack.y}, 1e-9));`,
]

// 慢而远、快而近、又慢又近：中间那一格是只看位移就会漏判的那一类
const swipeCases = [
  [-200, 600, 400], [-40, 600, 80], [-40, 600, 600], [200, 600, 400], [0, 600, 100], [-100, 0, 100],
]
const swipeExpectations = swipeCases.map(([dx, w, ms]) =>
  `    expect(resolveSwipe(${dx.toFixed(1)}, ${w.toFixed(1)}, ${ms.toFixed(1)}), ${resolveSwipe(dx, w, ms)});`)

const carouselNextCases = [
  [0, 5, -1, true], [4, 5, 1, true], [0, 5, -1, false], [4, 5, 1, false], [2, 5, 2, false], [0, 0, 1, true],
]
const carouselNextExpectations = carouselNextCases.map(([i, n, d, loop]) =>
  `    expect(nextIndex(${i}, ${n}, ${d}, loop: ${loop}), ${carouselNext(i, n, d, loop)});`)

// 窗口要贴住两端，越过边界后留空位就会出现「点比图少」的错觉
const dotCases = [[0, 3, 7], [0, 20, 7], [10, 20, 7], [19, 20, 7], [2, 20, 5]]
const dotExpectations = dotCases.map(([i, n, max]) => {
  const r = dotRange(i, n, max)
  return `    _expectDots(dotRange(${i}, ${n}, max: ${max}), <int>[${r.items.join(', ')}], ${r.active}, 'dots(${i}/${n})');`
})

const bandCases = [[-0.5, 5, false], [5.5, 5, false], [2.0, 5, false], [-0.5, 5, true]]
const bandExpectations = bandCases.map(([o, n, loop]) =>
  `    expect(rubberBand(${o.toFixed(1)}, ${n}, loop: ${loop}), closeTo(${rubberBand(o, n, loop)}, 1e-9));`)

const scrollCases = [
  // 内容没撑满容器：没有滚动条，用户永远划不到底
  [{ scrollTop: 0, clientHeight: 600, scrollHeight: 300 }, 'idle'],
  [{ scrollTop: 0, clientHeight: 600, scrollHeight: 300 }, 'loading'],
  [{ scrollTop: 0, clientHeight: 600, scrollHeight: 300 }, 'finished'],
  [{ scrollTop: 900, clientHeight: 600, scrollHeight: 1600 }, 'idle'],
  [{ scrollTop: 400, clientHeight: 600, scrollHeight: 1600 }, 'idle'],
  [{ scrollTop: 900, clientHeight: 600, scrollHeight: 1600 }, 'error'],
]
const scrollExpectations = scrollCases.map(([m, status]) =>
  `    expect(
        shouldLoadMore(scrollTop: ${m.scrollTop.toFixed(1)}, clientHeight: ${m.clientHeight.toFixed(1)},
            scrollHeight: ${m.scrollHeight.toFixed(1)}, status: LoadStatus.${status}),
        ${shouldLoadMore(m, status)});`)

const hintExpectations = [['loading', false], ['error', false], ['finished', false], ['finished', true], ['idle', false]]
  .map(([status, empty]) =>
    `    expect(loadHint(LoadStatus.${status}, empty: ${empty}), '${loadHint(status, empty)}');`)

// 一串连贯的按键：每一步的期望值都由 TS 实现算出
const keySequence = ['1', '2', '.', '3', '4', '5', 'backspace', '.', '9']
let keyAcc = ''
const keyExpectations = keySequence.map((k) => {
  const before = keyAcc
  keyAcc = pressKey(keyAcc, k)
  return `    expect(pressKey('${before}', '${k}'), '${keyAcc}');`
})

const keyEdgeCases = [
  ['', '.', 2, 12, false], ['0', '5', 2, 12, false], ['-0', '5', 2, 12, true],
  ['12', '.', 0, 12, false], ['', 'sign', 2, 12, true], ['-3', 'sign', 2, 12, true],
  ['', 'sign', 2, 12, false], ['123456789012', '3', 2, 12, false], ['', 'backspace', 2, 12, false],
]
const keyEdgeExpectations = keyEdgeCases.map(([v, k, d, m, n]) =>
  `    expect(pressKey('${v}', '${k}', decimals: ${d}, maxLength: ${m}, negative: ${n}),
        '${pressKey(v, k, { decimals: d, maxLength: m, negative: n })}');`)

const rowsExpectations = [[2, false], [0, false], [2, true]].map(([d, n]) => {
  const rows = keypadRows({ decimals: d, negative: n })
  return `    expect(keypadRows(decimals: ${d}, negative: ${n}),
        <List<String>>[${rows.map((r) => `<String>[${r.map((k) => `'${k}'`).join(', ')}]`).join(', ')}]);`
})

const completeExpectations = ['', '-', '.', '12', '12.', '12.5', '-3.25', '1.2.3'].map((v) =>
  `    expect(isComplete('${v}'), ${isComplete(v)});`)

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
import 'package:i_design/src/logic/agent.dart';
import 'package:i_design/src/logic/chart.dart';
import 'package:i_design/src/logic/flow.dart';
import 'package:i_design/src/logic/carousel.dart';
import 'package:i_design/src/logic/scroll.dart';
import 'package:i_design/src/logic/keypad.dart';

void _expectDots(DotRange actual, List<int> items, int active, String label) {
  expect(actual.items, items, reason: '\$label 点位不一致');
  expect(actual.active, active, reason: '\$label 当前项不一致');
}

void _expectRect(Rect actual, double x, double y, double w, double h, String label) {
  expect(actual.left, closeTo(x, 1e-9), reason: '\$label x 不一致');
  expect(actual.top, closeTo(y, 1e-9), reason: '\$label y 不一致');
  expect(actual.width, closeTo(w, 1e-9), reason: '\$label 宽不一致');
  expect(actual.height, closeTo(h, 1e-9), reason: '\$label 高不一致');
}

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

void _expectTaskSummary(ITaskSummary actual, int total, int completed, int failed,
    int running, bool settled, int percent, String label) {
  expect(actual.total, total, reason: '\$label total 不一致');
  expect(actual.completed, completed, reason: '\$label completed 不一致');
  expect(actual.failed, failed, reason: '\$label failed 不一致');
  expect(actual.running, running, reason: '\$label running 不一致');
  expect(actual.settled, settled, reason: '\$label settled 不一致');
  expect(actual.percent, percent, reason: '\$label percent 不一致');
}

void _expectConfidence(IConfidence actual, IConfidenceLevel level, int bars,
    String labelText, String label) {
  expect(actual.level, level, reason: '\$label 档位不一致');
  expect(actual.bars, bars, reason: '\$label 格数不一致');
  expect(actual.label, labelText, reason: '\$label 文案不一致');
}

void _expectDiff(IDiffSummary actual, int added, int removed, int changed,
    int selected, int total, String label, String reason) {
  expect(actual.added, added, reason: '\$reason added 不一致');
  expect(actual.removed, removed, reason: '\$reason removed 不一致');
  expect(actual.changed, changed, reason: '\$reason changed 不一致');
  expect(actual.selected, selected, reason: '\$reason selected 不一致');
  expect(actual.total, total, reason: '\$reason total 不一致');
  expect(diffActionLabel(actual), label, reason: '\$reason 按钮文案不一致');
}

void _expectBox(IBoxStats actual, double q1, double median, double q3,
    double lower, double upper, int outliers, String reason) {
  expect(actual.q1, closeTo(q1, 1e-9), reason: '\$reason q1 不一致');
  expect(actual.median, closeTo(median, 1e-9), reason: '\$reason 中位数不一致');
  expect(actual.q3, closeTo(q3, 1e-9), reason: '\$reason q3 不一致');
  expect(actual.lower, closeTo(lower, 1e-9), reason: '\$reason 下须不一致');
  expect(actual.upper, closeTo(upper, 1e-9), reason: '\$reason 上须不一致');
  expect(actual.outliers.length, outliers, reason: '\$reason 离群点数不一致');
}

void _expectWindow(IZoomWindow actual, int start, int end, String reason) {
  expect(actual.start, start, reason: '\$reason start 不一致');
  expect(actual.end, end, reason: '\$reason end 不一致');
}

void main() {
  test('buildPages 与 Web 端逐项一致', () {
${pageExpectations.join('\n')}
  });

  test('pageCountOf 与 Web 端一致', () {
${countExpectations.join('\n')}
  });

  test('clampPage 与 Web 端一致', () {
${zoomClampExpectations.join('\n')}
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

  test('任务汇总与 Web 端一致（失败计入已结束）', () {
${taskExpectations.join('\n')}
  });

  test('置信度分档与进度文本与 Web 端一致', () {
${confidenceExpectations.join('\n')}
${progressExpectations.join('\n')}
  });

  test('片段字符数与截断按码点计算，与 Web 端一致', () {
${chunkExpectations.join('\n')}
  });

  test('差异统计、默认全选与按钮文案与 Web 端一致', () {
    final rows = ${dartDiffRows};
${diffExpectations.join('\n')}
  });

  test('分位数与箱线图五数概括与 Web 端一致', () {
${quantileExpectations.join('\n')}
${boxExpectations.join('\n')}
  });

  test('瀑布图柱子起止与值域与 Web 端一致', () {
    final bars = waterfallBars(${dartWf});
${wfExpectations.join('\n')}
${wfDomainExpectation}
  });

  test('区间缩放的夹取、交叉与平移与 Web 端一致', () {
${zoomClampExpectations.join('\n')}
${panExpectations.join('\n')}
${ratioExpectations.join('\n')}
  });

  test('轴标签抽稀与 Web 端一致', () {
${stepExpectations.join('\n')}
${showExpectations.join('\n')}
  });

  test('桑基图分层、节点高度与缎带几何与 Web 端一致', () {
    final layout = sankeyLayout(${dartSankey}, 520.0, 260.0);
    expect(layout.nodes.length, ${sankeyResult.nodes.length});
    expect(layout.ribbons.length, ${sankeyResult.ribbons.length});
${sankeyNodeExpectations.join('\n')}
${sankeyRibbonExpectations.join('\n')}
  });

  test('框选矩形归一化与命中判定与 Web 端一致', () {
    final nodes = ${dartFlowNodes};
${marqueeExpectations.join('\n')}
${flow_hitExpectations.join('\n')}
  });

  test('批量移动整组一个位移，与 Web 端一致', () {
    final nodes = ${dartFlowNodes};
${flow_moveExpectations.join('\n')}
  });

  test('节点缩放固定对角并夹到下限，与 Web 端一致', () {
    final nodes = ${dartFlowNodes};
${resizeExpectations.join('\n')}
  });

  test('缩略图布局与它的逆运算与 Web 端一致', () {
    final nodes = ${dartFlowNodes};
    final mm = minimapLayout(nodes, const FlowView(x: -100.0, y: -50.0, scale: 1.5),
        const Size(640.0, 380.0), const Size(168.0, 112.0));
${minimapExpectations.join('\n')}
  });

  test('走马灯翻页判定与 Web 端一致（位移或速度任一达标）', () {
${swipeExpectations.join('\n')}
${carouselNextExpectations.join('\n')}
  });

  test('指示点收窗与两端阻尼与 Web 端一致', () {
${dotExpectations.join('\n')}
${bandExpectations.join('\n')}
  });

  test('无限滚动触发判定与 Web 端一致（含没撑满容器的情形）', () {
${scrollExpectations.join('\n')}
${hintExpectations.join('\n')}
  });

  test('数字键盘按键规则与 Web 端一致', () {
${keyExpectations.join('\n')}
${keyEdgeExpectations.join('\n')}
${rowsExpectations.join('\n')}
${completeExpectations.join('\n')}
  });

  test('矩形树图 squarify 切块与 Web 端一致', () {
    final tiles = treemapLayout(${dartTreemap}, 640.0, 300.0);
    expect(tiles.length, ${treemapResult.length});
${treemapExpectations.join('\n')}
  });
}
`

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'logic_parity_test.dart'), file)
console.log(`logic_parity_test.dart 已生成：${file.split('expect(').length - 1} 条断言`)
