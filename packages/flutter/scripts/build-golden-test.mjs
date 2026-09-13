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
const { buildCalendar, weekdayLabels, toISO: dateToISO } = await bundle(
  'packages/common/src/logic/date.ts',
  'date'
)
const { selectRange, isInRange, isRangeEdge, moveFocus, groupMarks } = await bundle(
  'packages/common/src/logic/calendar.ts',
  'calendar'
)
const { findMention, applyMention, filterMentions } = await bundle(
  'packages/common/src/logic/mention.ts',
  'mention'
)
const {
  resizePane, paneRatio, paneSize, keyboardStep, resetPaneSize, isSplitterResetKey
} = await bundle('packages/common/src/logic/splitter.ts', 'splitter')
const {
  virtualWindow, scrollToRow, shouldVirtualize
} = await bundle('packages/common/src/logic/virtual.ts', 'virtual')
const { hexToHsv, hsvToHex, parseColor, colorReadout } = await bundle(
  'packages/common/src/logic/color.ts',
  'color'
)
const { resolveAffix, shouldShowBackTop, backTopFrame } = await bundle(
  'packages/common/src/logic/affix.ts',
  'affix'
)
const {
  zoomImage, rotateImage, panImage, stepImage, imageAlt
} = await bundle('packages/common/src/logic/image.ts', 'image')
const {
  formatTime, parseTime, timeColumn, isUnitEnabled, clampTime, isValidRange
} = await bundle('packages/common/src/logic/time.ts', 'time')
const { orderRange, isRangeEmpty } = await bundle('packages/common/src/logic/range.ts', 'range')
const { qrMatrix, qrVersionFor } = await bundle('packages/common/src/logic/qrcode.ts', 'qrcode')
const { pullDistance, pullRelease, pullRotate } = await bundle(
  'packages/common/src/logic/pull.ts',
  'pull'
)
const { groupByIndex, activeIndexAt } = await bundle(
  'packages/common/src/logic/indexes.ts',
  'indexes'
)
const { otpFromText, otpValue, otpBackspace, otpNextIndex } = await bundle(
  'packages/common/src/logic/otp.ts',
  'otp'
)
const { timeSelectOptions, minutesOfClock, clockOfMinutes } = await bundle(
  'packages/common/src/logic/time.ts',
  'time-select'
)
const { scrollThumb, scrollTopOfThumb } = await bundle(
  'packages/common/src/logic/scroll.ts',
  'scroll-thumb'
)
const { formatCountdown, countdownParts, countdownRemaining, countdownInterval } = await bundle(
  'packages/common/src/logic/countdown.ts',
  'countdown'
)
const { toggleValue, collapseTags } = await bundle(
  'packages/common/src/logic/multiselect.ts',
  'multiselect'
)
const { confirmActions, validatePromptValue, isConfirmed } = await bundle(
  'packages/common/src/logic/confirm.ts',
  'confirm'
)
const { isTextOverflowing } = await bundle(
  'packages/common/src/logic/overflow.ts',
  'overflow'
)
const { safeHref } = await bundle('packages/common/src/logic/href.ts', 'href')
const { floatActionOffset, floatActionShift, floatActionDelay } = await bundle(
  'packages/common/src/logic/float.ts',
  'float'
)
const { shouldShowElapsed, elapsedParts, elapsedInterval } = await bundle(
  'packages/common/src/logic/elapsed.ts',
  'elapsed'
)
const { diffLines, diffStat } = await bundle('packages/common/src/logic/diff.ts', 'diff')
const { searchCommands, moveCommandIndex } = await bundle(
  'packages/common/src/logic/command.ts',
  'command'
)
const { toolChipStat, summarizeToolChips, toolChipIcon } = await bundle(
  'packages/common/src/logic/toolchip.ts',
  'toolchip'
)
const {
  defaultOpenSteps, summarizeThinking, thinkingStepIcon, toggleThinkingStep
} = await bundle('packages/common/src/logic/thinking.ts', 'thinking')
const {
  ganttDomain, ganttBars, ganttTicks, ganttTodayX, ganttLinks, ganttCycle, daysBetween
} = await bundle('packages/common/src/logic/gantt.ts', 'gantt')
const { wordFontSize, wordLayout, wordOverflow, wordTone } = await bundle(
  'packages/common/src/logic/wordcloud.ts',
  'wordcloud'
)
const { resolveLocale, zhCN: zhCNLocale, enUS: enUSLocale } = await bundle(
  'packages/common/src/logic/locale.ts',
  'locale'
)
const {
  splitSides, moveKeys, checkedAfterMove, headerState, toggleAll, filterItems: filterTransfer
} = await bundle('packages/common/src/logic/transfer.ts', 'transfer')
const {
  splitTags, addTags, backspace: tagBackspace, splitDraft, removeTag: tagRemove
} = await bundle('packages/common/src/logic/taginput.ts', 'taginput')
const { moveActive, moveActiveLoop, matchParts, filterSuggestions } = await bundle(
  'packages/common/src/logic/select.ts',
  'select'
)
const { clampNumber, roundTo, stepValue, ratioOf, valueFromRatio } = await bundle(
  'packages/common/src/logic/number.ts',
  'number'
)
const {
  resolveOverlay, moveMenuActive, firstMenuActive, shouldFlipUp,
  tourHole, tourNext, tourPrev, tourScrollTo, tourNeedsScroll
} = await bundle('packages/common/src/logic/overlay.ts', 'overlay')
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

/* ---------- 新手引导 ----------
 * 「到末步返回 -1」与「目标不在视口时滚到正中」这两条如果各端各写，
 * 会得到两种都说得通但不一样的行为：一个卡在末步，一个滚到刚好露出来。
 */
const holeCases = [[10, 20, 100, 40, 6], [0, 0, 8, 8, 0], [-5, -5, 50, 50, 12]]
const holeExpectations = holeCases.map(([x, y, w, h, pad]) => {
  const r = tourHole({ x, y, width: w, height: h }, { padding: pad })
  return `    _expectHole(tourHole(const Rect.fromLTWH(${x.toFixed(1)}, ${y.toFixed(1)}, ${w.toFixed(1)}, ${h.toFixed(1)}), padding: ${pad.toFixed(1)}),
        ${r.x.toFixed(1)}, ${r.y.toFixed(1)}, ${r.width.toFixed(1)}, ${r.height.toFixed(1)}, 'hole(${x},${y})');`
})

const tourStepCases = [[0, 3], [1, 3], [2, 3], [0, 1], [5, 3]]
const tourStepExpectations = tourStepCases.flatMap(([i, n]) => [
  `    expect(tourNext(${i}, ${n}), ${tourNext(i, n)});`,
  `    expect(tourPrev(${i}), ${tourPrev(i)});`,
])

const scrollToCases = [
  [{ y: 1000, height: 40 }, 800, 0],
  [{ y: -200, height: 40 }, 800, 500],
  [{ y: 10, height: 40 }, 800, 0],
]
const scrollToExpectations = scrollToCases.map(([r, vh, top]) =>
  `    expect(tourScrollTo(const Rect.fromLTWH(0.0, ${r.y.toFixed(1)}, 0.0, ${r.height.toFixed(1)}), ${vh.toFixed(1)}, ${top.toFixed(1)}),
        closeTo(${tourScrollTo(r, { height: vh }, top)}, 1e-9));`)

const needsScrollCases = [
  [{ y: 10, height: 40 }, 800],
  [{ y: 400, height: 40 }, 800],
  [{ y: 780, height: 40 }, 800],
  [{ y: -1, height: 40 }, 800],
]
const needsScrollExpectations = needsScrollCases.map(([r, vh]) =>
  `    expect(tourNeedsScroll(const Rect.fromLTWH(0.0, ${r.y.toFixed(1)}, 0.0, ${r.height.toFixed(1)}), ${vh.toFixed(1)}),
        ${tourNeedsScroll(r, { height: vh })});`)

/* ---------- 输入标签与自动完成 ----------
 * 粘贴同一段文本在两端上拆出不同数量的标签、命中高亮错半个字，
 * 都是不会报错但一眼能看出不对的分叉。
 */
const dartStrings = (arr) => `<String>[${arr.map((s) => `'${s.replace(/'/g, "\\'")}'`).join(', ')}]`

const splitCases = [
  'a,b,c', 'a，b；c', ' x1 , x2 \n x3 ', 'onlyone', '', ',,,', 'a\tb',
]
const splitExpectations = splitCases.map((text) =>
  `    expect(splitTags('${text.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'),
        ${dartStrings(splitTags(text))});`)

const draftCases = ['a,b,c', 'abc', 'a,', ',a']
const draftExpectations = draftCases.map((d) => {
  const r = splitDraft(d)
  return `    _expectDraft(splitDraft('${d}'), ${dartStrings(r.ready)}, '${r.rest}', 'draft(${d})');`
})

const addCases = [
  [['a'], ['b', 'c'], false, 0],
  [['a'], ['a'], false, 0],
  [['a'], ['a'], true, 0],
  [['a', 'b'], ['c'], false, 2],
  [['a'], ['  '], false, 0],
  [[], ['x', 'x', 'y'], false, 0],
]
const addExpectations = addCases.map(([cur, inc, dup, max]) => {
  const r = addTags(cur, inc, { allowDuplicate: dup, max })
  const reason = r.rejected ? `TagRejectReason.${r.rejected}` : 'null'
  return `    _expectAdd(addTags(${dartStrings(cur)}, ${dartStrings(inc)}, allowDuplicate: ${dup}, max: ${max}),
        ${dartStrings(r.tags)}, ${reason}, 'add(${inc.join('|')})');`
})

const backspaceCases = [[['a', 'b'], ''], [['a', 'b'], 'x'], [[], '']]
const backspaceExpectations = backspaceCases.flatMap(([tags, draft]) => {
  const r = tagBackspace(tags, draft)
  return [
    `    expect(backspace(${dartStrings(tags)}, '${draft}').consumed, ${r.consumed});`,
    `    expect(backspace(${dartStrings(tags)}, '${draft}').tags, ${dartStrings(r.tags)});`,
  ]
})

const removeExpectations = [[['a', 'b', 'c'], 1], [['a'], 0], [['a'], 5]].map(([tags, i]) =>
  `    expect(removeTag(${dartStrings(tags)}, ${i}), ${dartStrings(tagRemove(tags, i))});`)

const matchCases = [['北京', '北'], ['湖北', '北'], ['Beijing', 'ji'], ['abcabc', 'bc'], ['abc', ''], ['abc', 'z']]
const matchExpectations = matchCases.map(([label, kw]) => {
  const parts = matchParts(label, kw)
  const literal = parts.map((p) => `IMatchPart(text: '${p.text}', hit: ${p.hit})`).join(', ')
  return `    _expectParts(matchParts('${label}', '${kw}'), <IMatchPart>[${literal}], 'match(${label},${kw})');`
})

