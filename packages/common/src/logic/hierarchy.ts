/**
 * 层级汇总契约（astra.md 的 D05）：旭日图与 Icicle 图共用的那一层。
 *
 * 这两张图看着差得远——一个是同心圆环，一个是横向色块——但它们要回答的
 * 是同一个问题：「这一整块量，是怎么一层层分下去的」。真正难的从来不是
 * 画圆还是画方，而是下面这三件；它们全都不会报错，只会让读者读到错的数：
 *
 * **一、父级的量与子级之和对不上时，不能自己挑一个。**
 * 现实数据里这是常态：一级分类记了 100，明细只报上来 80。
 * 取父级的数，那 20 就凭空消失在图上；取子级之和，那张图的合计就不再是
 * 业务方认的那个数。两种都是在替读者做决定，而读者看不出你做过。
 * 这里的做法是把差额显式补成一个「未细分」子节点——它有自己的扇区、
 * 自己的名字、能被选中，谁都能看见那 20 在哪儿。
 * 反过来子级之和**超过**父级，那不是缺口而是矛盾（口径重叠或重复上报），
 * 补不出来，只能判为无效并说清楚是哪个节点。
 *
 * **二、分母要说得出是谁。**
 * 一个扇区占 12%，是占全体的 12% 还是占它父级的 12%？两者差着一整层的语义。
 * 所以每个节点同时给 `share`（占根合计）与 `shareOfParent`（占直接父级），
 * 文字读法里两个都念出来，而不是留一个含糊的「占比」。
 *
 * **三、排除掉的样本要留着，不能从图上消失。**
 * 缺失值、负值、非有限数不进分母——这点和帕累托一致——但它们必须以清单
 * 形式跟着模型走：图上少了一块，读者有权知道少的是什么、为什么少。
 *
 * 还有一条是给渲染层定的：这里算到 `start` / `end` 两个 0–1 的位置就停。
 * 旭日把它乘 2π 变成角度，Icicle 把它乘宽度变成横坐标，除此之外两端拿到的
 * 东西完全一样。把「排到哪儿」留在共享层，两张图才不会在同一份数据上
 * 排出不同的顺序——那种不一致没有任何检查拦得住。
 */

export interface HierarchyInput {
  id: string
  /** 根节点写 null。指向不存在的 id 视为无效，不静默丢弃 */
  parentId: string | null
  label: string
  /**
   * 该节点自报的量。
   * 叶子必须有值；有子节点的可以不给（null），那就完全由子级汇总而来。
   */
  value: number | null
}

export type HierarchyNodeKind = 'data' | 'rest'

export interface HierarchyNode {
  id: string
  parentId: string | null
  label: string
  /** 根为 0 */
  depth: number
  value: number
  kind: HierarchyNodeKind
  /** 输入里的行号；「未细分」节点取其父级的行号，便于回溯到源数据 */
  sourceIndex: number
  /** 占根合计。根合计为 0 时无定义 */
  share: number | null
  /** 占直接父级。根节点为 null */
  shareOfParent: number | null
  /** 沿分配轴的起止位置，0–1。旭日乘 2π，Icicle 乘宽度 */
  start: number
  end: number
  childIds: string[]
  valueText: string
  shareText: string
  description: string
}

export interface HierarchyModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  /** 深度优先、同层降序；渲染层照这个顺序画就能和另一张图对上 */
  nodes: HierarchyNode[]
  rootIds: string[]
  excluded: { id: string; label: string; sourceIndex: number; reason: string }[]
  total: number
  totalText: string
  maxDepth: number
  unit: string
  caption: string
}

const numberText = (n: number) =>
  n !== 0 && Math.abs(n) < 0.000001
    ? n.toExponential(3)
    : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)

const percentText = (n: number | null) => (n === null ? '—' : `${(n * 100).toFixed(1)}%`)

/** 「未细分」子节点的 id 由父级派生，稳定且不会撞上业务 id */
export const restIdOf = (parentId: string) => `${parentId}::__rest`

