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
