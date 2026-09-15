import { describe, expect, it } from 'vitest'
import {
  commandEntries,
  dedupeNotices,
  firstRunnable,
  isActive,
  markAllSeen,
  markSeen,
  submitTask,
  taskBadge,
  taskNotice,
  taskOrder,
  taskTrail,
  type AsyncTaskItem,
  type GuardedCommand
} from './taskcenter'

const at = (n: number) => 1_700_000_000_000 + n * 1000

const task = (over: Partial<AsyncTaskItem> & Pick<AsyncTaskItem, 'id' | 'state'>): AsyncTaskItem => ({
  title: '导出销售订单',
  createdAt: at(0),
  ...over
})

describe('排序', () => {
  it('进行中在最上面，失败紧随其后，其余按结束时间倒序', () => {
    const tasks = [
      task({ id: 'T3', state: 'succeeded', createdAt: at(1), finishedAt: at(9) }),
      task({ id: 'T1', state: 'running', createdAt: at(5) }),
      task({ id: 'T4', state: 'succeeded', createdAt: at(0), finishedAt: at(20) }),
      task({ id: 'T2', state: 'failed', createdAt: at(2), finishedAt: at(3) }),
      task({ id: 'T0', state: 'queued', createdAt: at(4) })
    ]
    expect(taskOrder(tasks).map((t) => t.id)).toEqual(['T0', 'T1', 'T2', 'T4', 'T3'])
  })

  it('已经结束的任务不会因为别人完成而换位置', () => {
    const settled = [
      task({ id: 'A', state: 'succeeded', finishedAt: at(10) }),
      task({ id: 'B', state: 'succeeded', finishedAt: at(20) })
    ]
    const before = taskOrder(settled).map((t) => t.id)
    // 新来一条进行中的：它排到最前面，但 A、B 的相对位置一动不动
    const after = taskOrder([...settled, task({ id: 'C', state: 'running' })]).map((t) => t.id)
    expect(after).toEqual(['C', ...before])
  })
})

describe('角标', () => {
  it('数的是要人处理的，进行中的不算', () => {
    const badge = taskBadge([
      task({ id: 'A', state: 'running' }),
      task({ id: 'B', state: 'running' }),
      task({ id: 'C', state: 'failed' }),
      task({ id: 'D', state: 'succeeded' }),
      task({ id: 'E', state: 'succeeded', seen: true })
    ])
    // 2 条进行中不进角标，否则这个数字永远回不到零
    expect(badge.count).toBe(2)
    expect(badge.running).toBe(2)
    expect(badge.text).toBe('任务中心：1 条失败，1 条已完成待查看，2 条进行中')
  })

  it('没有待处理时说的是「没有待处理的任务」', () => {
    expect(taskBadge([]).text).toBe('任务中心：没有待处理的任务')
    expect(taskBadge([]).count).toBe(0)
  })

  it('看过之后角标降下来，但进行中的不受影响', () => {
    const tasks = [task({ id: 'A', state: 'succeeded' }), task({ id: 'B', state: 'running' })]
    expect(taskBadge(markSeen(tasks, 'A')).count).toBe(0)
    // 进行中的标不了「看过」：它还没有结果可看
    expect(markSeen(tasks, 'B')[1].seen).toBeUndefined()
    expect(markAllSeen(tasks).map((t) => !!t.seen)).toEqual([true, false])
  })
})

describe('通知必须定位得到业务对象', () => {
  const target = { kind: '订单', id: 'SO-1', label: 'SO-2026-0912' }

  it('有业务对象就直奔那张单', () => {
    const notice = taskNotice(
      task({ id: 'T1', state: 'succeeded', finishedAt: at(1), target, result: '导出 48000 行' })
    )!
    expect(notice.title).toBe('导出销售订单完成')
    expect(notice.description).toBe('订单「SO-2026-0912」：导出 48000 行')
    expect(notice.actionLabel).toBe('查看订单')
    expect(notice.target).toEqual(target)
  })

  it('没有业务对象也不许只说「完成了」：给任务号与任务详情', () => {
    const notice = taskNotice(task({ id: 'T9', state: 'succeeded', finishedAt: at(1) }))!
    expect(notice.description).toContain('T9')
    expect(notice.actionLabel).toBe('查看任务详情')
    expect(notice.target).toBeNull()
  })

  it('失败时给的是那句人话，不是「未知」两个字以外的堆栈', () => {
    const notice = taskNotice(task({ id: 'T2', state: 'failed', target, error: '第 12 行客户为空' }))!
    expect(notice.tone).toBe('danger')
    expect(notice.description).toBe('订单「SO-2026-0912」：第 12 行客户为空')
    const blank = taskNotice(task({ id: 'T3', state: 'failed', error: '   ' }))!
    expect(blank.description).toContain('未知原因')
  })

  it('进行中的不发通知：每动一下弹一条，用户会把通知区整个关掉', () => {
    expect(taskNotice(task({ id: 'T4', state: 'running' }))).toBeNull()
    expect(taskNotice(task({ id: 'T5', state: 'queued' }))).toBeNull()
    expect(isActive(task({ id: 'T6', state: 'queued' }))).toBe(true)
  })

  it('取消明说「没有发生变化」', () => {
    expect(taskNotice(task({ id: 'T7', state: 'cancelled', target }))!.description).toBe(
      '订单「SO-2026-0912」没有发生变化'
    )
  })

  it('同一条任务只留最新的一条通知', () => {
    const a = taskNotice(task({ id: 'T1', state: 'succeeded' }))!
    const b = taskNotice(task({ id: 'T1', state: 'failed', error: '超时' }))!
    const c = taskNotice(task({ id: 'T2', state: 'succeeded' }))!
    expect(dedupeNotices([a, c, b]).map((n) => n.taskId)).toEqual(['T1', 'T2'])
    expect(dedupeNotices([a, c, b])[0].tone).toBe('danger')
  })
})

