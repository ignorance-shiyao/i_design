/**
 * 工具芯片：把一次工具调用压成一行。
 *
 * 智能体一次回答里可能调十几次工具。每次都摊开成一张卡片，读者要滚三屏才能
 * 看到结论；但全部藏起来，又没人知道它到底动了什么。芯片是折中：
 * 一行里只留「做了什么」与「动了多少」，要细节再展开成卡片。
 *
 * 这一层只管两件事——统计怎么写、一排芯片怎么汇总。
 * 各端各写一遍的话，同一次调用在 Web 上写「+13 −4」、在小程序上写「13 增 4 删」，
 * 读者会以为是两件事。
 */

export type ToolChipStatus = 'running' | 'success' | 'error'

export interface ToolChipItem {
  /** 稳定标识 */
  key: string
  /** 芯片上的主文字：工具名或被改的文件名 */
  label: string
  status?: ToolChipStatus
  /** 增加的行数 */
  added?: number
  /** 删除的行数 */
  removed?: number
}

/**
 * 改动统计写成一段字。
 *
 * 加与删分开写，零的那一半不写——「+13 −0」里的那个 0 不带信息，
 * 却和真正的数字长得一样，读者要多看一眼才知道它是空的。
 * 两边都是零就返回空串：一次没有改动的调用不该挂着一个「+0 −0」。
 *
 * 减号用的是 U+2212（−）而不是连字符：连字符比数字矮一截，
 * 和后面的数字排在一起会看着像断开的。
 */
export function toolChipStat(added = 0, removed = 0): string {
  const parts: string[] = []
  if (added > 0) parts.push(`+${added}`)
  if (removed > 0) parts.push(`−${removed}`)
  return parts.join(' ')
}

/**
 * 一排芯片的汇总。
 *
 * 折叠起一长串芯片时要有个总数顶在那里，否则折叠等于把信息删掉。
 * 失败的调用单独计数：十次里有一次失败，和十次全成，是完全不同的两件事，
 * 而「共 10 次调用」这一个数字把它们说成一样的。
 */
export function summarizeToolChips(items: ToolChipItem[]): {
  total: number
  running: number
  failed: number
  added: number
  removed: number
} {
  let running = 0
  let failed = 0
  let added = 0
  let removed = 0
  for (const item of items) {
    if (item.status === 'running') running++
    if (item.status === 'error') failed++
    added += item.added ?? 0
    removed += item.removed ?? 0
  }
  return { total: items.length, running, failed, added, removed }
}

/**
 * 状态对应的图标名。
 *
 * 状态绝不只靠颜色：色觉障碍用户与灰度打印下，红绿两个圆点是同一个圆点。
 * 图标形状不同（勾 / 叉），再加上读屏能念出来的文字标签，颜色只是第三条线索。
 *
 * 进行中不在这里：那一格是转圈的加载指示器，不是静态图标，各端用各自的
 * Loading 组件画——在这里返回一个图标名，各端还得再判断一次「这个名字要特殊处理」。
 */
export function toolChipIcon(status: ToolChipStatus = 'success'): 'check-circle' | 'error-circle' {
  return status === 'error' ? 'error-circle' : 'check-circle'
}