// 前缀命中必须整体排在中段命中之前，同档内保持数据源原顺序
const suggestOptions = ['北京', '北海', '湖北', '河北', '上海', '珠海']
const dartSuggestions = `<ISuggestion>[${suggestOptions.map((v) => `const ISuggestion(value: '${v}')`).join(', ')}]`
const suggestExpectations = [['北', 20], ['海', 20], ['北', 2], ['', 3], ['zz', 20]].map(([kw, limit]) => {
  const got = filterSuggestions(suggestOptions.map((v) => ({ value: v })), kw, limit)
  return `    expect(
        filterSuggestions(${dartSuggestions}, '${kw}', limit: ${limit}).map((s) => s.value).toList(),
        ${dartStrings(got.map((g) => g.value))});`
})

/* ---------- 时间选择与穿梭框 ----------
 * 「按位判定范围」与「搬走之后勾选怎么办」这两条，抄错都不会报错：
 * 前者表现为某个本来合法的小时点不动，后者表现为「已选 3 项」而屏幕上一个勾都没有。
 */
const dartTime = (t) => `const ITimeValue(hour: ${t.hour}, minute: ${t.minute}, second: ${t.second})`

const fmtCases = [
  [{ hour: 9, minute: 5, second: 0 }, true],
  [{ hour: 9, minute: 5, second: 0 }, false],
  [{ hour: 23, minute: 59, second: 59 }, true],
]
const fmtExpectations = fmtCases.map(([t, s]) =>
  `    expect(formatTime(${dartTime(t)}, showSecond: ${s}), '${formatTime(t, s)}');`)

const parseCases = ['09:00', '9:5', '09:00:30', '24:00', '09:60', 'abc', '']
const parseExpectations = parseCases.map((text) => {
  const got = parseTime(text)
  return got
    ? `    expect(parseTime('${text}'), ${dartTime(got)});`
    : `    expect(parseTime('${text}'), isNull);`
})

const tt_columnCases = [['hour', 1], ['hour', 6], ['minute', 15], ['minute', 1], ['second', 30], ['minute', 0]]
const tt_columnExpectations = tt_columnCases.map(([unit, step]) =>
  `    expect(timeColumn('${unit}', step: ${step}), <int>[${timeColumn(unit, step).join(', ')}]);`)

// 按位判定：09 点合法而 07 点不合法，且分钟只在边界那一小时上受限
const enabledCases = [
  ['hour', 7, { hour: 9, minute: 0, second: 0 }],
  ['hour', 9, { hour: 9, minute: 0, second: 0 }],
  ['hour', 21, { hour: 9, minute: 0, second: 0 }],
  ['minute', 10, { hour: 8, minute: 0, second: 0 }],
  ['minute', 10, { hour: 12, minute: 0, second: 0 }],
  ['minute', 10, { hour: 20, minute: 0, second: 0 }],
  ['second', 10, { hour: 8, minute: 30, second: 0 }],
]
const timeMin = { hour: 8, minute: 30, second: 15 }
const timeMax = { hour: 20, minute: 0, second: 0 }
const enabledExpectations = enabledCases.map(([unit, value, current]) =>
  `    expect(
        isUnitEnabled('${unit}', ${value}, ${dartTime(current)},
            min: ${dartTime(timeMin)}, max: ${dartTime(timeMax)}),
        ${isUnitEnabled(unit, value, current, { min: timeMin, max: timeMax })});`)

// 先夹范围再对齐步长：反过来会得到一个既不在范围里也不在步长上的值
const tt_clampCases = [
  [{ hour: 7, minute: 3, second: 0 }, 15],
  [{ hour: 22, minute: 40, second: 0 }, 15],
  [{ hour: 12, minute: 37, second: 0 }, 15],
  [{ hour: 12, minute: 37, second: 0 }, 1],
]
const tt_clampExpectations = tt_clampCases.map(([t, step]) => {
  const got = clampTime(t, { min: timeMin, max: timeMax, step: { minute: step }, showSecond: false })
  return `    expect(
        clampTime(${dartTime(t)}, min: ${dartTime(timeMin)}, max: ${dartTime(timeMax)},
            minuteStep: ${step}, showSecond: false),
        ${dartTime(got)});`
})

const rangeExpectations = [
  [{ hour: 9, minute: 0, second: 0 }, { hour: 18, minute: 0, second: 0 }],
  [{ hour: 9, minute: 0, second: 0 }, { hour: 9, minute: 0, second: 0 }],
  [{ hour: 18, minute: 0, second: 0 }, { hour: 9, minute: 0, second: 0 }],
].map(([a, z]) =>
  `    expect(isValidRange(${dartTime(a)}, ${dartTime(z)}), ${isValidRange(a, z)});`)

const transferItems = [
  { key: 'read', label: '查看' },
  { key: 'write', label: '编辑' },
  { key: 'owner', label: '所有者', disabled: true },
  { key: 'secret', label: '密钥管理' },
]
const dartTransfer = `<ITransferItem>[${transferItems
  .map((i) => `const ITransferItem(key: '${i.key}', label: '${i.label}'${i.disabled ? ', disabled: true' : ''})`)
  .join(', ')}]`
const dartKeys = (arr) => `<String>[${arr.map((k) => `'${k}'`).join(', ')}]`

const splitCase = splitSides(transferItems, ['secret', 'read'])
const tt_splitExpectations = [
  `    expect(splitSides(items, ${dartKeys(['secret', 'read'])}).source.map((i) => i.key).toList(),
        ${dartKeys(splitCase.source.map((i) => i.key))});`,
  // 用户搬过去的顺序是有意义的，不能按原数组重排
  `    expect(splitSides(items, ${dartKeys(['secret', 'read'])}).target.map((i) => i.key).toList(),
        ${dartKeys(splitCase.target.map((i) => i.key))});`,
]

const moveCasesT = [
  [['read'], ['write'], 'target'],
  [['read'], ['owner'], 'target'],
  [['read'], ['write', 'read'], 'target'],
  [['read', 'write'], ['read'], 'source'],
  [['read'], ['owner'], 'source'],
]
const moveExpectationsT = moveCasesT.map(([target, moving, to]) =>
  `    expect(moveKeys(items, ${dartKeys(target)}, ${dartKeys(moving)}, ITransferSide.${to}),
        ${dartKeys(moveKeys(transferItems, target, moving, to))});`)

const afterMoveExpectations = [
  [['a', 'b', 'c'], ['b']],
  [['a'], ['a']],
  [['a'], ['z']],
].map(([checked, moved]) =>
  `    expect(checkedAfterMove(${dartKeys(checked)}, ${dartKeys(moved)}),
        ${dartKeys(checkedAfterMove(checked, moved))});`)

// 全选只管可见的，且禁用项不计入
const tt_headerCases = [
  [transferItems, []],
  [transferItems, ['read', 'write', 'secret']],
  [transferItems, ['read']],
  [transferItems.filter((i) => i.key === 'secret'), ['secret']],
]
const tt_headerExpectations = tt_headerCases.flatMap(([visible, checked], i) => {
  const state = headerState(visible, checked)
  const literal = `<ITransferItem>[${visible
    .map((v) => `const ITransferItem(key: '${v.key}', label: '${v.label}'${v.disabled ? ', disabled: true' : ''})`)
    .join(', ')}]`
  return [
    `    expect(headerState(${literal}, ${dartKeys(checked)}).selectable, ${state.selectable});`,
    `    expect(headerState(${literal}, ${dartKeys(checked)}).allChecked, ${state.allChecked});`,
    `    expect(headerState(${literal}, ${dartKeys(checked)}).someChecked, ${state.someChecked});`,
  ]
})

const toggleAllExpectations = [[], ['read'], ['read', 'write', 'secret']].map((checked) =>
  `    expect(toggleAll(items, ${dartKeys(checked)}), ${dartKeys(toggleAll(transferItems, checked))});`)

const filterTransferExpectations = ['密钥', '', '查'].map((kw) =>
  `    expect(filterItems(items, '${kw}').map((i) => i.key).toList(),
        ${dartKeys(filterTransfer(transferItems, kw).map((i) => i.key))});`)

/* ---------- 固钉、回顶与图片变换 ----------
 * 这三处抄错的表现都很轻微：吸早了半屏、按钮闪一下就没、缩到 10 倍还能继续缩。
 * 没人会当成缺陷报上来，但两端用起来就是不一样。
 */
const affixCases = [
  // 还没滚到：不吸
  [{ offsetTop: 400, height: 40, scrollTop: 100, viewportHeight: 800 }, { top: 0 }],
  // 滚过了：吸在阈值处
  [{ offsetTop: 400, height: 40, scrollTop: 500, viewportHeight: 800 }, { top: 0 }],
  [{ offsetTop: 400, height: 40, scrollTop: 500, viewportHeight: 800 }, { top: 72 }],
  // 容器要走了：跟着往上顶，而不是继续钉在顶上
  [{ offsetTop: 400, height: 40, scrollTop: 900, viewportHeight: 800, containerBottom: 920 }, { top: 0 }],
  [{ offsetTop: 400, height: 40, scrollTop: 500, viewportHeight: 800, containerBottom: 2000 }, { top: 0 }],
  // 吸底
  [{ offsetTop: 400, height: 40, scrollTop: 0, viewportHeight: 800 }, { bottom: 16 }],
  [{ offsetTop: 1400, height: 40, scrollTop: 0, viewportHeight: 800 }, { bottom: 16 }],
]
const affixExpectations = affixCases.map(([m, opts]) => {
  const got = resolveAffix(m, opts)
  const named = opts.bottom !== undefined ? `bottom: ${opts.bottom.toFixed(1)}` : `top: ${opts.top.toFixed(1)}`
  const container = m.containerBottom !== undefined ? `, containerBottom: ${m.containerBottom.toFixed(1)}` : ''
  return `    expect(
        resolveAffix(offsetTop: ${m.offsetTop.toFixed(1)}, height: ${m.height.toFixed(1)},
            scrollTop: ${m.scrollTop.toFixed(1)}, viewportHeight: ${m.viewportHeight.toFixed(1)}${container}, ${named}),
        const IAffixState(mode: IAffixMode.${got.mode}, offset: ${got.offset}));`
})

