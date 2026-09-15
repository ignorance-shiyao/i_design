/**
 * 批量操作的纯逻辑（astra.md 的 B07）。
 *
 * 这一层只解决两件事，但它们是批量操作里唯一会造成真实损失的两件：
 *
 * **一、「对谁做」必须说死。**
 * 列表页上「全选」这个词有三种完全不同的含义：勾中的这几行、当前这一页、
 * 以及符合当前筛选的全部。三者在屏幕上差别极小——一个复选框、一行小字——
 * 而后果差着数量级：用户以为勾的是当前页的 20 行，实际发出去的是「全部匹配」
 * 的 8000 行，那是一次谁也收不回的操作。
 *
 * 所以这里的规则是：作用域是一个显式的值，不是「勾了几个」推出来的；
 * 每一种都有一句写死的摘要；跨出「看得见的范围」那一档必须再确认一次，
 * 而确认语里要复述条数与范围，不能只说「确定吗」。
 *
 * **二、部分失败之后，重试只发失败项。**
 * 批量操作十有八九是部分成功。把整批重发一遍等于让已经成功的那些再执行一次——
 * 扣款、发货、发通知这类动作，第二次执行就是事故。所以结果要拆成成功与失败
 * 两份，重试的载荷只有失败的那些 id，而且多轮重试之间成功集要累积，
 * 不能被后一轮的结果覆盖掉。
 */

export type BulkId = string | number

/**
 * 作用域。三个值，不许再多：
 *   selected  用户逐行勾中的（可能跨页累计）
 *   page      当前这一页的全部
 *   matched   符合当前筛选的全部——它包含用户没看见过的行
 */
export type BulkScope = 'selected' | 'page' | 'matched'

export interface BulkSelectionInput {
  scope: BulkScope
  /** 当前页的行 id */
  pageIds: readonly BulkId[]
  /** 用户勾中的行 id */
  selectedIds: readonly BulkId[]
  /** 符合当前筛选的总条数，由服务端给——前端数不出来 */
  matchedTotal: number
  /** 当前有没有筛选条件。没有筛选时「全部匹配」就是「全表」，措辞得跟着变 */
  filtered?: boolean
}

export interface BulkSelection {
  scope: BulkScope
  /** 这一刻真正会被操作的条数 */
  count: number
  /** 一句话说清「对谁做」。它会出现在操作条上，不是可选项 */
  summary: string
  /**
   * 能不能逐条列出这些 id。
   *
   * matched 返回 null：它可能有十万条，前端手里根本没有这份名单，
   * 硬凑一份出来只会凑出「当前页的那些」，那正是这层要防的误解。
   * 调用方看到 null 就该把筛选条件发给服务端，由服务端去圈定范围。
   */
  ids: BulkId[] | null
  /** 跨出「看得见的范围」了，要再确认一次 */
  needsConfirm: boolean
  /** 确认语。复述条数与范围，不能只说「确定吗」 */
  confirmMessage: string
}

const nothing = (scope: BulkScope): BulkSelection => ({
  scope,
  count: 0,
  summary: '未选择任何项',
  ids: [],
  needsConfirm: false,
  confirmMessage: ''
})

export function bulkSelection(input: BulkSelectionInput): BulkSelection {
  const { scope, matchedTotal } = input
  const pageIds = [...input.pageIds]
  const selectedIds = [...input.selectedIds]

  if (scope === 'matched') {
    if (matchedTotal <= 0) return nothing(scope)
    const where = input.filtered ? '符合当前筛选条件' : '全表'
    return {
      scope,
      count: matchedTotal,
      summary: `${where}的全部 ${matchedTotal} 项`,
      // 名单在服务端，前端不许自己凑一份
      ids: null,
      // 这一档会碰到用户没看见过的行，所以一定要再问一次
      needsConfirm: true,
      confirmMessage: `即将对${where}的全部 ${matchedTotal} 项执行操作，其中包含当前页看不到的数据。`
    }
  }

  if (scope === 'page') {
    if (!pageIds.length) return nothing(scope)
    return {
      scope,
      count: pageIds.length,
      summary: `当前页的 ${pageIds.length} 项`,
      ids: pageIds,
      needsConfirm: false,
      confirmMessage: ''
    }
  }

  if (!selectedIds.length) return nothing(scope)
  return {
    scope,
    count: selectedIds.length,
    summary: `已勾选的 ${selectedIds.length} 项`,
    ids: selectedIds,
    needsConfirm: false,
    confirmMessage: ''
  }
}

