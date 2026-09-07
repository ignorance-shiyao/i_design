/**
 * 页码序列计算：始终保留首尾页，中间窗口跟随当前页滑动，
 * 断开处以 'left' / 'right' 占位。各端只负责把它渲染成按钮。
 */
export type PageItem = number | 'left' | 'right'

export function buildPages(
  current: number,
  pageCount: number,
  maxVisible = 5
): PageItem[] {
  const count = Math.max(1, pageCount)
  const window = Math.max(1, maxVisible)
  if (count <= window + 2) return Array.from({ length: count }, (_, i) => i + 1)

  const half = Math.floor(window / 2)
  let start = Math.max(2, current - half)
  let end = start + window - 1
  if (end >= count) {
    end = count - 1
    start = Math.max(2, end - window + 1)
  }

  const result: PageItem[] = [1]
  if (start > 2) result.push('left')
  for (let i = start; i <= end; i++) result.push(i)
  if (end < count - 1) result.push('right')
  result.push(count)
  return result
}

export function pageCountOf(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
}

export function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(1, page), Math.max(1, pageCount))
}

export function rangeText(current: number, pageSize: number, total: number) {
  if (!total) return '共 0 条'
  const from = (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  return `第 ${from}-${to} 条 / 共 ${total} 条`
}
