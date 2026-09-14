/**
 * 会话管理的回归测试。
 *
 * 测的全是「用户会当场发现不对」的那几处：撤销之后会话跑位、翻页时列表抖动、
 * 打不开的会话让人一直重试、清空标题变成一行空白。
 */
import { describe, expect, it } from 'vitest'
import {
  accessReasonOf, canOpenSession, pageSessions, removeSession, renameSession,
  sessionTitle, setArchived, undoRemove, visibleSessions, type ChatSession
} from './chatlist'

const at = (day: number) => Date.UTC(2026, 2, day, 3)
const sessions: ChatSession[] = [
  { id: 'a', title: '季度数据核对', updatedAt: at(16) },
  { id: 'b', preview: '帮我比一下这两家供应商的交期', updatedAt: at(15) },
  { id: 'c', title: '常用提示词', updatedAt: at(14), pinned: true },
  { id: 'd', title: '已归档的旧会话', updatedAt: at(10), archived: true },
  { id: 'e', title: '别人分享的', updatedAt: at(13), access: 'forbidden' }
]

describe('会话标题', () => {
  it('清空标题是交还给自动标题，不是留一行空白', () => {
    const renamed = renameSession(sessions, 'a', '   ')
    expect(renamed[0].title).toBeUndefined()
    expect(sessionTitle(renamed[0])).toBe('新会话')
  })

  it('粘贴进来的换行与首尾空白去掉，超长截断', () => {
    const renamed = renameSession(sessions, 'a', '  采购\n 建议  ')
    expect(renamed[0].title).toBe('采购 建议')
    expect(renameSession(sessions, 'a', 'x'.repeat(99))[0].title).toHaveLength(60)
  })
})

describe('归档与视图', () => {
  it('两个视图互不包含', () => {
    expect(visibleSessions(sessions).map((s) => s.id)).toEqual(['a', 'b', 'c', 'e'])
    expect(visibleSessions(sessions, 'archived').map((s) => s.id)).toEqual(['d'])
  })

  it('归档不改动活动时间——它不是一次活动，不该把会话顶到最前', () => {
    const archived = setArchived(sessions, 'a', true)
    expect(archived[0].archived).toBe(true)
    expect(archived[0].updatedAt).toBe(sessions[0].updatedAt)
  })
})

describe('删除与撤销', () => {
  it('撤销把会话放回原处，而不是追加到末尾', () => {
    const { sessions: after, removed } = removeSession(sessions, 'b')
    expect(after.map((s) => s.id)).toEqual(['a', 'c', 'd', 'e'])
    expect(removed?.index).toBe(1)
    expect(undoRemove(after, removed!).map((s) => s.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('删一个不存在的 id 时什么都不发生', () => {
    const { sessions: after, removed } = removeSession(sessions, '不存在')
    expect(after).toBe(sessions)
    expect(removed).toBeNull()
  })

  it('原位置已经不存在时放到末尾，不抛错', () => {
    const { removed } = removeSession(sessions, 'e')
    expect(undoRemove([], removed!).map((s) => s.id)).toEqual(['e'])
  })
})

describe('打不开的会话', () => {
  it('没权限与已失效分开说——都写成「加载失败」会让人一直重试', () => {
    expect(accessReasonOf({ id: 'x', updatedAt: 0, access: 'forbidden' })).toBe('没有这条会话的权限')
    expect(accessReasonOf({ id: 'x', updatedAt: 0, access: 'expired' })).toBe('这条会话已失效')
    expect(accessReasonOf({ id: 'x', updatedAt: 0, access: 'expired', accessReason: '模型已下线' }))
      .toBe('模型已下线')
    expect(accessReasonOf(sessions[0])).toBe('')
    expect(canOpenSession(sessions[0])).toBe(true)
    expect(canOpenSession(sessions[4])).toBe(false)
  })
})

describe('分页', () => {
  const many: ChatSession[] = Array.from({ length: 25 }, (_, i) => ({
    id: `s${String(i).padStart(2, '0')}`,
    title: `会话 ${i}`,
    // 故意让一半的会话时间完全相同：排序不稳定的话，翻页时它们会来回换位
    updatedAt: at(10) + (i % 2 === 0 ? 0 : 1000)
  }))

  it('时间相同的会话顺序稳定，翻页不抖', () => {
    const first = pageSessions(many, 1, 10).items.map((s) => s.id)
    const again = pageSessions(many, 1, 10).items.map((s) => s.id)
    expect(first).toEqual(again)
    // 两页拼起来不重不漏
    const second = pageSessions(many, 2, 10).items.map((s) => s.id)
    expect(new Set([...first, ...second]).size).toBe(20)
  })

  it('页码超出范围时夹回来，不是空页', () => {
    expect(pageSessions(many, 99, 10).page).toBe(3)
    expect(pageSessions(many, 0, 10).page).toBe(1)
    expect(pageSessions(many, 1, 10).pageCount).toBe(3)
    expect(pageSessions([], 1, 10)).toMatchObject({ page: 1, pageCount: 1, total: 0 })
  })
})
