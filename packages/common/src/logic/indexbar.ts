/**
 * 索引栏的分组与命中。
 *
 * 右侧那条字母条看着简单，两处容易各端不一致：
 * 「#」放开头还是结尾、手指滑到两个字母中间时算哪一个。
 */

export interface IndexGroup<T> {
  /** 索引字母，通常是 A-Z 或 # */
  key: string
  items: T[]
}

/**
 * 按首字母分组。
 *
 * 取不到字母的（数字、符号、无拼音的生僻字）统一归到「#」，并且排在最后。
 * 排在开头是常见做法，但那会让用户第一眼看到的是一堆杂项——
 * 而他打开通讯录是来找人的，不是来看「未分类」的。
 */
export function groupByIndex<T>(
  items: T[],
  keyOf: (item: T) => string
): IndexGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const raw = (keyOf(item) || '').trim().charAt(0).toUpperCase()
    const key = /^[A-Z]$/.test(raw) ? raw : '#'
    const list = map.get(key)
    if (list) list.push(item)
    else map.set(key, [item])
  }

  const letters = [...map.keys()].filter((k) => k !== '#').sort()
  const groups = letters.map((key) => ({ key, items: map.get(key)! }))
  // 「#」压到最后：用户是来找人的，不该第一眼看到一堆杂项
  if (map.has('#')) groups.push({ key: '#', items: map.get('#')! })
  return groups
}

/**
 * 手指在字母条上的位置对应哪个字母。
 *
 * 用「落在哪一格」而不是「离哪个字母最近」：最近判定在两格交界处会来回跳，
 * 手指几乎没动、列表却在两个分组之间反复横跳。
 */
export function indexAt(
  offsetY: number,
  barHeight: number,
  count: number
): number {
  if (count <= 0 || barHeight <= 0) return -1
  const cell = barHeight / count
  return Math.min(count - 1, Math.max(0, Math.floor(offsetY / cell)))
}

/**
 * 列表滚到某处时，哪个分组该高亮。
 *
 * 取「最后一个已经滚过顶部的分组」，而不是「第一个还在视野里的」：
 * 后者在分组很长时会一直高亮下一个分组——用户明明还在 A 里面，
 * 字母条却已经高亮到 B 了。
 */
export function activeIndex(offsets: number[], scrollTop: number): number {
  let active = 0
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= scrollTop + 1) active = i
    else break
  }
  return active
}