const backTopCases = [[0, 800], [700, 800], [900, 800], [200, 800]]
const backTopExpectations = backTopCases.map(([y, vh]) =>
  `    expect(shouldShowBackTop(${y.toFixed(1)}, ${vh.toFixed(1)}), ${shouldShowBackTop(y, vh)});`)
  .concat(
    [[0, 800, 100], [150, 800, 100]].map(([y, vh, th]) =>
      `    expect(shouldShowBackTop(${y.toFixed(1)}, ${vh.toFixed(1)}, threshold: ${th.toFixed(1)}), ${shouldShowBackTop(y, vh, th)});`)
  )

const frameExpectations = [0, 80, 160, 320, 400].map((t) =>
  `    expect(backTopFrame(1000.0, ${t.toFixed(1)}), closeTo(${backTopFrame(1000, t)}, 1e-9));`)

const dartTransform = (t) =>
  `const IImageTransform(scale: ${t.scale}, rotate: ${t.rotate}, x: ${t.x}, y: ${t.y})`

// 缩回 1 倍时位移要一并归零，否则图缩小了却还偏在角落
let zoomAcc = { scale: 1, rotate: 0, x: 0, y: 0 }
const zoomSteps = [1, 1, 1, 1, -1, -1, -1, -0.5]
const zoomExpectations = zoomSteps.map((d) => {
  const before = zoomAcc
  zoomAcc = zoomImage({ ...zoomAcc, x: 30, y: 30 }, d)
  return `    expect(zoomImage(${dartTransform({ ...before, x: 30, y: 30 })}, ${d.toFixed(1)}), ${dartTransform(zoomAcc)});`
})

const rotateExpectations = [90, 90, 90, 90, -90, 450].map((d, i) => {
  const base = { scale: 1, rotate: i * 90, x: 0, y: 0 }
  return `    expect(rotateImage(${dartTransform(base)}, ${d.toFixed(1)}).rotate, ${rotateImage(base, d).rotate});`
})

// 原尺寸时不许拖：拖动会让图莫名其妙地跑出框
const ai_panExpectations = [
  [{ scale: 1, rotate: 0, x: 0, y: 0 }, 10, 10],
  [{ scale: 2, rotate: 0, x: 0, y: 0 }, 10, -20],
  [{ scale: 0.5, rotate: 0, x: 5, y: 5 }, 10, 10],
].map(([t, dx, dy]) =>
  `    expect(panImage(${dartTransform(t)}, ${dx.toFixed(1)}, ${dy.toFixed(1)}), ${dartTransform(panImage(t, dx, dy))});`)

const ai_stepExpectations = [[0, 3, 1], [2, 3, 1], [0, 3, -1], [1, 3, -1], [0, 0, 1]].map(([c, n, d]) =>
  `    expect(stepImage(${c}, ${n}, ${d}), ${stepImage(c, n, d)});`)

/*
 * 区间：起止对调只在两端都有值时发生。
 * 「只填了一头」与「正在输入」这两种中间态最容易被各端各自解释一遍。
 */
const pairRangeCases = [
  ['1', '9'], ['9', '1'], ['', '5'], ['5', ''], ['', ''],
  ['10', '9'], ['2026-01-05', '2026-01-03'], ['b', 'a'], ['a', 'a'],
]
const pairRangeExpectations = pairRangeCases.flatMap(([a, b]) => {
  const ordered = orderRange([a, b])
  return [
    `    expect(orderRange(['${a}', '${b}']), ['${ordered[0]}', '${ordered[1]}']);`,
    `    expect(isRangeEmpty(['${a}', '${b}']), ${isRangeEmpty([a, b])});`
  ]
})

/*
 * 二维码：整张矩阵逐行比对。
 *
 * 只比版本与掩码是不够的——纠错码字、交织顺序、掩码惩罚分里任何一处偏差，
 * 都会得到一张「看起来也是二维码」但扫出来是别的内容的图。
 * 因此把每一行压成 0/1 字符串整张比，错一格就当场失败。
 */
/*
 * 下拉刷新：阻尼曲线与阈值。
 * 「拉到多远算够」在两端上差几像素，用户就会觉得某一端「刷不动」。
 */
/*
 * 验证码：粘贴分配与退格。
 * 「123 456」这种带空格的粘贴、以及「当前格已空再退格」这两条最容易各端各写一版。
 */
/*
 * 固定间隔的时间点：步长不能整除 60 时最容易出错——
 * 嵌套循环写法会漏掉跨小时的点（09:45 之后应当是 10:30，而不是回到 10:00）。
 */
const timeSelectCases = [
  { start: '09:00', end: '11:00', step: 30 },
  { start: '09:00', end: '12:00', step: 45 },
  { start: '09:00', end: '10:00', step: 90 },
  { start: '09:00', end: '11:00', step: 30, minTime: '09:30' },
  { start: '09:00', end: '11:00', step: 30, maxTime: '10:00' },
  { start: '11:00', end: '09:00', step: 30 },
]
const timeSelectExpectations = timeSelectCases.flatMap((c) => {
  const options = timeSelectOptions(c)
  const args =
    `start: '${c.start}', end: '${c.end}', step: ${c.step}` +
    (c.minTime ? `, minTime: '${c.minTime}'` : '') +
    (c.maxTime ? `, maxTime: '${c.maxTime}'` : '')
  const values = `[${options.map((o) => `'${o.value}'`).join(', ')}]`
  const flags = `[${options.map((o) => o.disabled).join(', ')}]`
  return [
    `    expect(timeSelectOptions(${args}).map((o) => o.value).toList(), ${values});`,
    `    expect(timeSelectOptions(${args}).map((o) => o.disabled).toList(), ${flags});`
  ]
})
const clockExpectations = [['09:05', 545], ['23:59', 1439], ['24:00', null], ['9:5', null]].map(
  ([text]) => {
    const value = minutesOfClock(text)
    return value === null
      ? `    expect(minutesOfClock('${text}'), isNull);`
      : `    expect(minutesOfClock('${text}'), ${value});`
  }
)
const clockBackExpectations = [0, 545, 1439, 1440].map(
  (m) => `    expect(clockOfMinutes(${m}), '${clockOfMinutes(m)}');`
)

/*
 * 自绘滚动条：滑块长度与位置的分母不同（位置要扣掉滑块自身长度）。
 * 用同一个分母的话，滚到底时滑块会露出轨道外一截——这一条各端最容易写歪。
 */
const thumbCases = [
  [0, 300, 900, 300], [600, 300, 900, 300], [300, 300, 900, 300],
  [0, 300, 300, 300], [0, 100, 10000, 200],
]
const thumbExpectations = thumbCases.flatMap(([top, client, total, track]) => {
  const t = scrollThumb({ scrollTop: top, clientHeight: client, scrollHeight: total }, track)
  const metrics = `(scrollTop: ${top}.0, clientHeight: ${client}.0, scrollHeight: ${total}.0)`
  return [
    `    expect(scrollThumb(${metrics}, ${track}.0).size, ${t.size}.0);`,
    `    expect(scrollThumb(${metrics}, ${track}.0).offset, ${t.offset}.0);`,
    `    expect(scrollThumb(${metrics}, ${track}.0).visible, ${t.visible});`,
    `    expect(scrollTopOfThumb(${t.offset}.0, ${t.size}.0, ${track}.0, ${metrics}), ` +
      `${scrollTopOfThumb(t.offset, t.size, track, { scrollTop: top, clientHeight: client, scrollHeight: total })}.0);`
  ]
})

/*
 * 倒计时：取整方向与「模板里没写的那一位并进更小单位」这两条最容易各端写歪。
 * 一端在最后一秒显示 00:01、另一端显示 00:00，用户会截图来问哪个是对的。
 */
const countdownCases = [
  [3661000, 'HH:mm:ss'], [0, 'HH:mm:ss'], [1400, 'ss'], [1400, 'ss.SSS'],
  [5430000, 'mm:ss'], [176400000, 'DD 天 HH:mm:ss'], [176400000, 'HH:mm:ss'],
  [3661000, 'H:m:s'], [999, 'ss'], [1000, 'ss'], [1001, 'ss'],
]
const countdownExpectations = countdownCases.map(([ms, fmt]) =>
  `    expect(formatCountdown(${ms}, '${fmt}'), '${formatCountdown(ms, fmt)}');`)

const countdownPartCases = [[1400, false], [1400, true], [0, false], [86399999, false], [86400000, true]]
  .map(([ms, showMs]) => [ms, showMs])
const countdownPartExpectations = countdownPartCases.flatMap(([ms, showMs]) => {
  const p = countdownParts(ms, showMs)
  const call = `countdownParts(${ms}, ${showMs})`
  return [
    `    expect(${call}.days, ${p.days});`,
    `    expect(${call}.hours, ${p.hours});`,
    `    expect(${call}.minutes, ${p.minutes});`,
    `    expect(${call}.seconds, ${p.seconds});`,
    `    expect(${call}.milliseconds, ${p.milliseconds});`
  ]
})

const countdownMiscExpectations = [
  `    expect(countdownRemaining(500, 100), ${countdownRemaining(500, 100)});`,
  `    expect(countdownRemaining(100, 500), ${countdownRemaining(100, 500)});`,
  `    expect(countdownInterval(1400), ${countdownInterval(1400)});`,
  `    expect(countdownInterval(2000), ${countdownInterval(2000)});`,
  `    expect(countdownInterval(1400, true), ${countdownInterval(1400, true)});`
]

/*
 * 甘特图：时间域扩到整周、工期含首尾、逾期只看结束日，这三条最容易移植错。
 * 「今天」写死，否则这份测试每天的期望值都不一样。
 */
