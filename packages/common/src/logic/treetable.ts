/**
 * 树表与分组汇总的纯逻辑（astra.md 的 B06）。
 *
 * 表格一旦有了层级，三件事最容易做错，而且错得很隐蔽——它们都不会报错，
 * 只会让用户在某个时刻发现「数字不对」或者「我刚才勾的那些没了」：
 *
 * **一、排序只在兄弟之间排，不打平层级。**
 * 按金额倒序排一张树表，如果拿拍平后的行去排，子行会跑到别人家下面去。
 * 层级本身是数据的一部分，排序改变的是同一个父节点下的先后，不是归属。
 *
 * **二、折叠不丢选择，但必须把「有几项在收起的分组里」说出来。**
 * 收起一个分组之后把它下面的选择悄悄清掉，是「我明明勾了」的来源；
 * 而留着却不说，用户按下删除时会删掉他看不见的那几行——两种做法都伤人。
 * 留着，并且数出来：`selectionSummary` 那句「其中 N 项在收起的分组里」
 * 不是补充说明，是用户敢按下一步的前提。
 *
 * **三、汇总按全部子行算，不受折叠与分页影响。**
 * 一个合计数字在折叠分组之后变小，用户会当成数据错了——他不会想到
 * 那是「只算了看得见的行」。看得见与否是视图状态，跟这个分组一共多少钱无关。
 *
 * 还有一条贯穿全部：**行的身份是 rowKey，不是下标**。排序换了顺序、
 * 折叠换了可见集合，下标全部失效，只有 key 还指着同一行。
 */
import type { Aggregation } from '../contracts/chart'
import { aggregate } from './dataset'
import { sortRows, type SortOrder } from './table'

export interface TreeRow {
  key: string
  children?: TreeRow[]
  /** 不可选的行（比如汇总行、没权限的行）。给了原因才好在界面上说清楚 */
  selectableReason?: string
  [field: string]: unknown
}

/**
 * 树表的列同时描述两件不同的事：叶子列描述一格数据，非叶子列只描述表头分组。
 *
 * 因此分组列没有 `key`，叶子列必须有 `key`。把这条结构约束放在共享逻辑里，
 * 各端就不用各自猜一遍 colspan / rowspan，也不会出现 Web 两行表头、小程序一行表头。
 */
export interface TreeTableColumnSpec {
  key?: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  numeric?: boolean
  /** 仅叶子列可开启：连续的同级兄弟行值相同才纵向合并 */
  merge?: 'vertical'
  children?: TreeTableColumnSpec[]
}

export interface HeaderCell<T extends TreeTableColumnSpec = TreeTableColumnSpec> {
  column: T
  colSpan: number
  rowSpan: number
}

/** 由上到下的表头网格。`leaves` 是正文与排序唯一可用的列。 */
export interface HeaderLayout<T extends TreeTableColumnSpec = TreeTableColumnSpec> {
  rows: HeaderCell<T>[][]
  leaves: T[]
  depth: number
}

/**
 * 把列树摊成 HTML table / 原生表格所需的表头网格。
 *
 * 叶子列补满剩余深度；分组列横跨它全部后代。这样「业务信息」下的客户、金额
 * 永远和正文两格一一对应，而不是由每个端用 index 再拼一次。
 */
export function buildHeaderLayout<T extends TreeTableColumnSpec>(
  columns: readonly T[]
): HeaderLayout<T> {
  const depthOf = (column: T): number =>
    column.children?.length ? 1 + Math.max(...column.children.map((child) => depthOf(child as T))) : 1
  const depth = columns.length ? Math.max(...columns.map(depthOf)) : 1
  const rows: HeaderCell<T>[][] = Array.from({ length: depth }, () => [])
  const leaves: T[] = []
  const leafCount = (column: T): number =>
    column.children?.length
      ? column.children.reduce((total, child) => total + leafCount(child as T), 0)
      : 1
  const walk = (list: readonly T[], level: number) => {
    for (const column of list) {
      const grouped = !!column.children?.length
      rows[level].push({
        column,
        colSpan: grouped ? leafCount(column) : 1,
        rowSpan: grouped ? 1 : depth - level
      })
      if (grouped) walk(column.children as T[], level + 1)
      else leaves.push(column)
    }
  }
  walk(columns, 0)
  return { rows, leaves, depth }
}