/**
 * 差额小到这个比例以下就不补「未细分」。
 *
 * 浮点求和几乎必然差出 1e-16 量级的零头，照补会在每个父级下面挂一个
 * 宽度为零、却能被 Tab 到、还会被读屏念出来的空节点。
 * 按父级自身取相对值，而不是定一个绝对的 0.000001——后者在以亿为单位的
 * 数据上什么也拦不住，在以毫克为单位的数据上又会把真实差额吃掉。
 */
const REST_EPSILON = 1e-9

interface Pending {
  item: HierarchyInput
  sourceIndex: number
  children: Pending[]
}

function invalid(base: HierarchyModel, caption: string): HierarchyModel {
  return { ...base, state: 'invalid', caption }
}

/**
 * 把扁平的父子行汇总成一棵可直接渲染的树。
 *
 * 不修改入参；相同值保持输入次序，因此同一份数据在两张图上排出的顺序一致。
 */
export function buildHierarchy(
  input: readonly HierarchyInput[],
  { unit = '' } = {}
): HierarchyModel {
  const base: HierarchyModel = {
    version: 1,
    state: 'empty',
    nodes: [],
    rootIds: [],
    excluded: [],
    total: 0,
    totalText: '0',
    maxDepth: 0,
    unit,
    caption: ''
  }

  const byId = new Map<string, Pending>()
  let index = -1
  for (const item of input) {
    const sourceIndex = (index += 1)
    if (!item.id) return invalid(base, '节点 ID 不能为空，否则无法回溯到源数据')
    if (byId.has(item.id)) return invalid(base, `节点 ID 重复：${item.id}，请先明确聚合口径`)
    if (item.id.endsWith('::__rest')) {
      return invalid(base, `节点 ID ${item.id} 与「未细分」的保留后缀冲突`)
    }
    byId.set(item.id, { item, sourceIndex, children: [] })
  }

  const roots: Pending[] = []
  for (const node of byId.values()) {
    const { parentId } = node.item
    if (parentId === null) {
      roots.push(node)
      continue
    }
    const parent = byId.get(parentId)
    if (!parent) return invalid(base, `节点 ${node.item.id} 的父级 ${parentId} 不存在`)
    if (parentId === node.item.id) return invalid(base, `节点 ${node.item.id} 把自己当成了父级`)
    parent.children.push(node)
  }

  if (!byId.size) return { ...base, caption: '没有可绘制的层级数据' }
  /*
   * 有节点却没有根，说明父子指向绕成了环。环不会在上面那一轮暴露：
   * 每个节点的父级都存在，只是顺着走永远回不到根。
   */
  if (!roots.length) return invalid(base, '父子关系成环，没有可作为起点的根节点')

  /*
   * 成环的那一支：每个节点的父级都在，只是顺着父级走永远到不了根。
   * 必须在求和之前拦住——汇总是递归的，环会让它直接栈溢出，
   * 而栈溢出报出来的是一句和数据无关的话，谁也看不出错在哪份数据上。
   */
  const reachable = new Set<string>()
  const walk = (node: Pending) => {
    if (reachable.has(node.item.id)) return
    reachable.add(node.item.id)
    for (const child of node.children) walk(child)
  }
  for (const root of roots) walk(root)
  if (reachable.size !== byId.size) {
    const stray = [...byId.values()].find((node) => !reachable.has(node.item.id))!
    return invalid(base, `父子关系成环，${stray.item.label} 这一支回不到根节点`)
  }

  /* 排除清单先过一遍：负值与非有限数在汇总之前就得拿掉，否则会污染整棵树的合计 */
  const dropped = new Set<string>()
  let dropIndex = -1
  for (const item of input) {
    const sourceIndex = (dropIndex += 1)
    const value = item.value
    if (value === null) continue
    const reason = !Number.isFinite(value)
      ? '值非有限数，未计入分母'
      : value < 0
        ? '负值不适用于层级占比，未计入分母'
        : ''
    if (reason) {
      base.excluded.push({ id: item.id, label: item.label, sourceIndex, reason })
      dropped.add(item.id)
    }
  }

  /*
   * 被排除的节点如果还挂着子树，子树一并去掉并逐个记原因——
   * 留着它们会让子级之和大于（已归零的）父级，变成一条读者无从理解的矛盾报错。
   */
  const dropSubtree = (node: Pending, rootLabel: string) => {
    for (const child of node.children) {
      if (!dropped.has(child.item.id)) {
        base.excluded.push({
          id: child.item.id,
          label: child.item.label,
          sourceIndex: child.sourceIndex,
          reason: `父级「${rootLabel}」未计入分母，其下级一并排除`
        })
        dropped.add(child.item.id)
      }
      dropSubtree(child, rootLabel)
    }
  }
  for (const node of byId.values()) {
    if (dropped.has(node.item.id)) dropSubtree(node, node.item.label)
  }

  const live = (node: Pending) => !dropped.has(node.item.id)

  /* 第一轮：自底向上求和，并在父级自报值大于子级之和时记下差额 */
  const rollup = new Map<string, { value: number; rest: number }>()
  let conflict = ''
  const sum = (node: Pending): number => {
    const children = node.children.filter(live)
    let childSum = 0
    for (const child of children) childSum += sum(child)
    const declared = node.item.value
    if (declared === null) {
      rollup.set(node.item.id, { value: childSum, rest: 0 })
      return childSum
    }
    if (!children.length) {
      rollup.set(node.item.id, { value: declared, rest: 0 })
      return declared
    }
    const gap = declared - childSum
    if (gap < -Math.max(Math.abs(declared), Math.abs(childSum)) * REST_EPSILON) {
      conflict ||= `节点「${node.item.label}」的下级之和 ${numberText(childSum)}${unit} 超过它自报的 ${numberText(declared)}${unit}，口径重叠或重复上报`
    }
    const rest = gap > Math.abs(declared) * REST_EPSILON ? gap : 0
    rollup.set(node.item.id, { value: declared, rest })
    return declared
  }
  for (const root of roots.filter(live)) sum(root)
  if (conflict) return invalid(base, conflict)

  const total = roots.filter(live).reduce((acc, node) => acc + rollup.get(node.item.id)!.value, 0)
  if (!Number.isFinite(total)) return invalid(base, '合计超出可表示范围，请先调整单位')

  /* 第二轮：自顶向下铺位置。同层降序、相同值按输入次序，「未细分」恒排在最后 */
  const nodes: HierarchyNode[] = []
  let maxDepth = 0
  const emit = (node: Pending, depth: number, start: number, span: number, parentValue: number | null) => {
    const { value, rest } = rollup.get(node.item.id)!
    const children = node.children
      .filter(live)
      .sort((a, b) => rollup.get(b.item.id)!.value - rollup.get(a.item.id)!.value || a.sourceIndex - b.sourceIndex)
    const childIds = children.map((child) => child.item.id)
    if (rest > 0) childIds.push(restIdOf(node.item.id))
    const share = total > 0 ? value / total : null
    const shareOfParent = parentValue === null ? null : parentValue > 0 ? value / parentValue : null
    maxDepth = Math.max(maxDepth, depth)
    nodes.push({
      id: node.item.id,
      parentId: node.item.parentId,
      label: node.item.label,
      depth,
      value,
      kind: 'data',
      sourceIndex: node.sourceIndex,
      share,
      shareOfParent,
      start,
      end: start + span,
      childIds,
      valueText: `${numberText(value)}${unit}`,
      shareText: percentText(share),
      description: describe(node.item.label, depth, value, share, shareOfParent, unit)
    })

    if (!childIds.length || value <= 0) return
    let cursor = start
    for (const child of children) {
      const childValue = rollup.get(child.item.id)!.value
      const childSpan = (childValue / value) * span
      emit(child, depth + 1, cursor, childSpan, value)
      cursor += childSpan
    }
    if (rest > 0) {
      const restShare = total > 0 ? rest / total : null
      const restSpan = (rest / value) * span
      maxDepth = Math.max(maxDepth, depth + 1)
      nodes.push({
        id: restIdOf(node.item.id),
        parentId: node.item.id,
        label: `${node.item.label}·未细分`,
        depth: depth + 1,
        value: rest,
        kind: 'rest',
        sourceIndex: node.sourceIndex,
        share: restShare,
        shareOfParent: rest / value,
        start: cursor,
        end: cursor + restSpan,
        childIds: [],
        valueText: `${numberText(rest)}${unit}`,
        shareText: percentText(restShare),
        description: `${node.item.label} 里未细分的部分：${numberText(rest)}${unit}，占上级 ${percentText(rest / value)}——下级只报到了 ${numberText(value - rest)}${unit}`
      })
    }
  }

  const liveRoots = roots
    .filter(live)
    .sort((a, b) => rollup.get(b.item.id)!.value - rollup.get(a.item.id)!.value || a.sourceIndex - b.sourceIndex)
  let cursor = 0
  for (const root of liveRoots) {
    const value = rollup.get(root.item.id)!.value
    const span = total > 0 ? value / total : 0
    emit(root, 0, cursor, span, null)
    cursor += span
  }

  const quality = base.excluded.length
    ? `；${base.excluded.length} 项未计入，占比只代表已知有效值`
    : ''
  const restCount = nodes.filter((node) => node.kind === 'rest').length
  const restNote = restCount ? `；有 ${restCount} 处下级未报全，差额已单列为「未细分」` : ''

  return {
    ...base,
    state: liveRoots.length ? 'ready' : 'empty',
    nodes,
    rootIds: liveRoots.map((root) => root.item.id),
    total,
    totalText: `${numberText(total)}${unit}`,
    maxDepth,
    caption: !liveRoots.length
      ? `没有可绘制的有效层级${quality}`
      : total === 0
        ? `有效值合计为 0，占比无定义${quality}`
        : `合计 ${numberText(total)}${unit}，共 ${maxDepth + 1} 层${restNote}${quality}`
  }
}