const gToday = '2026-03-25'
const gTasks = [
  { id: 'a', name: '调研', start: '2026-03-04', end: '2026-03-12', progress: 1 },
  { id: 'b', name: '定稿', start: '2026-03-11', end: '2026-03-20', progress: 0.6, deps: ['a'] },
  { id: 'c', name: '开发', start: '2026-03-18', end: '2026-04-08', progress: 0.25, deps: ['b'] },
  { id: 'm', name: '发布', start: '2026-04-17', end: '2026-04-17', milestone: true, deps: ['c'] },
]
const dartGTasks = `<IGanttTask>[${gTasks
  .map((t) => `const IGanttTask(id: '${t.id}', name: '${t.name}', start: '${t.start}', end: '${t.end}'` +
    (t.progress !== undefined ? `, progress: ${t.progress}` : '') +
    (t.deps ? `, deps: <String>[${t.deps.map((d) => `'${d}'`).join(', ')}]` : '') +
    (t.milestone ? ', milestone: true' : '') + ')')
  .join(', ')}]`
const gDomain = ganttDomain(gTasks)
const gBars = ganttBars(gTasks, gDomain, { dayWidth: 18, rowHeight: 34, barHeight: 18, today: gToday })
const gTicks = ganttTicks(gDomain, 18, gToday)
const gLinks = ganttLinks(gBars)
const ganttExpectations = [
  `    expect(domain.from, '${gDomain.from}');`,
  `    expect(domain.to, '${gDomain.to}');`,
  `    expect(domain.days, ${gDomain.days});`,
  ...gBars.flatMap((b, i) => [
    `    expect(bars[${i}].x, closeTo(${b.x}, 1e-9));`,
    `    expect(bars[${i}].width, closeTo(${b.width}, 1e-9));`,
    `    expect(bars[${i}].y, closeTo(${b.y}, 1e-9));`,
    `    expect(bars[${i}].progressWidth, closeTo(${b.progressWidth}, 1e-9));`,
    `    expect(bars[${i}].overdue, ${b.overdue});`
  ]),
  `    expect(ticks.map((t) => t.label).toList(),
        <String>[${gTicks.map((t) => `'${t.label}'`).join(', ')}]);`,
  `    expect(ticks.map((t) => t.current).toList(),
        <bool>[${gTicks.map((t) => t.current).join(', ')}]);`,
  `    expect(ganttTodayX(domain, dayWidth: 18.0, today: '${gToday}'),
        closeTo(${ganttTodayX(gDomain, 18, gToday)}, 1e-9));`,
  // 时间域之外返回 -1，调用方据此不画这条线
  `    expect(ganttTodayX(domain, dayWidth: 18.0, today: '2027-01-01'), closeTo(-1, 1e-9));`,
  `    expect(links.map((l) => l.id).toList(),
        <String>[${gLinks.map((l) => `'${l.id}'`).join(', ')}]);`,
  ...gLinks.map((l, i) =>
    `    expect(links[${i}].points, <double>[${l.points.map((v) => v.toFixed(1)).join(', ')}]);`),
  // 含首尾：3/4 到 3/12 是 9 天，不是 8 天
  `    expect(daysBetween('2026-03-04', '2026-03-12') + 1, ${daysBetween('2026-03-04', '2026-03-12') + 1});`,
]
const cycleTasks = [
  { id: 'x', name: 'x', start: '2026-01-01', end: '2026-01-02', deps: ['y'] },
  { id: 'y', name: 'y', start: '2026-01-01', end: '2026-01-02', deps: ['x'] },
]
const cycleExpectation = `    expect(ganttCycle(<IGanttTask>[
      const IGanttTask(id: 'x', name: 'x', start: '2026-01-01', end: '2026-01-02', deps: <String>['y']),
      const IGanttTask(id: 'y', name: 'y', start: '2026-01-01', end: '2026-01-02', deps: <String>['x']),
    ]), <String>[${ganttCycle(cycleTasks).map((id) => `'${id}'`).join(', ')}]);
    expect(ganttCycle(${dartGTasks}), isEmpty);`

/*
 * 词云：字号按面积开平方、最大的词落在正中、放不下的丢掉而不是叠字。
 * 宽高在这里按「字数 × 基准字号」构造，两端拿到同一份输入才比得了坐标。
 */
const wRaw = [['设计令牌', 96], ['多端一致', 84], ['无障碍', 71], ['主题定制', 65],
  ['暗色模式', 58], ['组件库', 54], ['覆盖矩阵', 47], ['小程序', 43], ['图表', 39], ['动效', 28]]
const wWords = wRaw.map(([text, value]) => ({ text, value, width: text.length * 48, height: 54 }))
const dartWWords = `<IWordMeasured>[${wWords
  .map((w) => `const IWordMeasured(text: '${w.text}', value: ${w.value}.0, width: ${w.width}.0, height: ${w.height}.0)`)
  .join(', ')}]`
const wPlaced = wordLayout(wWords, 640, 320)
const dartTone = (t) => `IWordTone.${t}`
const wordExpectations = [
  `    expect(placed.length, ${wPlaced.length});`,
  ...wPlaced.flatMap((w, i) => [
    `    expect(placed[${i}].text, '${w.text}');`,
    `    expect(placed[${i}].x, closeTo(${w.x}, 1e-9));`,
    `    expect(placed[${i}].y, closeTo(${w.y}, 1e-9));`,
    `    expect(placed[${i}].fontSize, closeTo(${w.fontSize}, 1e-9));`,
    `    expect(placed[${i}].rotated, ${w.rotated});`
  ]),
  `    expect(wordOverflow(<IWordItem>[${wWords.map((w) => `const IWordItem(text: '${w.text}', value: ${w.value}.0)`).join(', ')}], placed), ${wordOverflow(wWords, wPlaced)});`
]
// 全部同值时统一给中间字号——线性映射在这种情况下要除以 0
const sizeExpectations = [[96, 12, 96], [12, 12, 96], [54, 12, 96], [5, 5, 5]].map(([v, lo, hi]) =>
  `    expect(wordFontSize(${v}.0, ${lo}.0, ${hi}.0), closeTo(${wordFontSize(v, lo, hi)}, 1e-9));`)
const toneExpectations = [[0, 10], [1, 10], [2, 10], [5, 10], [6, 10], [9, 10], [0, 0]].map(([r, t]) =>
  `    expect(wordTone(${r}, ${t}), ${dartTone(wordTone(r, t))});`)

/*
 * 外链白名单：放行与拒绝的清单两端必须逐条一致。
 * 少拒一种，那一端就多一个可点的恶意链接；多拒一种，合法链接在那一端点不开。
 */
const TAB = String.fromCharCode(9)
const hrefCases = [
  'https://a.com/x', 'http://a.com', '/docs/a', '#top', './a', '../a', 'a/b',
  'mailto:a@b.c', 'tel:123', 'javascript:alert(1)', 'JavaScript:alert(1)',
  'java' + TAB + 'script:alert(1)', 'data:text/html,x', '//evil.com',
  'vbscript:m', String.raw`\\evil.com`, '  javascript:alert(1)  ', ''
]
const hrefExpectations = hrefCases.map((value) => {
  const out = safeHref(value)
  const literal = JSON.stringify(value).replace(/'/g, String.raw`\'`)
  const arg = `'${literal.slice(1, -1).replace(/\\"/g, '"')}'`
  return `    expect(safeHref(${arg}), ${out === undefined ? 'null' : arg});`
})

/*
 * 悬浮按钮展开后的几何：各端自己写间距的话，同一个组件会错开几像素——
 * 这种偏差没人会当成 bug 报，只会觉得「有点糙」。
 */
const floatExpectations = [
  ...[0, 1, 2, 3].map((i) => `    expect(floatActionOffset(${i}), ${floatActionOffset(i)});`),
  ...[0, 1, 2, 3].map((i) => `    expect(floatActionShift(${i}), ${floatActionShift(i)});`),
  ...[[0, 1], [0, 3], [1, 3], [2, 3], [3, 4]].map(
    ([i, n]) => `    expect(floatActionDelay(${i}, ${n}), ${floatActionDelay(i, n)});`
  )
]

/*
 * 文案字典：两份字典的每一句都要对得上，否则换个端同一个界面会说两种话；
 * 以及「局部覆盖，缺的沿用原值」——抄漏一个键不该在界面上开天窗。
 */
const localeKeys = [
  'name', 'empty', 'emptyContent', 'loading', 'loadMore', 'loadFailed', 'noMore',
  'placeholder', 'datePlaceholder', 'selectAll', 'search', 'searchNode', 'noMatch', 'clear',
  'confirm', 'cancel', 'acknowledge', 'close', 'retry', 'copy', 'copied',
  'expand', 'collapse', 'required', 'invalidFormat',
  // 图表数据表、AI 交互与逐题确认：这几处以前是各端各写一遍的硬编码中文
  'chartTableShow', 'chartTableHide', 'chartCategory', 'chartValue', 'chartPercent',
  'chartOther', 'regenerate', 'thinking', 'toolInput', 'toolError', 'toolResult',
  'next', 'skip', 'otherOption',
  // 移动端专有：下拉刷新、新建与倒计时单位
  'pullToRefresh', 'releaseToRefresh', 'refreshing', 'create',
  'dayUnit', 'hourUnit', 'minuteUnit', 'secondUnit'
]
const dartString = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`
const localeExpectations = [
  ...localeKeys.map((key) => `    expect(zhCN.${key}, ${dartString(zhCNLocale[key])});`),
  ...localeKeys.map((key) => `    expect(enUS.${key}, ${dartString(enUSLocale[key])});`),
  `    expect(zhCN.totalText(12), ${dartString(zhCNLocale.totalText(12))});`,
  `    expect(enUS.totalText(1), ${dartString(enUSLocale.totalText(1))});`,
  `    expect(enUS.totalText(3), ${dartString(enUSLocale.totalText(3))});`,
  `    expect(zhCN.rangeText(11, 20, 95), ${dartString(zhCNLocale.rangeText(11, 20, 95))});`,
  `    expect(enUS.rangeText(11, 20, 95), ${dartString(enUSLocale.rangeText(11, 20, 95))});`,
  ...['empty', 'search', 'error', 'permission'].flatMap((reason) => [
    `    expect(zhCN.emptyPresets[IEmptyReason.${reason}]!.title, ${dartString(zhCNLocale.emptyPresets[reason].title)});`,
    `    expect(enUS.emptyPresets[IEmptyReason.${reason}]!.title, ${dartString(enUSLocale.emptyPresets[reason].title)});`
  ]),
  // 局部覆盖：改掉的是改掉的，没提的沿用原值
  `    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').empty, '这个筛选条件下没有工单');`,
  `    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').confirm, ${dartString(resolveLocale({ empty: 'x' }).confirm)});`,
  `    expect(enUS.copyWith(confirm: 'Go').confirm, 'Go');`,
  `    expect(enUS.copyWith(confirm: 'Go').cancel, ${dartString(resolveLocale({ confirm: 'Go' }, enUSLocale).cancel)});`,
  // 改 empty 会顺带改掉空态那一句标题——它们说的是同一件事
  `    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').emptyPresets[IEmptyReason.empty]!.title, ` +
    `${dartString(resolveLocale({ empty: '这个筛选条件下没有工单' }).emptyPresets.empty.title)});`,
  `    expect(zhCN.copyWith(empty: '这个筛选条件下没有工单').emptyPresets[IEmptyReason.search]!.title, ` +
    `${dartString(resolveLocale({ empty: '这个筛选条件下没有工单' }).emptyPresets.search.title)});`
]

/*
 * 文本截断：单行看宽度、多行看高度，以及那 1px 的亚像素容差。
 * 方向写反的话提示一次都不会出现，而且不报错——只是「这个功能好像没做」。
 */
const overflowCases = [
  [{ scrollWidth: 200, clientWidth: 100, scrollHeight: 20, clientHeight: 20 }, false],
  [{ scrollWidth: 200, clientWidth: 100, scrollHeight: 20, clientHeight: 20 }, true],
  [{ scrollWidth: 100, clientWidth: 100, scrollHeight: 60, clientHeight: 40 }, true],
  [{ scrollWidth: 100, clientWidth: 100, scrollHeight: 60, clientHeight: 40 }, false],
  [{ scrollWidth: 100.5, clientWidth: 100, scrollHeight: 20, clientHeight: 20 }, false],
  [{ scrollWidth: 101.5, clientWidth: 100, scrollHeight: 20, clientHeight: 20 }, false],
  [{ scrollWidth: 100, clientWidth: 100, scrollHeight: 40.5, clientHeight: 40 }, true],
]
const overflowExpectations = overflowCases.map(([m, multiline]) => {
  const metrics = `const OverflowMetrics(scrollWidth: ${m.scrollWidth.toFixed(1)}, ` +
    `clientWidth: ${m.clientWidth.toFixed(1)}, scrollHeight: ${m.scrollHeight.toFixed(1)}, ` +
    `clientHeight: ${m.clientHeight.toFixed(1)})`
  return `    expect(isTextOverflowing(${metrics}, ${multiline}), ${isTextOverflowing(m, multiline)});`
})

/*
 * 确认框：按钮顺序（取消在左、确认在右）、alert 只有一个按钮、
 * 以及「关掉不算同意」这三条。写歪了没人会在构建时发现，
 * 但一次误触就执行了删除。
 */
const kindNames = { confirm: 'IConfirmKind.confirm', alert: 'IConfirmKind.alert', prompt: 'IConfirmKind.prompt' }
const actionCases = [
  ['confirm', {}], ['alert', {}], ['prompt', {}],
  ['confirm', { danger: true }],
  ['confirm', { confirmText: '删除', cancelText: '再想想', danger: true }],
  ['alert', { confirmText: '知道了' }],
]
const actionExpectations = actionCases.flatMap(([kind, opts]) => {
  const args = [
    kindNames[kind],
    opts.confirmText ? `confirmText: '${opts.confirmText}'` : null,
    opts.cancelText ? `cancelText: '${opts.cancelText}'` : null,
    opts.danger ? 'danger: true' : null
  ].filter(Boolean).join(', ')
  const out = confirmActions(kind, opts)
  return [
    `    expect(confirmActions(${args}).length, ${out.length});`,
    ...out.flatMap((a, i) => [
      `    expect(confirmActions(${args})[${i}].role, IConfirmRole.${a.role});`,
      `    expect(confirmActions(${args})[${i}].text, '${a.text}');`,
      `    expect(confirmActions(${args})[${i}].primary, ${a.primary});`,
      `    expect(confirmActions(${args})[${i}].danger, ${a.danger});`
    ])
  ]
})

const confirmedCases = [
  ['confirm', 'confirm'], ['confirm', 'cancel'], ['confirm', 'close'],
  ['alert', 'confirm'], ['alert', 'close'],
  ['prompt', 'confirm'], ['prompt', 'close'],
]
const confirmedExpectations = confirmedCases.map(([kind, role]) =>
  `    expect(isConfirmed(${kindNames[kind]}, IConfirmRole.${role}), ${isConfirmed(kind, role)});`)

const promptCases = [
  ['', { required: true }], ['  ', { required: true }], ['x', { required: true }],
  ['', {}], ['abc', { pattern: /^\d+$/ }], ['123', { pattern: /^\d+$/ }],
  ['', { required: true, requiredMessage: '请填写名称' }],
]
const promptExpectations = promptCases.map(([value, rules]) => {
  const args = [
    `'${value}'`,
    rules.required ? 'required: true' : null,
    rules.pattern ? `pattern: RegExp(r'${rules.pattern.source}')` : null,
    rules.requiredMessage ? `requiredMessage: '${rules.requiredMessage}'` : null
  ].filter(Boolean).join(', ')
  const out = validatePromptValue(value, rules)
  return `    expect(validatePromptValue(${args}), ${out === null ? 'null' : `'${out}'`});`
})

/*
 * 多选：追加在末尾（按点击先后）与「折叠时至少留一个」这两条，
 * 各端一旦写歪，同一份选择在两端读出来就不一样。
 */
const toggleCases = [
  [['a', 'b'], 'c'], [['a', 'b'], 'a'], [['a', 'b'], 'b'], [[], 'a'], [['a'], 'a'],
]
const toggleExpectations = toggleCases.map(([vals, v]) => {
  const src = `[${vals.map((x) => `'${x}'`).join(', ')}]`
  const out = toggleValue(vals, v)
  return `    expect(toggleValue<String>(${src}, '${v}'), [${out.map((x) => `'${x}'`).join(', ')}]);`
})

const collapseCases = [
  [['a', 'b', 'c', 'd'], 0], [['a', 'b', 'c', 'd'], 2], [['a', 'b'], 2],
  [['a', 'b', 'c'], 1], [['a', 'b', 'c'], 9], [[], 2],
]
const collapseExpectations = collapseCases.flatMap(([items, max]) => {
  const src = `[${items.map((x) => `'${x}'`).join(', ')}]`
  const r = collapseTags(items, max)
  return [
    `    expect(collapseTags<String>(${src}, ${max}).shown, [${r.shown.map((x) => `'${x}'`).join(', ')}]);`,
    `    expect(collapseTags<String>(${src}, ${max}).rest, ${r.rest});`
  ]
})

const otpPasteCases = ['123456', '123 456', '12-34-56', '12ab34', '1234567890', '']
const otpPasteExpectations = otpPasteCases.flatMap((text) => {
  const cells = otpFromText(text, 6)
  const dart = `[${cells.map((c) => `'${c}'`).join(', ')}]`
  return [
    `    expect(otpFromText('${text}', 6), ${dart});`,
    `    expect(otpValue(${dart}), '${otpValue(cells)}');`
  ]
})
const otpBackspaceCases = [
  [['1', '2', '3', '', '', ''], 2],
  [['1', '2', '3', '', '', ''], 3],
  [['1', '', '', '', '', ''], 0],
  [['1', '2', '3', '4', '5', '6'], 5],
]
const otpBackspaceExpectations = otpBackspaceCases.flatMap(([cells, index]) => {
  const result = otpBackspace(cells, index)
  const before = `[${cells.map((c) => `'${c}'`).join(', ')}]`
  const after = `[${result.cells.map((c) => `'${c}'`).join(', ')}]`
  return [
    `    expect(otpBackspace(${before}, ${index}).cells, ${after});`,
    `    expect(otpBackspace(${before}, ${index}).index, ${result.index});`
  ]
})
const otpNextExpectations = [[0, 6], [4, 6], [5, 6], [5, 1]].map(
  ([i, len]) => `    expect(otpNextIndex(${i}, ${len}), ${otpNextIndex(i, len)});`
)

const pullCases = [0, 10, 30, 56, 80, 120, 200, 480, 1000]
const pullExpectations = pullCases.flatMap((raw) => {
  const distance = pullDistance(raw)
  return [
    `    expect(pullDistance(${raw}), ${distance});`,
    `    expect(pullRelease(${distance}), ${pullRelease(distance)});`,
    `    expect(pullRotate(${distance}), ${pullRotate(distance)});`
  ]
})

/*
 * 索引列表：分组顺序与「#」的位置。
 * 数字该归到哪一组、# 排前还是排后，两端各判一次就会得到不同长度的索引条。
 */
const indexItems = ['Anna', 'bob', '3M', 'Zoe', 'apple', '', '中文', 'Bill']
const indexGroups = groupByIndex(indexItems, (item) => item)
const indexExpectations = [
  `    final groups = groupByIndex<String>(${JSON.stringify(indexItems)}, (item) => item);`,
  `    expect(groups.map((g) => g.index).toList(), ${JSON.stringify(indexGroups.map((g) => g.index))});`,
  `    expect(groups.map((g) => g.items.length).toList(), ${JSON.stringify(indexGroups.map((g) => g.items.length))});`
]
const offsets = [
  { index: 'A', top: 0 },
  { index: 'B', top: 120 },
  { index: '#', top: 260 }
]
const dartOffsets = `[${offsets
  .map((o) => `(index: '${o.index}', top: ${o.top.toFixed(1)})`)
  .join(', ')}]`
const activeExpectations = [0, 119, 120, 259, 400].map(
  (top) =>
    `    expect(activeIndexAt(${dartOffsets}, ${top.toFixed(1)}), '${activeIndexAt(offsets, top)}');`
)

const qrCases = [
  ['i-design', 'L'],
  ['https://ignorance-shiyao.github.io/', 'M'],
  ['设计体系 · 多端一致', 'Q'],
  ['x', 'H'],
]
const qrExpectations = qrCases.flatMap(([text, level]) => {
  const m = qrMatrix(text, level)
  const rows = m.modules.map((row) => row.map((v) => (v ? '1' : '0')).join('')).join('|')
  const dartLevel = `QrEcLevel.${level.toLowerCase()}`
  return [
    `    _expectQr('${text}', ${dartLevel}, ${m.version}, ${m.mask}, '${rows}');`
  ]
})
const qrCapacityExpectations = [[10, 'M'], [200, 'L'], [400, 'H'], [1, 'H']].map(([len, level]) =>
  `    expect(qrVersionFor(${len}, QrEcLevel.${level.toLowerCase()}), ${qrVersionFor(len, level)});`)

const altExpectations = [
  ['loading', '示例图'], ['error', '示例图'], ['loaded', '示例图'],
  ['error', ''], ['loading', ''],
].map(([status, alt]) =>
  `    expect(imageAlt(IImageStatus.${status}, '${alt}'), '${imageAlt(status, alt)}');`)

/* ---------- 分栏、虚拟滚动与取色 ----------
 * 三处都是「两种答案都说得通」的地方：拖到底会怎样、上下多渲染几行、
 * rgb() 用不用换算。各端各写一遍必然分叉，而且都不报错。
 */
const paneCases = [
  [1000, 500], [1000, 0], [1000, 2000], [1000, 100], [1000, 900],
  [300, 200], [100, 50],
]
const paneExpectations = paneCases.map(([total, next]) =>
  `    expect(
        resizePane(${total.toFixed(1)}, ${next.toFixed(1)},
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(${resizePane(total, next, { min: 120 }, { min: 160 }, 4)}, 1e-9));`)

const ratioExpectationsSp = [[500, 1000], [0, 1000], [1200, 1000]].map(([size, total]) =>
  `    expect(paneRatio(${size.toFixed(1)}, ${total.toFixed(1)}, gutter: 4.0),
        closeTo(${paneRatio(size, total, 4)}, 1e-9));`)
  .concat([[0.5, 1000], [1.5, 1000], [-0.2, 1000]].map(([ratio, total]) =>
    `    expect(paneSize(${ratio.toFixed(2)}, ${total.toFixed(1)}, gutter: 4.0),
        closeTo(${paneSize(ratio, total, 4)}, 1e-9));`))

/*
 * 复位：目标比例照样要过夹取。容器窄到五五开都违反下限时，
 * 双击一下不能把用户送进一个拖都拖不出来的状态。
 */
const resetExpectations = [[0.5, 1000], [0.5, 300], [0.2, 1000], [0.9, 1000]].map(
  ([ratio, total]) =>
    `    expect(
        resetPaneSize(${ratio.toFixed(2)}, ${total.toFixed(1)},
            firstMin: 120.0, secondMin: 160.0, gutter: 4.0),
        closeTo(${resetPaneSize(ratio, total, { min: 120 }, { min: 160 }, 4)}, 1e-9));`
).concat(
  ['Enter', ' ', 'Spacebar', 'ArrowLeft', 'a'].map(
    (key) => `    expect(isSplitterResetKey('${key}'), ${isSplitterResetKey(key)});`
  )
)

/*
 * 等待时长：从第几秒开始显示、怎么进位、下一跳等多久——三处各端都容易各写一遍，
 * 结果是同一次等待在两端显示出不同的秒数。
 */
const elapsedExpectations = [
  ...[0, 2999, 3000, 61000, 3599999].map(
    (ms) => `    expect(shouldShowElapsed(${ms}), ${shouldShowElapsed(ms)});`
  ),
  ...[0, 5400, 59999, 60000, 125000, -100].flatMap((ms) => {
    const p = elapsedParts(ms)
    return [
      `    expect(elapsedParts(${ms}).minutes, ${p.minutes});`,
      `    expect(elapsedParts(${ms}).seconds, ${p.seconds});`
    ]
  }),
  ...[0, 1, 500, 999, 1000, 5400].map(
    (ms) => `    expect(elapsedInterval(${ms}), ${elapsedInterval(ms)});`
  )
]

/*
 * 行 diff：同一个补丁在两端必须比出同一份结果。
 * 开头插一行时若退化成逐行对齐，后面每一行都会被标成改动——两端各错各的。
 */
const diffCases = [
  ['b\nc', 'a\nb\nc'],
  ['x\nold\ny', 'x\nnew\ny'],
  ['a\nb', 'a\nb'],
  ['a\nb\nc', 'c\nb\na'],
  ['', 'a']
]
const lineDiffExpectations = diffCases.flatMap(([before, after], i) => {
  const lines = diffLines(before, after)
  const stat = diffStat(lines)
  const dart = (t) => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
  return [
    `    // 第 ${i + 1} 组`,
    `    expect(diffLines(${dart(before)}, ${dart(after)}).length, ${lines.length});`,
    `    expect(diffStat(diffLines(${dart(before)}, ${dart(after)})).added, ${stat.added});`,
    `    expect(diffStat(diffLines(${dart(before)}, ${dart(after)})).removed, ${stat.removed});`,
    ...lines.map(
      (line, n) =>
        `    expect(diffLines(${dart(before)}, ${dart(after)})[${n}].kind, IDiffKind.${line.kind});`
    )
  ]
})

/*
 * 命令搜索：排序错一次，用户下次就不用搜索了。
 * 因此断言的不只是「搜到了几条」，还有第一条是谁——那才是搜索的产出。
 */
const cmdItems = [
  { key: 'button', label: '按钮', description: '触发一个动作', keywords: ['button'], group: '基础' },
  { key: 'button-group', label: '按钮组', description: '一组并排的按钮', keywords: ['button group'] },
  { key: 'tag', label: '标签', description: '用按钮旁的小块标记状态', keywords: ['tag'] },
  { key: 'form-validate', label: '表单 校验', keywords: ['validate'] },
  { key: 'empty', label: '空状态', keywords: ['empty', 'placeholder'] }
]
const dartStr = (t) => `'${String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const dartCmdItems = `<ICommandItem>[${cmdItems
  .map(
    (i) =>
      `ICommandItem(key: ${dartStr(i.key)}, label: ${dartStr(i.label)}` +
      (i.description ? `, description: ${dartStr(i.description)}` : '') +
      `, keywords: <String>[${(i.keywords ?? []).map(dartStr).join(', ')}]` +
      (i.group ? `, group: ${dartStr(i.group)}` : '') +
      ')'
  )
  .join(', ')}]`
const cmdQueries = ['按钮', 'button', '校验', 'placeholder', '', '不存在的词', '标签']
const commandExpectations = cmdQueries.flatMap((q) => {
  const hits = searchCommands(cmdItems, q)
  return [
    `    // 搜 ${q || '（空）'}`,
    `    expect(searchCommands(items, ${dartStr(q)}).length, ${hits.length});`,
    ...hits.map(
      (h, i) => `    expect(searchCommands(items, ${dartStr(q)})[${i}].item.key, ${dartStr(h.item.key)});`
    ),
    ...(hits[0]?.ranges.length
      ? [
          `    expect(searchCommands(items, ${dartStr(q)})[0].ranges.first[0], ${hits[0].ranges[0][0]});`,
          `    expect(searchCommands(items, ${dartStr(q)})[0].ranges.first[1], ${hits[0].ranges[0][1]});`
        ]
      : [])
  ]
})
const commandLimitCount = searchCommands(cmdItems, '', 2).length
const commandMoveExpectations = [
  [0, 1, 3], [2, 1, 3], [0, -1, 3], [1, -1, 3], [0, 1, 0], [5, 1, 0]
].map(([cur, delta, total]) =>
  `    expect(moveCommandIndex(${cur}, ${delta}, ${total}), ${moveCommandIndex(cur, delta, total)});`)