/**
 * 该不该给「选择符合筛选的全部 N 项」这个入口。
 *
 * 只在「当前页已经全勾上、而匹配总数还更多」时给：这时候用户的意图明显是
 * 「我要的不止这一页」。在别的时候摆出来，只会让人在没想清楚范围时点到它。
 */
export function canEscalate(input: Omit<BulkSelectionInput, 'scope'>): boolean {
  const pageIds = [...input.pageIds]
  if (!pageIds.length) return false
  const selected = new Set(input.selectedIds)
  const wholePageSelected = pageIds.every((id) => selected.has(id))
  return wholePageSelected && input.matchedTotal > pageIds.length
}

/** 升级到「全部匹配」之后，退回来的那个入口该写什么 */
export function escalateLabel(matchedTotal: number, filtered = false): string {
  return `选择${filtered ? '符合当前筛选条件' : '全表'}的全部 ${matchedTotal} 项`
}

/* ---------- 部分失败 ---------- */

export interface BulkResultItem {
  id: BulkId
  ok: boolean
  /** 失败原因。要能直接显示在那一行上，所以是给人看的句子，不是错误码 */
  reason?: string
}

export type BulkOutcomeKind = 'all-ok' | 'partial' | 'all-failed'

export interface BulkOutcome {
  kind: BulkOutcomeKind
  total: number
  succeeded: BulkId[]
  failed: { id: BulkId; reason: string }[]
  /** 重试只发这些：成功项再发一次就是重复执行 */
  retryIds: BulkId[]
  summary: string
}

const NO_REASON = '未知原因'

export function bulkOutcome(items: readonly BulkResultItem[]): BulkOutcome {
  const succeeded: BulkId[] = []
  const failed: { id: BulkId; reason: string }[] = []
  for (const item of items) {
    if (item.ok) succeeded.push(item.id)
    else failed.push({ id: item.id, reason: item.reason?.trim() || NO_REASON })
  }
  const total = items.length
  const kind: BulkOutcomeKind =
    failed.length === 0 ? 'all-ok' : succeeded.length === 0 ? 'all-failed' : 'partial'
  const summary =
    kind === 'all-ok'
      ? `${total} 项全部成功`
      : kind === 'all-failed'
        ? `${total} 项全部失败`
        : `${succeeded.length} 项成功，${failed.length} 项失败`
  return { kind, total, succeeded, failed, retryIds: failed.map((f) => f.id), summary }
}

/**
 * 把一轮重试的结果并回上一轮。
 *
 * 成功集只增不减：上一轮成功的那些这一轮根本没发出去，后一轮的结果里
 * 当然不会有它们——直接用后一轮覆盖，界面上就会显示「成功 2 项」，
 * 而实际上已经成功了 18 项，用户会以为前面那批白做了，于是再点一次全量重试。
 *
 * 失败集则以后一轮为准：这一轮成功的要从失败里摘掉。
 */
export function mergeOutcome(previous: BulkOutcome, retry: BulkOutcome): BulkOutcome {
  const succeeded = [...previous.succeeded]
  for (const id of retry.succeeded) if (!succeeded.includes(id)) succeeded.push(id)

  const stillFailed = retry.failed.filter((f) => !succeeded.includes(f.id))
  const total = succeeded.length + stillFailed.length
  const kind: BulkOutcomeKind =
    stillFailed.length === 0 ? 'all-ok' : succeeded.length === 0 ? 'all-failed' : 'partial'
  const summary =
    kind === 'all-ok'
      ? `${total} 项全部成功`
      : kind === 'all-failed'
        ? `${total} 项全部失败`
        : `${succeeded.length} 项成功，${stillFailed.length} 项失败`
  return {
    kind,
    total,
    succeeded,
    failed: stillFailed,
    retryIds: stillFailed.map((f) => f.id),
    summary
  }
}

/** 失败的行在表格里怎么标出来：给一张 id → 原因的表，行渲染时直接查 */
export function failureIndex(outcome: BulkOutcome): Record<string, string> {
  const out: Record<string, string> = {}
  for (const item of outcome.failed) out[String(item.id)] = item.reason
  return out
}
