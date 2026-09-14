/**
 * 示例应用的 mock API。
 *
 * 它存在的意义不是「有数据可显示」，而是**让异常路径成为默认可达的**。
 * 接真实服务时，403 / 409 / 429 / 超时 / 部分失败每一条都会发生，
 * 但在开发机上一条都不会发生——于是这些分支写完没人验过，
 * 上线第一周全在它们上面翻车。
 *
 * 这里的每一种异常都能显式注入，也能按 seed 稳定复现。
 */
import type { Clock } from './clock'
import { createRng, seedFrom, type Rng } from './rng'
import { orderAmount, type Order, type OrderStatus, type Person } from './entities'

export type Fault = 'none' | 'forbidden' | 'conflict' | 'rate-limit' | 'timeout' | 'partial'

export class ApiError extends Error {
  constructor(
    readonly code: 403 | 409 | 429 | 408 | 422,
    message: string,
    /** 排查用：每个响应都带，日志里能对上是哪一次请求 */
    readonly traceId: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 订单状态机。写成数据而不是一串 if：各端与测试读的是同一张表 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approving', 'cancelled'],
  approving: ['approved', 'rejected'],
  approved: ['shipped', 'cancelled'],
  rejected: ['draft', 'cancelled'],
  shipped: ['closed'],
  closed: [],
  cancelled: []
}

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  ORDER_TRANSITIONS[from].includes(to)

export interface ApiOptions {
  seed: number
  clock: Clock
  people: Person[]
  orders: Order[]
  /** 强制下一批请求走某种异常；控制台面板用它演示 */
  fault?: Fault
}

export interface Session {
  personId: string
  /** 审批权限按角色给；申请人不能审批自己的单据由 approve 里那条规则兜住 */
  roles: readonly ('sales' | 'approver' | 'admin')[]
}

export interface ListQuery {
  status?: OrderStatus
  keyword?: string
  page?: number
  pageSize?: number
}

export function createApi(options: ApiOptions) {
  const state = new Map(options.orders.map((o) => [o.id, { ...o, lines: [...o.lines] }]))
  /** 幂等键 → 已经产生过的结果。重复提交必须返回同一张单，而不是再开一张 */
  const idempotency = new Map<string, unknown>()
  let fault: Fault = options.fault ?? 'none'
  let requestSeq = 0

  const rng: Rng = createRng(options.seed)
  const traceId = () => `t-${(requestSeq += 1).toString(36).padStart(4, '0')}`

  /** 延迟也由 seed 决定：随机延迟会让截图时序漂，也会让 E2E 偶发失败 */
  const latency = (key: string) => 80 + (seedFrom(key) % 220)

  function guard(trace: string) {
    switch (fault) {
      case 'forbidden': throw new ApiError(403, '没有这个操作的权限', trace)
      case 'conflict': throw new ApiError(409, '数据已被他人修改，请刷新后重试', trace)
      case 'rate-limit': throw new ApiError(429, '请求过于频繁，请稍后再试', trace)
      case 'timeout': throw new ApiError(408, '请求超时', trace)
      default: break
    }
  }

  return {
    /** 面板用：把下一批请求切到某种异常上 */
    setFault(next: Fault) { fault = next },
    get fault() { return fault },
    /** 这次请求要等多久——UI 用它做骨架屏的时长，测试里可以直接跳过 */
    latencyOf: latency,

    listOrders(query: ListQuery = {}) {
      const trace = traceId()
      guard(trace)
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 20
      const all = [...state.values()]
        .filter((o) => (query.status ? o.status === query.status : true))
        .filter((o) => (query.keyword
          ? o.id.includes(query.keyword) || o.customer.includes(query.keyword)
          : true))
        // 按更新时间倒序，相同再按单号——不给第二排序键的话，同毫秒的两条顺序不稳定
        .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
      return {
        traceId: trace,
        total: all.length,
        page,
        items: all.slice((page - 1) * pageSize, page * pageSize).map((o) => ({ ...o, amount: orderAmount(o) }))
      }
    },

    getOrder(id: string) {
      const trace = traceId()
      guard(trace)
      const found = state.get(id)
      if (!found) throw new ApiError(422, `订单不存在：${id}`, trace)
      return { traceId: trace, order: { ...found, amount: orderAmount(found) } }
    },

    /**
     * 新建。带幂等键的重复提交返回同一张单——用户手抖点两下不该开出两张，
     * 而「手抖点两下」在移动端是常态。
     */
    createOrder(draft: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'revision' | 'status'>, idempotencyKey: string) {
      const trace = traceId()
      guard(trace)
      const seen = idempotency.get(idempotencyKey)
      if (seen) return { traceId: trace, order: seen as Order, deduplicated: true }
      if (!draft.lines.length) throw new ApiError(422, '订单至少要有一条明细', trace)
      const id = `SO-2026-${String(state.size + 1).padStart(4, '0')}`
      const now = options.clock.now()
      const created: Order = { ...draft, id, status: 'draft', createdAt: now, updatedAt: now, revision: 1 }
      state.set(id, created)
      idempotency.set(idempotencyKey, created)
      return { traceId: trace, order: created, deduplicated: false }
    },

    /**
     * 改状态。三件事一起校验：状态机允许、版本没被人改过、有权限。
     * 版本用的是详情页拿到的 revision——不带它就等于「谁后提交谁说了算」。
     */
    updateStatus(id: string, to: OrderStatus, revision: number, session: Session) {
      const trace = traceId()
      guard(trace)
      const found = state.get(id)
      if (!found) throw new ApiError(422, `订单不存在：${id}`, trace)
      if (found.revision !== revision) {
        throw new ApiError(409, `这张单已经被改过（你看到的是 v${revision}，现在是 v${found.revision}）`, trace)
      }
      if (!canTransition(found.status, to)) {
        throw new ApiError(422, `${found.status} 不能直接变成 ${to}`, trace)
      }
      const approving = to === 'approved' || to === 'rejected'
      if (approving) {
        if (!session.roles.includes('approver') && !session.roles.includes('admin')) {
          throw new ApiError(403, '没有审批权限', trace)
        }
        // 申请人不能审批自己的单据。这条规则前端后端各要有一份：
        // 前端为了不让按钮点下去才发现，后端为了真的挡住
        if (found.ownerId === session.personId && !session.roles.includes('admin')) {
          throw new ApiError(403, '不能审批自己提交的单据', trace)
        }
      }
      const next = { ...found, status: to, revision: found.revision + 1, updatedAt: options.clock.now() }
      state.set(id, next)
      return { traceId: trace, order: next }
    },

    /**
     * 批量导入。partial 故障下会有一部分失败——
     * 「部分成功」是最容易被忽略的一种结果：要能说清哪几行失败、为什么。
     */
    importOrders(rows: readonly { customer: string; ownerId: string }[]) {
      const trace = traceId()
      guard(trace)
      const failures: { row: number; reason: string }[] = []
      const accepted: string[] = []
      rows.forEach((row, index) => {
        const bad = fault === 'partial' ? rng.chance(0.35) : !row.customer || !row.ownerId
        if (bad) {
          failures.push({ row: index + 1, reason: row.customer ? '客户不存在或负责人为空' : '缺少客户' })
          return
        }
        accepted.push(row.customer)
      })
      return { traceId: trace, accepted: accepted.length, failures }
    },

    /** 一键重置：状态、幂等记录、故障开关一起回到初始，不留半份旧数据 */
    reset() {
      state.clear()
      for (const o of options.orders) state.set(o.id, { ...o, lines: [...o.lines] })
      idempotency.clear()
      fault = options.fault ?? 'none'
      options.clock.reset()
    }
  }
}
