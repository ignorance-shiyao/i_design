/**
 * 索引列表的分组与定位。
 *
 * 通讯录那种「右侧 A–Z、滑到哪跳到哪」的列表。分组规则与「当前停在哪一组」
 * 这两件事写在组件里，各端就会各自解释一遍：一端把数字归到 #、另一端归到 0-9，
 * 同一份数据在两端上的索引条长度都不一样。
 */

export interface IndexGroup<T> {
  /** 索引字母，非字母一律归到 # */
  index: string
  items: T[]
}

/** 非字母（数字、符号、未取到拼音的中文）统一归到 #，排在最后 */
export const INDEX_OTHER = '#'

function indexOf(letter: string): string {
  const first = letter.trim().charAt(0).toUpperCase()
  return /^[A-Z]$/.test(first) ? first : INDEX_OTHER
}

/**
 * 按首字母分组。
 *
 * 传入的 key 由调用方给——中文要先转拼音，那是业务的事，
 * 组件不该替它决定用哪套拼音表（「重庆」到底归 C 还是 Z 取决于词库）。
 */
export function groupByIndex<T>(items: T[], keyOf: (item: T) => string): IndexGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const index = indexOf(keyOf(item))
    const bucket = map.get(index)
    if (bucket) bucket.push(item)
    else map.set(index, [item])
  }

  const letters = [...map.keys()].filter((key) => key !== INDEX_OTHER).sort()
  const groups = letters.map((index) => ({ index, items: map.get(index)! }))
  // # 永远排最后：它是「其余」，不是某个字母
  if (map.has(INDEX_OTHER)) groups.push({ index: INDEX_OTHER, items: map.get(INDEX_OTHER)! })
  return groups
}

/**
 * 根据滚动位置判断当前停在哪一组。
 *
 * 判定用「组的顶边越过容器顶部」而不是「组还在视口里」——
 * 后者在一屏能看到三四组时会同时命中好几个，索引条上的高亮会来回跳。
 */
export function activeIndexAt(offsets: { index: string; top: number }[], scrollTop: number): string {
  let active = offsets[0]?.index ?? ''
  for (const group of offsets) {
    // 留 1px 容差：滚动位置常是小数，相等判断在缩放屏上会漏掉
    if (group.top - 1 <= scrollTop) active = group.index
    else break
  }
  return active
}