function describe(
  label: string,
  depth: number,
  value: number,
  share: number | null,
  shareOfParent: number | null,
  unit: string
): string {
  const head = `第 ${depth + 1} 层 ${label}：${numberText(value)}${unit}`
  if (shareOfParent === null) return `${head}，占全体 ${percentText(share)}`
  return `${head}，占全体 ${percentText(share)}，占上级 ${percentText(shareOfParent)}`
}

/**
 * 从某个节点往上回到根的那条路径，含它自己。
 *
 * 面包屑与「下钻之后怎么回去」都靠它。放在共享层是因为两张图的下钻语义
 * 必须一致：旭日点中间那圈回上一层、Icicle 点左边那列回上一层，走的是同一条路。
 */
export function hierarchyPath(model: HierarchyModel, id: string): HierarchyNode[] {
  const byId = new Map(model.nodes.map((node) => [node.id, node]))
  const path: HierarchyNode[] = []
  let current = byId.get(id)
  while (current) {
    path.unshift(current)
    current = current.parentId === null ? undefined : byId.get(current.parentId)
  }
  return path
}

/**
 * 只取要画的那几层：根据下钻焦点重新铺一遍 0–1 的位置。
 *
 * 下钻不是「把别的扇区藏起来」，而是把焦点那一支重新摊满整条轴——
 * 否则下钻三层之后，那一支只剩百分之几的宽度，点都点不中。
 * 占比文字仍然报**原来的**分母（占全体多少），焦点变了不等于数据变了。
 */
export function hierarchyView(model: HierarchyModel, focusId: string | null): HierarchyNode[] {
  if (model.state !== 'ready') return []
  if (!focusId) return model.nodes
  const byId = new Map(model.nodes.map((node) => [node.id, node]))
  const focus = byId.get(focusId)
  if (!focus) return model.nodes
  const span = focus.end - focus.start
  if (span <= 0) return [focus]
  const inside = (node: HierarchyNode) =>
    node.id === focus.id ||
    hierarchyPath(model, node.id).some((step) => step.id === focus.id)
  return model.nodes.filter(inside).map((node) => ({
    ...node,
    depth: node.depth - focus.depth,
    start: (node.start - focus.start) / span,
    end: (node.end - focus.start) / span
  }))
}
