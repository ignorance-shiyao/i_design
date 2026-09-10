/**
 * 穿梭框的搬运规则。
 *
 * 看起来只是两个数组来回挪，实际上「搬完之后勾选状态怎么办」「搜索时全选选的是谁」
 * 这两处各端极容易给出不同答案，而两种答案都说得通——正因如此才必须只写一份。
 */

export interface TransferItem {
  key: string
  label: string
  disabled?: boolean
}

export type TransferSide = 'source' | 'target'

/** 按当前搜索词过滤某一栏 */
export function filterItems(items: TransferItem[], keyword: string): TransferItem[] {
  if (!keyword) return items
  const needle = keyword.toLowerCase()
  return items.filter((item) => item.label.toLowerCase().includes(needle))
}

/** 两栏的当前内容。target 按 targetKeys 给定的顺序排，而不是按原数组顺序 */
export function splitSides(
  items: TransferItem[],
  targetKeys: string[]
): { source: TransferItem[]; target: TransferItem[] } {
  const picked = new Set(targetKeys)
  const byKey = new Map(items.map((item) => [item.key, item]))
  return {
    source: items.filter((item) => !picked.has(item.key)),
    // 用户自己搬过去的顺序是有意义的，按原数组重排会把它抹掉
    target: targetKeys.map((key) => byKey.get(key)).filter((item): item is TransferItem => !!item)
  }
}

/**
 * 搬运。
 *
 * 禁用项不搬：它在界面上是灰的、勾不上，但「全选」很容易把它一起收进选中集合，
 * 于是点一下搬运，一个用户根本点不动的条目就跑到对面去了。
 */
export function moveKeys(
  items: TransferItem[],
  targetKeys: string[],
  moving: string[],
  to: TransferSide
): string[] {
  const byKey = new Map(items.map((item) => [item.key, item]))
  const movable = moving.filter((key) => byKey.get(key) && !byKey.get(key)!.disabled)
  if (to === 'target') {
    const picked = new Set(targetKeys)
    // 追加在末尾而不是插回原位：刚搬过去的东西应当出现在用户看得见的地方
    return [...targetKeys, ...movable.filter((key) => !picked.has(key))]
  }
  const removing = new Set(movable)
  return targetKeys.filter((key) => !removing.has(key))
}

/**
 * 搬运后剩下的勾选。
 *
 * 搬走的那些要从勾选里清掉。不清的话，勾选集合里会留着已经不在这一栏的 key，
 * 于是「已选 3 项」而屏幕上一个勾都没有——这个状态用户无法自己纠正。
 */
export function checkedAfterMove(checked: string[], moved: string[]): string[] {
  const gone = new Set(moved)
  return checked.filter((key) => !gone.has(key))
}

export interface HeaderState {
  /** 这一栏当前可勾选的条目数（不含禁用项） */
  selectable: number
  checked: number
  allChecked: boolean
  someChecked: boolean
}

/**
 * 表头「全选」的状态。
 *
 * 只统计当前可见的条目——搜索状态下点全选，用户的意思是「这些」，
 * 不是「包括我现在看不见的那些」。把不可见的一起选中，
 * 再点搬运就会搬走一批他从没见过的条目，而且没有任何提示。
 */
export function headerState(visible: TransferItem[], checked: string[]): HeaderState {
  const picked = new Set(checked)
  const selectable = visible.filter((item) => !item.disabled)
  const hit = selectable.filter((item) => picked.has(item.key)).length
  return {
    selectable: selectable.length,
    checked: hit,
    allChecked: selectable.length > 0 && hit === selectable.length,
    someChecked: hit > 0 && hit < selectable.length
  }
}

/** 点表头全选：全选中就取消这一批，否则补齐这一批 */
export function toggleAll(visible: TransferItem[], checked: string[]): string[] {
  const state = headerState(visible, checked)
  const keys = visible.filter((item) => !item.disabled).map((item) => item.key)
  if (state.allChecked) {
    const gone = new Set(keys)
    return checked.filter((key) => !gone.has(key))
  }
  const picked = new Set(checked)
  return [...checked, ...keys.filter((key) => !picked.has(key))]
}

/** 勾选 / 取消一项 */
export function toggleItem(checked: string[], key: string): string[] {
  return checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]
}
