/**
 * 详情页的纯逻辑（astra.md 的 B12）。
 *
 * 详情页看着只是「把一条记录摊开」，真正难的是四件事，而且它们都不是排版问题：
 *
 * **一、这条记录现在能做什么。**
 * 同一张单，草稿态能编辑能提交，已发货只能打印。做法上有一条容易走反的分界：
 *
 *   状态不允许的动作  **不出现**。它在这个状态下根本不是一个动作，
 *                     灰着摆在那儿只会让人反复去试、去猜要满足什么条件。
 *   没权限的动作      **出现，但停用并说明原因**。藏起来的话，用户会以为
 *                     这个功能不存在，转头去问同事、提工单——而答案其实只是
 *                     「你没有这个权限」。
 *
 * **二、看到的这一份还作不作数。**
 * 详情页会停留很久。期间别人改了、删了，而屏幕上还是进来时那一份。
 * 这时候所有写动作都要停掉，并且明说「你看到的是 v3，现在已经是 v5」——
 * 只说「操作失败」等于让用户再点一次。
 *
 * **三、回到列表要回到原来那个位置。**
 * 从第 7 页翻到的那条记录，返回时落在第 1 页顶部，等于把用户之前的翻页与
 * 筛选全作废了。所以「从哪儿来」是一张要带着走的票据，不是靠浏览器后退去赌。
 *
 * **四、上一条 / 下一条。**
 * 详情页十有八九是逐条看过去的。到头了不要把按钮藏掉——藏掉会让人以为
 * 是页面坏了；说清「已经是第一条」。
 */

/* ---------- 这一份还作不作数 ---------- */

export type RecordFreshness = 'fresh' | 'stale' | 'deleted'

export interface FreshnessInput {
  /** 进页面时拿到的版本号 */
  seenRevision: number
  /** 此刻服务端上的版本号 */
  currentRevision: number
  /** 记录还在吗。删掉之后版本号无从比较 */
  exists?: boolean
}

export interface FreshnessState {
  kind: RecordFreshness
  /** 状态本身。颜色不是唯一线索，这句话必须出现 */
  label: string
  detail: string
  /** 这一刻该给的出口 */
  action: 'none' | 'refresh' | 'back'
}

export function recordFreshness(input: FreshnessInput): FreshnessState {
  if (input.exists === false) {
    return {
      kind: 'deleted',
      label: '已被删除',
      detail: '这条记录已经不在了，页面上显示的是你进来时的那一份',
      action: 'back'
    }
  }
  if (input.currentRevision > input.seenRevision) {
    return {
      kind: 'stale',
      label: '已被他人更新',
      // 只说「操作失败」等于让用户再点一次，所以把两个版本号都摆出来
      detail: `你看到的是 v${input.seenRevision}，现在已经是 v${input.currentRevision}`,
      action: 'refresh'
    }
  }
  return { kind: 'fresh', label: '最新', detail: '', action: 'none' }
}

/* ---------- 这条记录现在能做什么 ---------- */

export type DetailActionKind = 'primary' | 'default' | 'danger'

export interface DetailActionSpec {
  key: string
  label: string
  kind?: DetailActionKind
  /**
   * 这个动作在哪些状态下才算一个动作。不给表示任何状态都算。
   * 不在其中就**不出现**——不是灰着。
   */
  states?: readonly string[]
  /** 需要的权限。缺了就出现但停用，并说明原因 */
  permission?: string
  /**
   * 只读动作（导出、打印、复制链接）。记录失效时它们照样可用——
   * 把「打印」一起停掉，只会让用户以为整页坏了。
   */
  readonly?: boolean
}

export interface DetailActionContext {
  status: string
  permissions?: readonly string[]
  freshness?: RecordFreshness
  /**
   * 业务规则挡下的动作：键是动作 key，值是给人看的原因。
   * 例如「不能审批自己提交的单据」——这类规则写不进状态机也写不进权限表。
   */
  denied?: Readonly<Record<string, string>>
}

export interface DetailAction {
  key: string
  label: string
  kind: DetailActionKind
  disabled: boolean
  /** 停用原因。disabled 为 true 时一定不是空串 */
  reason: string
}

/**
 * 算出这一刻该摆出哪些动作、哪些是灰的、为什么灰。
 *
 * 三条停用理由的优先级：**权限 > 失效 > 业务规则**。
 * 权限排第一是因为它最稳定——刷新一百次也不会变，先说它才不会让用户
 * 去做无用功；失效排第二，它刷新一下就没了；业务规则最靠后，
 * 因为它通常是最具体、最长的一句话，前两条成立时说它反而模糊了重点。
 */