/*
 * 工具芯片的统计写法：同一次调用在两端写出来的字必须逐字相同，
 * 一端写「+13 −4」另一端写「13 增 4 删」的话，读者会以为是两件事。
 */
const statCases = [[13, 4], [13, 0], [0, 4], [0, 0], [1, 1], [999, 1000]]
const chipStatExpectations = statCases.map(
  ([a, r]) => `    expect(toolChipStat(${a}, ${r}), ${JSON.stringify(toolChipStat(a, r))});`
)
const chipItems = [
  { key: 'a', label: 'App.tsx', status: 'success', added: 74, removed: 41 },
  { key: 'b', label: 'flavors.css', status: 'error' },
  { key: 'c', label: 'grep', status: 'running', added: 2 },
  { key: 'd', label: 'main.ts', status: 'success', added: 0, removed: 9 }
]
const dartChipItems = `<IToolChipItem>[${chipItems
  .map(
    (i) =>
      `IToolChipItem(key: '${i.key}', label: '${i.label}', ` +
      `status: IToolChipStatus.${i.status}, added: ${i.added ?? 0}, removed: ${i.removed ?? 0})`
  )
  .join(', ')}]`
const chipSummary = summarizeToolChips(chipItems)
const chipSummaryExpectations = [
  `    expect(summarizeToolChips(chips).total, ${chipSummary.total});`,
  `    expect(summarizeToolChips(chips).running, ${chipSummary.running});`,
  `    expect(summarizeToolChips(chips).failed, ${chipSummary.failed});`,
  `    expect(summarizeToolChips(chips).added, ${chipSummary.added});`,
  `    expect(summarizeToolChips(chips).removed, ${chipSummary.removed});`,
  `    expect(summarizeToolChips(<IToolChipItem>[]).total, ${summarizeToolChips([]).total});`,
  `    expect(summarizeToolChips(<IToolChipItem>[]).added, ${summarizeToolChips([]).added});`,
  ...['success', 'error'].map(
    (s) => `    expect(toolChipIcon(IToolChipStatus.${s}), ${JSON.stringify(toolChipIcon(s))});`
  )
]

