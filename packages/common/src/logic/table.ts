/** 表格排序：三态循环与比较规则，与渲染无关 */
export type SortOrder = 'asc' | 'desc' | null

export function nextSortOrder(order: SortOrder): SortOrder {
  return order === 'asc' ? 'desc' : order === 'desc' ? null : 'asc'
}

/** 数值按大小、其余按中文拼音比较；空值恒排在后面 */
export function sortRows<T extends Record<string, any>>(
  rows: T[],
  key: string | null,
  order: SortOrder
): T[] {
  if (!key || !order) return rows
  const factor = order === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
    return String(av).localeCompare(String(bv), 'zh-CN') * factor
  })
}