export interface FlatRow {
  key: string
  row: TreeRow
  level: number
  parentKey?: string
  hasChildren: boolean
  expanded: boolean
}

/** 一行能不能选。`selectableReason` 有值就不能选，那句话直接给用户看 */
export function rowSelectable(row: TreeRow): boolean {
  return !row.selectableReason
}

/**
 * 排序。**只在兄弟之间排**，递归下去每一层各排各的。
 *
 * 拿拍平后的行去排会把子行排到别人家下面——层级是数据的一部分，
 * 排序改变的是同一个父节点下的先后，不是归属。
 */
export function sortTree(rows: readonly TreeRow[], key: string | null, order: SortOrder): TreeRow[] {
  const sorted = sortRows([...rows] as Record<string, any>[], key, order) as TreeRow[]
  return sorted.map((row) =>
    row.children?.length ? { ...row, children: sortTree(row.children, key, order) } : row
  )
}

/**
 * 当前该渲染的行，按渲染顺序。
 * 折叠的分支整段跳过，因此收起一个大分组的代价是 O(被跳过的行数)。
 */
export function flattenRows(rows: readonly TreeRow[], expandedKeys: Iterable<string>): FlatRow[] {
  const expanded = new Set(expandedKeys)
  const out: FlatRow[] = []
  const walk = (list: readonly TreeRow[], level: number, parentKey?: string) => {
    for (const row of list) {
      const hasChildren = !!row.children?.length
      const isExpanded = expanded.has(row.key)
      out.push({ key: row.key, row, level, parentKey, hasChildren, expanded: isExpanded })
      if (hasChildren && isExpanded) walk(row.children!, level + 1, row.key)
    }
  }
  walk(rows, 0)
  return out
}

export type RenderRow =
  | { kind: 'row'; row: FlatRow }
  /** 一个分组的小计，摆在它最后一条子行之后 */
  | { kind: 'summary'; groupKey: string; group: TreeRow; level: number }

export interface CellSpan {
  /** 0 表示这格被上方锚点合并，不渲染；正数为锚点跨越的行数 */
  rowSpan: number
}

/**
 * 排好、展开好之后的纵向合并结果。
 *
 * 合并不是数据属性，而是**当前视图的排版结果**：排序把原本相邻的两行打散，
 * 就必须断开；小计、父子层级和不同父节点也必须断开。否则一格看似省了重复文字，
 * 实际却把两条已经没有连续关系的记录说成同一个分组。
 */
export function bodyCellSpans(
  entries: readonly RenderRow[],
  columns: readonly TreeTableColumnSpec[]
): Map<string, CellSpan> {
  const merged = columns.filter((column) => column.merge === 'vertical' && column.key)
  const out = new Map<string, CellSpan>()
  for (const column of merged) {
    const key = column.key!
    let run: FlatRow[] = []
    const flush = () => {
      if (!run.length) return
      const span = run.length
      for (let i = 0; i < run.length; i += 1) {
        out.set(`${run[i].key}:${key}`, { rowSpan: i === 0 ? span : 0 })
      }
      run = []
    }
    for (const entry of entries) {
      if (entry.kind !== 'row') {
        flush()
        continue
      }
      const row = entry.row
      const previous = run[run.length - 1]
      const sameRun =
        previous &&
        previous.level === row.level &&
        previous.parentKey === row.parentKey &&
        previous.row[key] === row.row[key]
      if (!sameRun) flush()
      run.push(row)
    }
    flush()
  }
  return out
}

/**
 * 连小计一起排好的渲染序列。
 *
 * 小计跟在**这个分组最后一条子行之后**，不是紧跟在分组标题下面——
 * 摆在标题下面的话，它读起来像这一行自己的数字，而它是底下那几行的和；
 * 嵌套分组里更糟：两层小计会连着出现在两行标题之间，谁也分不清哪个是哪个的。
 *
 * 收起的分组不出小计：那一行自己就代表它，再挂一行「小计」是同一个数说两遍。
 */
