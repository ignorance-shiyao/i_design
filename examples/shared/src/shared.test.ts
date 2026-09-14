/**
 * 共用层的回归测试。
 *
 * 盯的是「示例应用最容易骗过自己」的几件事：随机不确定、重复提交开出两张单、
 * 版本冲突被静默覆盖、重置之后还剩半份旧数据、旧代码把新 schema 覆盖掉。
 */
import { describe, expect, it } from 'vitest'
import { createRng, seedFrom } from './rng'
import { createClock, DAY, DEMO_NOW } from './clock'
import { order, orderAmount, orderId, orders, people } from './entities'
import { ApiError, canTransition, createApi, ORDER_TRANSITIONS } from './api'
import { createStore, memoryStorage } from './store'

const staff = people(7)
const session = { personId: 'p-002', roles: ['approver'] as const }

function api(fault?: Parameters<typeof createApi>[0]['fault']) {
  const clock = createClock()
  return createApi({ seed: 7, clock, people: staff, orders: orders(30, staff), fault })
}

describe('确定性随机', () => {
  it('同一个 seed 给出同一串数', () => {
    const a = Array.from({ length: 8 }, () => createRng(42).next())
    const b = Array.from({ length: 8 }, () => createRng(42).next())
    expect(a).toEqual(b)
    expect(new Set(Array.from({ length: 8 }, (_, i) => createRng(i).next())).size).toBe(8)
  })

  it('由单号派生的实体每次算出来都一样，不必整棵树生成出来存着', () => {
    expect(order(6, staff)).toEqual(order(6, staff))
    expect(orderId(6)).toBe('SO-2026-0007')
    expect(seedFrom('SO-2026-0007')).toBe(seedFrom('SO-2026-0007'))
  })

  it('洗牌不改原数组', () => {
    const source = [1, 2, 3, 4, 5]
    const shuffled = createRng(3).shuffle(source)
    expect(source).toEqual([1, 2, 3, 4, 5])
    expect([...shuffled].sort()).toEqual(source)
  })
})

describe('可控时钟', () => {
  it('默认停住，推进之后能回到基准', () => {
    const clock = createClock()
    expect(clock.now()).toBe(DEMO_NOW)
    expect(clock.now()).toBe(DEMO_NOW)
    clock.advance(3 * DAY)
    expect(clock.now()).toBe(DEMO_NOW + 3 * DAY)
    clock.reset()
    expect(clock.now()).toBe(DEMO_NOW)
  })
})

describe('订单状态机', () => {
  it('终态没有出边', () => {
    expect(ORDER_TRANSITIONS.closed).toEqual([])
    expect(ORDER_TRANSITIONS.cancelled).toEqual([])
  })

  it('跳过中间态的迁移不被允许', () => {
    expect(canTransition('draft', 'submitted')).toBe(true)
    expect(canTransition('draft', 'approved')).toBe(false)
    expect(canTransition('shipped', 'draft')).toBe(false)
  })
})