export function detailActions(
  specs: readonly DetailActionSpec[],
  context: DetailActionContext
): DetailAction[] {
  const permissions = new Set(context.permissions ?? [])
  const denied = context.denied ?? {}
  const out: DetailAction[] = []

  for (const spec of specs) {
    // 状态不允许的动作根本不出现：灰着摆在那儿只会让人反复去试
    if (spec.states && !spec.states.includes(context.status)) continue

    let reason = ''
    if (spec.permission && !permissions.has(spec.permission)) {
      reason = `需要「${spec.permission}」权限`
    } else if (!spec.readonly && context.freshness && context.freshness !== 'fresh') {
      reason =
        context.freshness === 'deleted'
          ? '这条记录已被删除'
          : '这条记录已被他人更新，请先刷新'
    } else if (denied[spec.key]) {
      reason = denied[spec.key]
    }

    out.push({
      key: spec.key,
      label: spec.label,
      kind: spec.kind ?? 'default',
      disabled: reason !== '',
      reason
    })
  }
  return out
}

/** 一个动作都没有时说什么。空白一片会让人以为页面没加载完 */
export function noActionHint(status: string): string {
  return `「${status}」状态下没有可执行的操作`
}

/* ---------- 上一条 / 下一条 ---------- */

export interface Neighbours {
  /** 在这批 id 里排第几，从 0 起。不在其中是 -1 */
  index: number
  total: number
  prevId: string | null
  nextId: string | null
  /** 「第 3 条，共 128 条」。不在这批里时是空串 */
  position: string
  /** 到头了说什么。没到头是空串 */
  edgeHint: string
}

export function detailNeighbours(ids: readonly string[], currentId: string): Neighbours {
  const index = ids.indexOf(currentId)
  const total = ids.length
  if (index < 0) {
    return { index: -1, total, prevId: null, nextId: null, position: '', edgeHint: '' }
  }
  const prevId = index > 0 ? ids[index - 1] : null
  const nextId = index < total - 1 ? ids[index + 1] : null
  // 到头了不把按钮藏掉——藏掉会让人以为是页面坏了
  const edgeHint =
    total <= 1 ? '只有这一条' : !prevId ? '已经是第一条' : !nextId ? '已经是最后一条' : ''
  return { index, total, prevId, nextId, position: `第 ${index + 1} 条，共 ${total} 条`, edgeHint }
}

/* ---------- 从哪儿来，回哪儿去 ---------- */

export interface ReturnTicket {
  /** 列表当时的查询串（含筛选与页码），原样带回去 */
  search: string
  /** 列表当时滚到哪儿。取整到像素——小数在不同缩放下还原不回同一位置 */
  scrollY: number
  /** 从哪一行点进来的。回去之后把它高亮一下，用户才知道自己停在哪 */
  focusId?: string
}

/**
 * 把「从哪儿来」打包成一段可以放进 URL 或 storage 的文本。
 *
 * 用 JSON 而不是自定义分隔符：查询串里本来就什么字符都可能有，
 * 自己拼分隔符迟早会被一个带 `&` 的筛选值劈开。
 */
export function packReturn(ticket: ReturnTicket): string {
  const payload: Record<string, unknown> = {
    s: ticket.search,
    y: Math.max(0, Math.round(ticket.scrollY))
  }
  if (ticket.focusId) payload.f = ticket.focusId
  return JSON.stringify(payload)
}

/**
 * 解回来。
 *
 * 解不出来就返回 null，不抛错：这张票据来自 URL，用户会手改、会截断、
 * 会从聊天软件里粘贴一个被吃掉尾巴的版本。为这种情况白屏是不可接受的，
 * 调用方拿到 null 就退回列表顶部——那是个不精确但绝不出错的落点。
 */
export function unpackReturn(raw: string | null | undefined): ReturnTicket | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed !== 'object' || parsed === null) return null
    const search = typeof parsed.s === 'string' ? parsed.s : ''
    const y = typeof parsed.y === 'number' && Number.isFinite(parsed.y) ? Math.max(0, parsed.y) : 0
    const focusId = typeof parsed.f === 'string' && parsed.f ? parsed.f : undefined
    return { search, scrollY: y, focusId }
  } catch {
    return null
  }
}

/** 返回按钮上该写什么。带上「回到第几页」比光写「返回」有用得多 */
export function returnLabel(ticket: ReturnTicket | null, fallback = '返回列表'): string {
  if (!ticket) return fallback
  const page = /(?:^|[?&])page=(\d+)/.exec(ticket.search)
  if (!page) return fallback
  // page 参数从 0 起算的居多，显示时补成人读的第几页
  return `返回列表第 ${Number(page[1]) + 1} 页`
}