export function renderRows(
  rows: readonly TreeRow[],
  expandedKeys: Iterable<string>,
  /** 不给汇总规格时只是 flattenRows 的等价物 */
  withSummary = true
): RenderRow[] {
  const expanded = new Set(expandedKeys)
  const out: RenderRow[] = []
  const walk = (list: readonly TreeRow[], level: number, parentKey?: string) => {
    for (const row of list) {
      const hasChildren = !!row.children?.length
      const isExpanded = expanded.has(row.key)
      out.push({
        kind: 'row',
        row: { key: row.key, row, level, parentKey, hasChildren, expanded: isExpanded }
      })
      if (hasChildren && isExpanded) {
        walk(row.children!, level + 1, row.key)
        if (withSummary) out.push({ kind: 'summary', groupKey: row.key, group: row, level })
      }
    }
  }
  walk(rows, 0)
  return out
}

/** 整棵树上的全部行，不管展开与否。汇总、全选与「藏起来几项」都靠它 */
export function allRows(rows: readonly TreeRow[]): TreeRow[] {
  const out: TreeRow[] = []
  const walk = (list: readonly TreeRow[]) => {
    for (const row of list) {
      out.push(row)
      if (row.children?.length) walk(row.children)
    }
  }
  walk(rows)
  return out
}

/** 只要叶子行。汇总按叶子算，否则父行的金额与它子行的金额会被加两遍 */
export function leafRows(rows: readonly TreeRow[]): TreeRow[] {
  return allRows(rows).filter((row) => !row.children?.length)
}

/* ---------- 展开 ---------- */

/**
 * 展开 / 收起一行。
 *
 * 收起时**不动**选择集合：收起是视图操作，不是取消选择。
 * 收起之后选择去了哪儿，由 `selectionSummary` 负责说出来。
 */