/*
 * 推理轨迹：默认展开哪几步必须两端一致。
 * 一端展开出错那步、另一端全折叠的话，用户得学两遍。
 */
const thinkSteps = [
  { key: 'a', title: '拆解问题', kind: 'reason', status: 'done' },
  { key: 'b', title: '检索文档', kind: 'search', status: 'error' },
  { key: 'c', title: '写补丁', kind: 'code', status: 'running' },
  { key: 'd', title: '复核', kind: 'tool', status: 'done' }
]
const dartThinkSteps = `<IThinkingStep>[${thinkSteps
  .map(
    (s) =>
      `IThinkingStep(key: '${s.key}', title: '${s.title}', ` +
      `kind: IThinkingStepKind.${s.kind}, status: IThinkingStepStatus.${s.status})`
  )
  .join(', ')}]`
const dartStepKeys = (keys) => `<String>[${keys.map((k) => `'${k}'`).join(', ')}]`
const thinkingExpectations = [
  `    expect(defaultOpenSteps(steps), ${dartStepKeys(defaultOpenSteps(thinkSteps))});`,
  `    expect(defaultOpenSteps(<IThinkingStep>[]), <String>[]);`,
  `    expect(summarizeThinking(steps).total, ${summarizeThinking(thinkSteps).total});`,
  `    expect(summarizeThinking(steps).done, ${summarizeThinking(thinkSteps).done});`,
  `    expect(summarizeThinking(steps).running, ${summarizeThinking(thinkSteps).running});`,
  `    expect(summarizeThinking(steps).failed, ${summarizeThinking(thinkSteps).failed});`,
  `    expect(summarizeThinking(steps).activeIndex, ${summarizeThinking(thinkSteps).activeIndex});`,
  `    expect(summarizeThinking(<IThinkingStep>[]).activeIndex, ${summarizeThinking([]).activeIndex});`,
  ...['reason', 'search', 'code', 'tool'].map(
    (k) => `    expect(thinkingStepIcon(IThinkingStepKind.${k}), ${JSON.stringify(thinkingStepIcon(k))});`
  ),
  `    expect(toggleThinkingStep(${dartStepKeys(['b'])}, 'c'), ${dartStepKeys(toggleThinkingStep(['b'], 'c'))});`,
  `    expect(toggleThinkingStep(${dartStepKeys(['b', 'c'])}, 'b'), ${dartStepKeys(toggleThinkingStep(['b', 'c'], 'b'))});`
]