describe('mock API', () => {
  it('金额永远从明细算', () => {
    const one = order(1, staff)
    expect(orderAmount(one)).toBe(one.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))
  })

  it('列表分页与排序稳定：同样的查询两次结果一致', () => {
    const client = api()
    const first = client.listOrders({ page: 1, pageSize: 5 })
    const again = client.listOrders({ page: 1, pageSize: 5 })
    expect(first.items.map((o) => o.id)).toEqual(again.items.map((o) => o.id))
    expect(first.total).toBe(30)
  })

  it('带幂等键的重复提交返回同一张单，不会开出两张', () => {
    const client = api()
    const draft = { customer: '明远制造', ownerId: 'p-001', lines: [{ sku: 'HX-1001', name: '工业网关 A1', quantity: 2, unitPrice: 12800 }] }
    const a = client.createOrder(draft, 'key-1')
    const b = client.createOrder(draft, 'key-1')
    expect(b.deduplicated).toBe(true)
    expect(b.order.id).toBe(a.order.id)
    expect(client.listOrders().total).toBe(31)
  })

  it('明细为空的单据提交不进去', () => {
    const client = api()
    expect(() => client.createOrder({ customer: 'x', ownerId: 'p-001', lines: [] }, 'k'))
      .toThrow(/至少要有一条明细/)
  })

  it('详情页停留期间别人改过，再提交是 409 而不是覆盖', () => {
    const client = api()
    const admin = { personId: 'p-009', roles: ['admin'] as const }
    const { order: target } = client.getOrder('SO-2026-0001')
    // 甲拿到 v1 的详情；乙先改了一次，单据变成 v2
    const moved = client.updateStatus(target.id, nextFrom(target.status), target.revision, admin)
    expect(moved.order.revision).toBe(target.revision + 1)
    // 甲这时按自己看到的 v1 提交，必须被挡住，而不是把乙的改动盖掉
    expect(() => client.updateStatus(target.id, nextFrom(moved.order.status), target.revision, admin))
      .toThrow(/已经被改过/)
  })

  it('申请人不能审批自己提交的单据', () => {
    const client = api()
    const mine = [...client.listOrders({ status: 'approving' }).items][0]
    expect(mine, '演示数据里应当有处于审批中的单据').toBeTruthy()
    expect(() => client.updateStatus(mine.id, 'approved', mine.revision, { personId: mine.ownerId, roles: ['approver'] }))
      .toThrow(/不能审批自己/)
    // 换个人就能批
    const other = staff.find((p) => p.id !== mine.ownerId)!
    expect(client.updateStatus(mine.id, 'approved', mine.revision, { personId: other.id, roles: ['approver'] }).order.status)
      .toBe('approved')
  })

  it('没有审批角色时是 403，而且带 traceId', () => {
    const client = api()
    const mine = client.listOrders({ status: 'approving' }).items[0]
    try {
      client.updateStatus(mine.id, 'approved', mine.revision, { personId: 'p-012', roles: ['sales'] })
      throw new Error('应当抛错')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).code).toBe(403)
      expect((error as ApiError).traceId).toMatch(/^t-/)
    }
  })

  it('注入的异常每一种都能稳定复现', () => {
    for (const [fault, code] of [['forbidden', 403], ['conflict', 409], ['rate-limit', 429], ['timeout', 408]] as const) {
      const client = api(fault)
      expect(() => client.listOrders()).toThrow(ApiError)
      try { client.listOrders() } catch (error) { expect((error as ApiError).code).toBe(code) }
    }
  })

  it('部分失败要说得清哪几行失败', () => {
    const client = api('partial')
    const rows = Array.from({ length: 10 }, (_, i) => ({ customer: `客户${i}`, ownerId: 'p-001' }))
    const result = client.importOrders(rows)
    expect(result.accepted + result.failures.length).toBe(10)
    expect(result.failures.length).toBeGreaterThan(0)
    for (const failure of result.failures) expect(failure.reason).toBeTruthy()
  })

  it('重置之后不留半份旧数据', () => {
    const client = api()
    client.createOrder({ customer: '新客户', ownerId: 'p-001', lines: [{ sku: 'x', name: 'x', quantity: 1, unitPrice: 1 }] }, 'k')
    expect(client.listOrders().total).toBe(31)
    client.reset()
    expect(client.listOrders().total).toBe(30)
    // 幂等记录也要清掉，否则同一个键还会命中上一轮的结果
    const again = client.createOrder({ customer: '新客户', ownerId: 'p-001', lines: [{ sku: 'x', name: 'x', quantity: 1, unitPrice: 1 }] }, 'k')
    expect(again.deduplicated).toBe(false)
  })

  it('延迟由 seed 决定，同一个请求每次一样', () => {
    const client = api()
    expect(client.latencyOf('orders:1')).toBe(client.latencyOf('orders:1'))
  })
})

/** 取当前状态的第一条合法出边，用来构造「被人改过」的场景 */
function nextFrom(status: Parameters<typeof canTransition>[0]) {
  return ORDER_TRANSITIONS[status][0] ?? 'cancelled'
}

describe('版本化本地存储', () => {
  const options = { key: 'i-design:example', version: 2, storage: memoryStorage() }

  it('刷新恢复：存进去的读得回来', () => {
    const store = createStore<{ tab: string }>({ ...options, storage: memoryStorage() })
    expect(store.load().status).toBe('empty')
    store.save({ tab: 'orders' })
    expect(store.load()).toEqual({ status: 'ok', data: { tab: 'orders' } })
  })

  it('旧版本数据走迁移', () => {
    const storage = memoryStorage()
    storage.setItem(options.key, JSON.stringify({ version: 1, data: { activeTab: 'orders' } }))
    const store = createStore<{ tab: string }>({
      ...options,
      storage,
      migrate: (data, from) => (from === 1 ? { tab: (data as { activeTab: string }).activeTab } : null)
    })
    expect(store.load()).toEqual({ status: 'ok', data: { tab: 'orders' }, migratedFrom: 1 })
  })

  it('没有迁移路径时明确丢弃，不是炸在某个字段上', () => {
    const storage = memoryStorage()
    storage.setItem(options.key, JSON.stringify({ version: 1, data: {} }))
    expect(createStore({ ...options, storage }).load()).toEqual({ status: 'broken', reason: '没有从 v1 到 v2 的迁移' })
  })

  it('读到更新的 schema 时拒绝，而不是静默覆盖', () => {
    const storage = memoryStorage()
    storage.setItem(options.key, JSON.stringify({ version: 9, data: { 半填的: true } }))
    const store = createStore({ ...options, storage })
    expect(store.load()).toEqual({ status: 'too-new', found: 9, expected: 2 })
    // 关键在于：拒绝之后原数据还在，由调用方决定是重置还是提示升级
    expect(storage.getItem(options.key)).toContain('"version":9')
  })

  it('坏掉的 JSON 与缺版本号都能说清原因', () => {
    const storage = memoryStorage()
    storage.setItem(options.key, '{ 不是 JSON')
    expect(createStore({ ...options, storage }).load()).toEqual({ status: 'broken', reason: '不是合法的 JSON' })
    storage.setItem(options.key, JSON.stringify({ data: {} }))
    expect(createStore({ ...options, storage }).load()).toEqual({ status: 'broken', reason: '缺少版本号' })
  })

  it('重置把键一起删掉', () => {
    const storage = memoryStorage()
    const store = createStore<{ tab: string }>({ ...options, storage })
    store.save({ tab: 'orders' })
    store.reset()
    expect(storage.getItem(options.key)).toBeNull()
    expect(store.load().status).toBe('empty')
  })
})