export function toggleExpanded(expanded: Iterable<string>, key: string): Set<string> {
  const next = new Set(expanded)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/** 全部展开。用于「展开全部」按钮与搜索命中后的自动展开 */
export function expandAll(rows: readonly TreeRow[]): Set<string> {
  return new Set(allRows(rows).filter((row) => row.children?.length).map((row) => row.key))
}

/* ---------- 选择 ---------- */

export interface SelectionSummary {
  /** 选中的总数 */
  total: number
  /** 其中此刻看得见的有几项 */
  visible: number
  /** 其中藏在收起的分组里的有几项 */
  hidden: number
  /** 摆给用户看的那句话。hidden 大于 0 时它必须点出来 */
  text: string
}

/**
 * 选择的去向，数出来。
 *
 * 「已选 12 项」后面那半句「其中 5 项在收起的分组里」，是用户敢按下删除的前提：
 * 没有它，他按下去才发现删掉了看不见的五行。
 */
export function selectionSummary(
  selected: Iterable<string>,
  visibleRows: readonly FlatRow[]
): SelectionSummary {
  const chosen = new Set(selected)
  const onScreen = new Set(visibleRows.map((r) => r.key))
  let visible = 0
  for (const key of chosen) if (onScreen.has(key)) visible += 1
  const total = chosen.size
  const hidden = total - visible
  if (total === 0) return { total: 0, visible: 0, hidden: 0, text: '未选择任何行' }
  return {
    total,
    visible,
    hidden,
    text: hidden > 0 ? `已选 ${total} 项，其中 ${hidden} 项在收起的分组里` : `已选 ${total} 项`
  }
}

export type SelectAllState = 'none' | 'some' | 'all'

/**
 * 表头那个复选框的状态。
 *
 * 口径是**整棵树里可选的行**，不是「屏幕上看得见的行」：
 * 折叠一个分组之后表头从「全选」变回「半选」，等于告诉用户折叠改变了选择，
 * 而它没有。不可选的行不参与判定，否则一行汇总行就能让全选永远点不亮。
 */
export function selectAllState(
  rows: readonly TreeRow[],
  selected: Iterable<string>
): SelectAllState {
  const chosen = new Set(selected)
  const selectable = allRows(rows).filter(rowSelectable)
  if (!selectable.length) return 'none'
  let hit = 0
  for (const row of selectable) if (chosen.has(row.key)) hit += 1
  if (hit === 0) return 'none'
  return hit === selectable.length ? 'all' : 'some'
}

/** 点表头复选框之后的新选择。全选覆盖整棵树，包括收起的分组里那些行 */
export function toggleSelectAll(rows: readonly TreeRow[], selected: Iterable<string>): Set<string> {
  const state = selectAllState(rows, selected)
  if (state === 'all') return new Set<string>()
  return new Set(allRows(rows).filter(rowSelectable).map((row) => row.key))
}

/**
 * 勾选一行。**父行与子行各选各的**，不联动。
 *
 * 树表不是树形选择器：这里的父行是一条真实记录（一张主订单、一个部门），
 * 勾它不等于勾它下面每一条。树形选择器里的父子联动搬到这儿来，
 * 用户勾一个部门就会连带提交它下面三百个人。
 */
export function toggleRow(
  rows: readonly TreeRow[],
  selected: Iterable<string>,
  key: string
): Set<string> {
  const next = new Set(selected)
  const row = allRows(rows).find((r) => r.key === key)
  if (!row || !rowSelectable(row)) return next
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/**
 * 排序、折叠之后把已经不在数据里的 key 摘掉。
 *
 * 只在**数据换了**的时候调用（翻页、筛选变了、重新拉取），
 * 不要在折叠时调用——折叠不改变数据，摘掉就是丢选择。
 */
export function pruneSelection(rows: readonly TreeRow[], selected: Iterable<string>): Set<string> {
  const alive = new Set(allRows(rows).map((row) => row.key))
  return new Set([...selected].filter((key) => alive.has(key)))
}

/* ---------- 汇总 ---------- */

/** 聚合方式沿用 dataset 那一套（sum / avg / min / max / count / median / p95），不另起一份 */
export type AggregateKind = Aggregation

export interface AggregateSpec {
  field: string
  kind: AggregateKind
  /** 显示成什么。不给就直接给数字 */
  label?: string
}

/**
 * 一组行在某个字段上的汇总值。
 *
 * 取值与判空交给 `dataset.ts` 的 `aggregate`：空值不参与平均，一条都没填给
 * null 而不是 0——「这一组里没有数据」与「这一组加起来是 0」是两件事。
 *
 * 只有 count 是这里自己算的：`dataset` 的 count 数的是**有值的个数**，
 * 而汇总行上那个「N 条明细」回答的是「这个分组有多少条」——
 * 一条没填金额的记录也是一条记录。
 */
export function aggregateField(rows: readonly TreeRow[], spec: AggregateSpec): number | null {
  if (spec.kind === 'count') return rows.length
  const values = rows.map((row) => {
    const raw = row[spec.field]
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
  })
  return aggregate(values, spec.kind)
}

export interface GroupSummary {
  key: string
  /** 这个分组一共多少叶子行 */
  count: number
  /** 字段 → 汇总值。值为 null 表示这一组里这个字段一条都没填 */
  values: Record<string, number | null>
}

/**
 * 一个分组的汇总。
 *
 * **按它全部的叶子后代算**，与展开与否无关：
 * 一个合计数字在折叠之后变小，用户会当成数据错了。
 * 按叶子算而不是按全部后代算，是因为中间层通常自己也带着一份金额，
 * 两个都加进去等于把同一笔钱算两遍。
 */
export function groupSummary(group: TreeRow, specs: readonly AggregateSpec[]): GroupSummary {
  const leaves = group.children?.length ? leafRows(group.children) : [group]
  const values: Record<string, number | null> = {}
  for (const spec of specs) values[spec.field] = aggregateField(leaves, spec)
  return { key: group.key, count: leaves.length, values }
}

/** 整张表的合计。同样按叶子算，同样与折叠无关 */
export function grandTotal(
  rows: readonly TreeRow[],
  specs: readonly AggregateSpec[]
): GroupSummary {
  const leaves = leafRows(rows)
  const values: Record<string, number | null> = {}
  for (const spec of specs) values[spec.field] = aggregateField(leaves, spec)
  return { key: '__total__', count: leaves.length, values }
}

/**
 * 汇总行上那句说明。
 *
 * 「小计」两个字单独摆着，读者不知道它算的是哪些行——尤其分组是折叠的时候。
 * 明写「3 条明细」，折叠时也还是 3。
 */
export function summaryLabel(summary: GroupSummary, name = '小计'): string {
  return `${name}（${summary.count} 条明细）`
}
