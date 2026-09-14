/**
 * ERP 示例的数据装配：把共用层的 seed、时钟、实体与 mock API 拼起来。
 *
 * 只在这里拼一次，页面拿到的是同一个 api 实例——各页各自 createApi 的话，
 * 列表里改了状态，详情页看到的还是旧的，而那只是示例自己的 bug。
 */
import {
  createApi,
  createClock,
  orders as makeOrders,
  people as makePeople,
  type Order,
  type Session
} from '@i-design/examples-shared'

/** 固定 seed：同一个 seed 出同一批人、同一批单，截图与 E2E 才不会漂 */
export const SEED = 20260316

export const clock = createClock()
export const staff = makePeople(SEED)
export const seedOrders: Order[] = makeOrders(36, staff)

export const api = createApi({ seed: SEED, clock, people: staff, orders: seedOrders })

/**
 * 当前登录的人：销售经理。他既能建单又能提交，但**不能审批自己的单据**——
 * 示例要能演出这条 403，所以默认身份必须是「会撞上它」的那个人。
 */
export const session: Session = { personId: staff[0].id, roles: ['sales', 'approver'] }

export const personName = (id: string) => staff.find((p) => p.id === id)?.name ?? id

export const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  approving: '审批中',
  approved: '已通过',
  rejected: '已退回',
  shipped: '已发货',
  closed: '已关闭',
  cancelled: '已取消'
}

export const STATUS_TONE: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  submitted: 'brand',
  approving: 'warning',
  approved: 'success',
  rejected: 'danger',
  shipped: 'brand',
  closed: 'default',
  cancelled: 'default'
}

/** 金额（分）→ 人民币。整数存钱，显示时才除——浮点相加会在第三张单上凑出 1 分的差 */
export const money = (cents: number) =>
  `¥ ${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