/*
 * 贴着触发器的面板往哪边开：实测过视口 520 时下拉掉出 65px、日期面板掉出 212px，
 * 两端必须给出同一个答案，否则同一个表单在一端能选、在另一端点空。
 */
const flipCases = [
  [400, 32, 160, 720], [400, 32, 160, 520], [100, 32, 600, 300],
  [400, 32, 280, 720], [0, 32, 100, 200], [650, 32, 60, 720]
]
const flipExpectations = flipCases.map(
  ([y, h, ph, vh]) =>
    `    expect(shouldFlipUp(${y}, ${h}, ${ph}, ${vh}), ${shouldFlipUp({ y, height: h }, ph, vh)});`
)

const b2_keyExpectations = [
  ['ArrowLeft', false], ['ArrowLeft', true], ['ArrowRight', false],
  ['ArrowRight', true], ['ArrowUp', false], ['ArrowDown', true], ['Enter', false],
].map(([key, shift]) =>
  `    expect(keyboardStep('${key}', ${shift}), ${keyboardStep(key, shift)});`)

const winCases = [
  [0, 320, 40, 20000], [400000, 320, 40, 20000], [799680, 320, 40, 20000],
  [0, 320, 40, 5], [0, 320, 40, 0], [100, 320, 40, 20000],
]
const winExpectations = winCases.flatMap(([top, vh, ih, n]) => {
  const w = virtualWindow(top, vh, ih, n)
  return [
    `    expect(virtualWindow(${top.toFixed(1)}, ${vh.toFixed(1)}, ${ih.toFixed(1)}, ${n}).start, ${w.start});`,
    `    expect(virtualWindow(${top.toFixed(1)}, ${vh.toFixed(1)}, ${ih.toFixed(1)}, ${n}).end, ${w.end});`,
    `    expect(virtualWindow(${top.toFixed(1)}, ${vh.toFixed(1)}, ${ih.toFixed(1)}, ${n}).paddingTop,
        closeTo(${w.paddingTop}, 1e-9));`,
    `    expect(virtualWindow(${top.toFixed(1)}, ${vh.toFixed(1)}, ${ih.toFixed(1)}, ${n}).paddingBottom,
        closeTo(${w.paddingBottom}, 1e-9));`,
  ]
})

// 已经完整可见就不动：每次都滚到顶部的话，用户会觉得列表在自己乱跳
const scrollRowExpectations = [
  [0, 40, 0, 320], [3, 40, 0, 320], [20, 40, 0, 320], [2, 40, 200, 320],
].map(([i, ih, top, vh]) =>
  `    expect(scrollToRow(${i}, ${ih.toFixed(1)}, ${top.toFixed(1)}, ${vh.toFixed(1)}),
        closeTo(${scrollToRow(i, ih, top, vh)}, 1e-9));`)

const virtualizeExpectations = [10, 60, 61, 20000].map((n) =>
  `    expect(shouldVirtualize(${n}), ${shouldVirtualize(n)});`)

// 通道是 0–1 归一化的：第一版按 0–255 写，rgb(30,60,90) 解析出来是纯白
const parseCasesC = ['rgb(30, 60, 90)', '#0a0', '#1E3C5A', 'aabbcc', 'rgb(300,0,0)', '不是颜色', '']
const parseExpectationsC = parseCasesC.map((t) => {
  const got = parseColor(t)
  return got
    ? `    expect(parseColor('${t}'), '${got}');`
    : `    expect(parseColor('${t}'), isNull);`
})

const roundTripExpectations = ['#5e7ce0', '#c2413d', '#ffffff', '#000000', '#00aa00', '#1e3c5a'].map(
  (hex) => `    expect(hsvToHex(hexToHsv('${hex}')), '${hsvToHex(hexToHsv(hex))}');`
)

const readoutExpectations = ['#5e7ce0', '#ffe066', '#1d2129', '#ffffff'].flatMap((hex) => {
  const r = colorReadout(hex)
  return [
    `    expect(colorReadout('${hex}').ink, '${r.ink}');`,
    `    expect(colorReadout('${hex}').ratio, closeTo(${r.ratio}, 0.02));`,
    `    expect(colorReadout('${hex}').passesUi, ${r.passesUi});`,
    `    expect(colorReadout('${hex}').passesText, ${r.passesText});`,
  ]
})

/* ---------- 日历与提及 ----------
 * 「点第二下是结束日期还是重新开始选」「邮箱里的 @ 该不该弹」
 * 都是两种答案都说得通的地方，各端各写一遍必然分叉，而且都不报错。
 */
const dartRange = (r) =>
  `const IDateRange(start: ${r.start === null ? 'null' : `'${r.start}'`}, ` +
  `end: ${r.end === null || r.end === undefined ? 'null' : `'${r.end}'`})`

// 固定一个日期，避免测试在跨月那天变红
const calAnchor = new Date(2026, 8, 15)
const calCells = buildCalendar(calAnchor, 1)
const calExpectations = [
  `    final cells = buildCalendar(DateTime(2026, 9, 15), weekStart: 1);`,
  `    expect(cells.length, 42);`,
  `    expect(cells.first.iso, '${calCells[0].iso}');`,
  `    expect(cells.last.iso, '${calCells[41].iso}');`,
  `    expect(cells.where((c) => !c.outside).length, ${calCells.filter((c) => !c.outside).length});`,
  `    expect(weekdayLabels(weekStart: 1), <String>[${weekdayLabels(1).map((l) => `'${l}'`).join(', ')}]);`,
  `    expect(weekdayLabels(weekStart: 0), <String>[${weekdayLabels(0).map((l) => `'${l}'`).join(', ')}]);`
]

// 选完一段再点是「重新开始选」；从右往左点自动对调
const rangeSteps = [
  [{ start: null, end: null }, '2026-09-10'],
  [{ start: '2026-09-10', end: null }, '2026-09-15'],
  [{ start: '2026-09-10', end: null }, '2026-09-05'],
  [{ start: '2026-09-10', end: '2026-09-15' }, '2026-09-20'],
  [{ start: '2026-09-10', end: null }, '2026-09-10'],
]
const rangeExpectationsCal = rangeSteps.map(([range, iso]) =>
  `    expect(selectRange(${dartRange(range)}, '${iso}'), ${dartRange(selectRange(range, iso))});`)

const inRangeExpectations = [
  ['2026-09-12', { start: '2026-09-10', end: '2026-09-15' }],
  ['2026-09-10', { start: '2026-09-10', end: '2026-09-15' }],
  ['2026-09-16', { start: '2026-09-10', end: '2026-09-15' }],
  ['2026-09-12', { start: '2026-09-10', end: null }],
].map(([iso, range]) =>
  `    expect(isInRange('${iso}', ${dartRange(range)}), ${isInRange(iso, range)});`)
  .concat(
    [
      ['2026-09-10', { start: '2026-09-10', end: '2026-09-15' }],
      ['2026-09-15', { start: '2026-09-10', end: '2026-09-15' }],
      ['2026-09-12', { start: '2026-09-10', end: '2026-09-15' }],
    ].map(([iso, range]) => {
      const got = isRangeEdge(iso, range)
      return `    expect(isRangeEdge('${iso}', ${dartRange(range)}), ${got === null ? 'isNull' : `'${got}'`});`
    })
  )

const focusExpectations = [
  ['2026-09-15', 'ArrowLeft'], ['2026-09-15', 'ArrowRight'],
  ['2026-09-15', 'ArrowUp'], ['2026-09-15', 'ArrowDown'],
  ['2026-09-01', 'ArrowLeft'], ['2026-09-30', 'ArrowDown'],
  ['2026-09-15', 'Enter'],
].map(([iso, key]) => {
  const got = moveFocus(iso, key)
  return `    expect(moveFocus('${iso}', '${key}'), ${got === null ? 'isNull' : `'${got}'`});`
})

// 三条判定：邮箱不弹、空格后收起、超长不认
const mentionCases = [
  ['@', 1], ['@zh', 3], ['把这条同步给 @陈', 10],
  ['user@exam', 9], ['@张三 然后', 6], ['', 0],
  ['a@b', 3], ['\n@x', 3],
]
const mentionExpectations = mentionCases.map(([text, caret]) => {
  const got = findMention(text, caret)
  const literal = JSON.stringify(text).replace(/\$/g, '\\$')
  return got
    ? `    expect(findMention(${literal}, ${caret}),
        const IMentionTrigger(at: ${got.at}, symbol: '${got.symbol}', query: ${JSON.stringify(got.query)}));`
    : `    expect(findMention(${literal}, ${caret}), isNull);`
})

// 末尾补空格：不补的话光标紧贴名字，接着打字会立刻又触发一次候选
const applyCases = [
  ['@陈', 2, '陈序'],
  ['把这条同步给 @陈', 10, '陈序'],
  ['@a 尾巴', 2, '林岚'],
]
const applyExpectations = applyCases.flatMap(([text, caret, label]) => {
  const trigger = findMention(text, caret)
  if (!trigger) return []
  const got = applyMention(text, trigger, label, caret)
  const literal = JSON.stringify(text).replace(/\$/g, '\\$')
  return [
    `    expect(applyMention(${literal},
        const IMentionTrigger(at: ${trigger.at}, symbol: '${trigger.symbol}', query: ${JSON.stringify(trigger.query)}),
        '${label}', ${caret}).text, ${JSON.stringify(got.text).replace(/\$/g, '\\$')});`,
    `    expect(applyMention(${literal},
        const IMentionTrigger(at: ${trigger.at}, symbol: '${trigger.symbol}', query: ${JSON.stringify(trigger.query)}),
        '${label}', ${caret}).caret, ${got.caret});`
  ]
})

const mentionOptions = [
  { value: 'lin', label: '林岚', keywords: ['linlan'] },
  { value: 'chen', label: '陈序', keywords: ['chenxu'] },
  { value: 'su', label: '苏禾', keywords: ['suhe'] },
]
const dartOptions = `<IMentionOption>[${mentionOptions
  .map((o) => `const IMentionOption(value: '${o.value}', label: '${o.label}', keywords: <String>['${o.keywords[0]}'])`)
  .join(', ')}]`