describe('同一件事正在跑就不再排第二个', () => {
  const running = task({ id: 'T1', state: 'running', dedupeKey: '导出:已发货' })

  it('合并过去，并说清它已经在跑了', () => {
    const result = submitTask([running], task({ id: 'T2', state: 'queued', dedupeKey: '导出:已发货' }))
    expect(result.merged).toBe(true)
    expect(result.taskId).toBe('T1')
    expect(result.tasks).toHaveLength(1)
    expect(result.message).toContain('已经在跑了')
    expect(result.message).toContain('T1')
  })

  it('已经结束的同键任务不拦：改完数据再导一次是正当需求', () => {
    const done = task({ id: 'T1', state: 'succeeded', dedupeKey: '导出:已发货', finishedAt: at(1) })
    const result = submitTask([done], task({ id: 'T2', state: 'queued', dedupeKey: '导出:已发货' }))
    expect(result.merged).toBe(false)
    expect(result.tasks.map((t) => t.id)).toEqual(['T2', 'T1'])
  })

  it('没有去重键就不去重', () => {
    expect(submitTask([running], task({ id: 'T3', state: 'queued' })).merged).toBe(false)
  })
})

describe('追踪行', () => {
  it('任务号排第一：用户打给客服时能报出来的只有它', () => {
    const lines = taskTrail(
      task({
        id: 'T-8842',
        state: 'succeeded',
        actor: '林岚',
        finishedAt: at(60),
        target: { kind: '订单', id: 'SO-1', label: 'SO-2026-0912' }
      }),
      (ms) => `t${(ms - at(0)) / 1000}`
    )
    expect(lines[0]).toBe('任务号：T-8842')
    expect(lines).toContain('提交人：林岚')
    expect(lines).toContain('影响对象：订单「SO-2026-0912」')
    expect(lines).toContain('结束时间：t60')
  })

  it('没结束就没有结束时间那一行', () => {
    expect(taskTrail(task({ id: 'T1', state: 'running' }), () => 'x')).toHaveLength(2)
  })
})

describe('命令受权限约束', () => {
  const commands: GuardedCommand[] = [
    { key: 'export', label: '导出订单', keywords: ['daochu'], permission: 'order:export' },
    { key: 'new', label: '新建订单' },
    { key: 'settings', label: '系统设置', permission: 'admin' }
  ]
  const can = (p: string) => p === 'order:export'

  it('没权限的照常出现，但禁用并写明理由', () => {
    const entries = commandEntries(commands, '', can)
    expect(entries.map((e) => e.command.key)).toEqual(['export', 'new', 'settings'])
    expect(entries[2].disabled).toBe(true)
    expect(entries[2].reason).toBe('当前角色没有这个权限')
    // 搜得到才知道「能，但你这个角色不行」；过滤掉会被当成系统没这个功能
    expect(commandEntries(commands, '设置', can)[0].command.key).toBe('settings')
  })

  it('有权限的不带理由', () => {
    const entry = commandEntries(commands, '导出', can)[0]
    expect(entry.disabled).toBe(false)
    expect(entry.reason).toBe('')
  })

  it('回车执行的是第一条可用的，不是第一条', () => {
    const entries = commandEntries([commands[2], commands[1]], '', can)
    expect(entries[0].disabled).toBe(true)
    expect(firstRunnable(entries)!.command.key).toBe('new')
    expect(firstRunnable(commandEntries([commands[2]], '', can))).toBeNull()
  })
})