const filterExpectations = ['', '陈', 'lin', 'xu', '不存在'].map((q) =>
  `    expect(filterMentions(options, '${q}').map((o) => o.value).toList(),
        <String>[${filterMentions(mentionOptions, q).map((o) => `'${o.value}'`).join(', ')}]);`)

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
import 'package:i_design/src/logic/taginput.dart';
import 'package:i_design/src/logic/time.dart';
import 'package:i_design/src/logic/transfer.dart';
import 'package:i_design/src/logic/affix.dart';
import 'package:i_design/src/logic/image.dart';
import 'package:i_design/src/logic/splitter.dart';
import 'package:i_design/src/logic/virtual.dart';
import 'package:i_design/src/logic/color.dart';
import 'package:i_design/src/logic/calendar.dart';
import 'package:i_design/src/logic/mention.dart';
import 'package:i_design/src/logic/range.dart';
import 'package:i_design/src/logic/qrcode.dart';
import 'package:i_design/src/logic/pull.dart';
import 'package:i_design/src/logic/indexes.dart';
import 'package:i_design/src/logic/otp.dart';
import 'package:i_design/src/logic/time_select.dart';
import 'package:i_design/src/logic/scrollbar.dart';
import 'package:i_design/src/logic/countdown.dart';
import 'package:i_design/src/logic/multiselect.dart';
import 'package:i_design/src/logic/confirm.dart';
import 'package:i_design/src/logic/overflow.dart';
import 'package:i_design/src/logic/diff.dart';
import 'package:i_design/src/logic/elapsed.dart';
import 'package:i_design/src/logic/float.dart';
import 'package:i_design/src/logic/href.dart';
import 'package:i_design/src/logic/gantt.dart';
import 'package:i_design/src/logic/wordcloud.dart';
import 'package:i_design/src/logic/locale.dart';

void _expectQr(String text, QrEcLevel level, int version, int mask, String rows) {
  final m = qrMatrix(text, level);
  expect(m, isNotNull, reason: '\$text 应当能编码');
  expect(m!.version, version, reason: '\$text 版本不一致');
  expect(m.mask, mask, reason: '\$text 掩码不一致');
  final actual = m.modules.map((row) => row.map((v) => v ? '1' : '0').join()).join('|');
  expect(actual, rows, reason: '\$text 矩阵与 Web 端不一致');
}

void _expectDots(DotRange actual, List<int> items, int active, String label) {
  expect(actual.items, items, reason: '\$label 点位不一致');
  expect(actual.active, active, reason: '\$label 当前项不一致');
}

void _expectDraft(TagDraftSplit actual, List<String> ready, String rest, String label) {
  expect(actual.ready, ready, reason: '\$label 成词部分不一致');
  expect(actual.rest, rest, reason: '\$label 留存部分不一致');
}

void _expectAdd(TagAddResult actual, List<String> tags, TagRejectReason? rejected, String label) {
  expect(actual.tags, tags, reason: '\$label 结果不一致');
  expect(actual.rejected, rejected, reason: '\$label 拒绝原因不一致');
}

void _expectParts(List<IMatchPart> actual, List<IMatchPart> expected, String label) {
  expect(actual.length, expected.length, reason: '\$label 段数不一致');
  for (var i = 0; i < expected.length; i++) {
    expect(actual[i].text, expected[i].text, reason: '\$label 第 \$i 段文字不一致');
    expect(actual[i].hit, expected[i].hit, reason: '\$label 第 \$i 段命中标记不一致');
  }
}

void _expectHole(ITourHole actual, double x, double y, double w, double h, String label) {
  expect(actual.x, closeTo(x, 1e-9), reason: '\$label x 不一致');
  expect(actual.y, closeTo(y, 1e-9), reason: '\$label y 不一致');
  expect(actual.width, closeTo(w, 1e-9), reason: '\$label 宽不一致');
  expect(actual.height, closeTo(h, 1e-9), reason: '\$label 高不一致');
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
${ai_panExpectations.join('\n')}
${ratioExpectations.join('\n')}
  });

  test('轴标签抽稀与 Web 端一致', () {
${ai_stepExpectations.join('\n')}
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
${b2_keyExpectations.join('\n')}
${keyEdgeExpectations.join('\n')}
${rowsExpectations.join('\n')}
${completeExpectations.join('\n')}
  });

  test('新手引导的高亮框、步进与滚动判定与 Web 端一致', () {
${holeExpectations.join('\n')}
${tourStepExpectations.join('\n')}
${scrollToExpectations.join('\n')}
${needsScrollExpectations.join('\n')}
  });

  test('输入标签的拆分、去重与退格与 Web 端一致', () {
${splitExpectations.join('\n')}
${draftExpectations.join('\n')}
${addExpectations.join('\n')}
${backspaceExpectations.join('\n')}
${removeExpectations.join('\n')}
  });

  test('自动完成的命中切段与候选排序与 Web 端一致', () {
${matchExpectations.join('\n')}
${suggestExpectations.join('\n')}
  });

  test('时间的格式化、解析、列与范围判定与 Web 端一致', () {
${fmtExpectations.join('\n')}
${parseExpectations.join('\n')}
${tt_columnExpectations.join('\n')}
${enabledExpectations.join('\n')}
${tt_clampExpectations.join('\n')}
${rangeExpectations.join('\n')}
  });

  test('固定间隔的时间点与 Web 端一致', () {
${timeSelectExpectations.join('\n')}
${clockExpectations.join('\n')}
${clockBackExpectations.join('\n')}
  });

  test('甘特图的时间域、条形与依赖折线与 Web 端一致', () {
    final domain = ganttDomain(${dartGTasks});
    final bars = ganttBars(${dartGTasks}, domain,
        dayWidth: 18.0, rowHeight: 34.0, barHeight: 18.0, today: '${gToday}');
    final ticks = ganttTicks(domain, dayWidth: 18.0, today: '${gToday}');
    final links = ganttLinks(bars);
${ganttExpectations.join('\n')}
${cycleExpectation}
  });

  test('词云的字号映射、螺线落点与档位与 Web 端一致', () {
    final placed = wordLayout(${dartWWords}, 640.0, 320.0);
${wordExpectations.join('\n')}
${sizeExpectations.join('\n')}
${toneExpectations.join('\n')}
  });

  test('外链白名单的放行与拒绝清单与 Web 端一致', () {
${hrefExpectations.join('\n')}
  });

  test('行 diff 的分组、顺序与统计与 Web 端一致', () {
${lineDiffExpectations.join('\n')}
  });

  test('命令搜索的排序、高亮区间与索引环绕与 Web 端一致', () {
    final items = ${dartCmdItems};
${commandExpectations.join('\n')}
    expect(searchCommands(items, '', limit: 2).length, ${commandLimitCount});
${commandMoveExpectations.join('\n')}
  });

  test('工具芯片的统计写法与折叠汇总与 Web 端一致', () {
    final chips = ${dartChipItems};
${chipStatExpectations.join('\n')}
${chipSummaryExpectations.join('\n')}
  });

  test('推理轨迹的默认展开、进度与图标与 Web 端一致', () {
    final steps = ${dartThinkSteps};
${thinkingExpectations.join('\n')}
  });

  test('贴着触发器的面板往哪边开与 Web 端一致', () {
${flipExpectations.join('\n')}
  });

  test('等待时长的显示阈值、进位与刷新间隔与 Web 端一致', () {
${elapsedExpectations.join('\n')}
  });

  test('悬浮操作按钮的展开位移与延迟与 Web 端一致', () {
${floatExpectations.join('\n')}
  });

  test('文案字典的两份译文与局部覆盖规则与 Web 端一致', () {
${localeExpectations.join('\n')}
  });

  test('文本截断的判定方向与亚像素容差与 Web 端一致', () {
${overflowExpectations.join('\n')}
  });

  test('确认框的按钮编排、关闭语义与输入校验与 Web 端一致', () {
${actionExpectations.join('\n')}
${confirmedExpectations.join('\n')}
${promptExpectations.join('\n')}
  });

  test('多选的追加顺序与标签折叠与 Web 端一致', () {
${toggleExpectations.join('\n')}
${collapseExpectations.join('\n')}
  });

  test('倒计时的取整、并位与刷新间隔与 Web 端一致', () {
${countdownExpectations.join('\n')}
${countdownPartExpectations.join('\n')}
${countdownMiscExpectations.join('\n')}
  });

  test('自绘滚动条的滑块长度与位置与 Web 端一致', () {
${thumbExpectations.join('\n')}
  });

  test('验证码的粘贴分配与退格与 Web 端一致', () {
${otpPasteExpectations.join('\n')}
${otpBackspaceExpectations.join('\n')}
${otpNextExpectations.join('\n')}
  });

  test('下拉刷新的阻尼与阈值与 Web 端一致', () {
${pullExpectations.join('\n')}
  });

  test('索引列表的分组与定位与 Web 端一致', () {
${indexExpectations.join('\n')}
${activeExpectations.join('\n')}
  });

  test('二维码矩阵与 Web 端逐格一致', () {
${qrExpectations.join('\n')}
${qrCapacityExpectations.join('\n')}
  });

  test('区间的起止对调与空判定与 Web 端一致', () {
${pairRangeExpectations.join('\n')}
  });

  test('穿梭框的搬运、勾选与全选与 Web 端一致', () {
    final items = ${dartTransfer};
${tt_splitExpectations.join('\n')}
${moveExpectationsT.join('\n')}
${afterMoveExpectations.join('\n')}
${tt_headerExpectations.join('\n')}
${toggleAllExpectations.join('\n')}
${filterTransferExpectations.join('\n')}
  });

  test('固钉与回到顶部的判定与 Web 端一致', () {
${affixExpectations.join('\n')}
${backTopExpectations.join('\n')}
${frameExpectations.join('\n')}
  });

  test('图片的缩放、旋转、拖动与翻页与 Web 端一致', () {
${zoomExpectations.join('\n')}
${rotateExpectations.join('\n')}
${ai_panExpectations.join('\n')}
${ai_stepExpectations.join('\n')}
${altExpectations.join('\n')}
  });

  test('分栏夹取与键盘步长与 Web 端一致', () {
${paneExpectations.join('\n')}
${resetExpectations.join('\n')}
${ratioExpectationsSp.join('\n')}
${b2_keyExpectations.join('\n')}
  });

  test('虚拟滚动的窗口与定位与 Web 端一致', () {
${winExpectations.join('\n')}
${scrollRowExpectations.join('\n')}
${virtualizeExpectations.join('\n')}
  });

  test('取色器的解析、往返与对比度读数与 Web 端一致', () {
${parseExpectationsC.join('\n')}
${roundTripExpectations.join('\n')}
${readoutExpectations.join('\n')}
  });

  test('日历格子、范围选择与键盘导航与 Web 端一致', () {
${calExpectations.join('\n')}
${rangeExpectationsCal.join('\n')}
${inRangeExpectations.join('\n')}
${focusExpectations.join('\n')}
  });

  test('提及的触发、插入与过滤与 Web 端一致', () {
    final options = ${dartOptions};
${mentionExpectations.join('\n')}
${applyExpectations.join('\n')}
${filterExpectations.join('\n')}
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
