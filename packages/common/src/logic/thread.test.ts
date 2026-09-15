import { describe, expect, it } from 'vitest'
import {
  activitySummary,
  checkMentions,
  DELETED_BODY,
  discardComment,
  editNote,
  failedComments,
  keepDivider,
  readUpTo,
  retryComment,
  threadItems,
  unreadState,
  type ThreadComment,
  type ThreadEntry
} from './thread'

const at = (n: number) => 1_700_000_000_000 + n * 1000

const comment = (
  over: Partial<ThreadComment> & Pick<ThreadComment, 'id' | 'createdAt'>
): ThreadComment => ({
  kind: 'comment',
  authorId: 'u1',
  authorName: '林岚',
  body: '这单先按 8 万走',
  ...over
})

const activity = (id: string, createdAt: number, actorId = 'u1', change = '修改了负责人'): ThreadEntry => ({
  id,
  kind: 'activity',
  actorId,
  actorName: actorId === 'u1' ? '林岚' : '沈黎',
  change,
  createdAt
})

describe('线程结构', () => {
  const entries: ThreadEntry[] = [
    comment({ id: 'c1', createdAt: at(1) }),
    comment({ id: 'c2', createdAt: at(2), parentId: 'c1', authorId: 'u2', authorName: '沈黎', body: '同意' }),
    activity('a1', at(3)),
    activity('a2', at(4), 'u1', '修改了金额'),
    comment({ id: 'c3', createdAt: at(5), authorId: 'u2', authorName: '沈黎' })
  ]

  it('回复挂在父评论下面，活动记录按时间穿插', () => {
    const items = threadItems(entries)
    expect(items.map((i) => i.kind)).toEqual(['comment', 'activity', 'comment'])
    expect(items[0].kind === 'comment' && items[0].node.replies.map((r) => r.comment.id)).toEqual(['c2'])
  })

  it('连续的活动记录折成一组，同一个人说「修改了 N 项」', () => {
    const items = threadItems(entries)
    expect(items[1].kind === 'activity' && items[1].summary).toBe('林岚 修改了 2 项')
  })

  it('几个人一起改的不合并人名：说成一个人做的是在记错账', () => {
    expect(activitySummary([activity('a1', at(1), 'u1') as never, activity('a2', at(2), 'u2') as never])).toBe(
      '2 条变更'
    )
    expect(activitySummary([activity('a1', at(1), 'u1') as never])).toBe('林岚 修改了负责人')
  })
})

describe('删掉的父评论要留一个坑', () => {
  it('有回复就留坑，回复照常挂着', () => {
    const items = threadItems([
      comment({ id: 'c1', createdAt: at(1), deleted: true }),
      comment({ id: 'c2', createdAt: at(2), parentId: 'c1', body: '同意' })
    ])
    expect(items).toHaveLength(1)
    const node = items[0].kind === 'comment' ? items[0].node : null
    expect(node!.tombstone).toBe(true)
    expect(node!.replies.map((r) => r.comment.id)).toEqual(['c2'])
    expect(DELETED_BODY).toBe('该评论已删除')
  })

  it('没有回复就真的消失', () => {
    expect(threadItems([comment({ id: 'c1', createdAt: at(1), deleted: true })])).toHaveLength(0)
  })

  it('回复本身被删且没有下级时也消失，父评论照常在', () => {
    const items = threadItems([
      comment({ id: 'c1', createdAt: at(1) }),
      comment({ id: 'c2', createdAt: at(2), parentId: 'c1', deleted: true })
    ])
    const node = items[0].kind === 'comment' ? items[0].node : null
    expect(node!.tombstone).toBe(false)
    expect(node!.replies).toHaveLength(0)
  })
})

describe('编辑痕迹', () => {
  it('编辑过就看得见', () => {
    expect(editNote(comment({ id: 'c1', createdAt: at(1), editedAt: at(9) }), () => '刚刚')).toBe(
      '已编辑 · 刚刚'
    )
  })

  it('没编辑过不说，删掉的也不说', () => {
    expect(editNote(comment({ id: 'c1', createdAt: at(1) }), () => '刚刚')).toBe('')
    expect(editNote(comment({ id: 'c1', createdAt: at(1), editedAt: at(9), deleted: true }), () => '刚刚')).toBe('')
  })
})

describe('未读定位', () => {
  const entries: ThreadEntry[] = [
    comment({ id: 'c1', createdAt: at(1), authorId: 'u2', authorName: '沈黎' }),
    comment({ id: 'c2', createdAt: at(5), authorId: 'u2', authorName: '沈黎' }),
    comment({ id: 'c3', createdAt: at(6), authorId: 'me', authorName: '我' }),
    activity('a1', at(7), 'u2')
  ]

  it('分隔线钉在第一条未读之前，自己发的不算未读', () => {
    const state = unreadState(entries, at(3), 'me')
    expect(state.count).toBe(2)
    expect(state.dividerId).toBe('c2')
    expect(state.text).toBe('2 条新消息，从这里继续')
  })

  it('全都读过了就说「没有新消息」', () => {
    expect(unreadState(entries, at(99), 'me')).toEqual({
      count: 0,
      dividerId: null,
      text: '没有新消息'
    })
  })

  it('只有自己发的新消息时也算读完了：否则那个角标永远回不到零', () => {
    const mine: ThreadEntry[] = [comment({ id: 'c9', createdAt: at(50), authorId: 'me', authorName: '我' })]
    expect(unreadState(mine, at(3), 'me').count).toBe(0)
  })

  it('新评论进来之后分隔线不动，计数照常涨', () => {
    const first = unreadState(entries, at(3), 'me')
    const grown = [...entries, comment({ id: 'c4', createdAt: at(20), authorId: 'u2', authorName: '沈黎' })]
    const next = keepDivider(first, grown, at(3), 'me')
    // 「又来了一条」该知道，「你读到哪儿了」不该被改写
    expect(next.count).toBe(3)
    expect(next.dividerId).toBe('c2')
  })

  it('分隔线指向的那条被删干净了才重新算', () => {
    const first = unreadState(entries, at(3), 'me')
    const without = entries.filter((e) => e.id !== 'c2')
    expect(keepDivider(first, without, at(3), 'me').dividerId).toBe('a1')
  })

  it('读到哪儿取的是最后一条的时间，不是当前时刻', () => {
    // 拿「现在」会把用户还没滚到的那几条也标成已读
    expect(readUpTo(entries, at(0))).toBe(at(7))
    expect(readUpTo([], at(4))).toBe(at(4))
  })
})

describe('@ 到话题外的人', () => {
  const nameOf = (id: string) => ({ u2: '沈黎', u3: '周其' })[id] ?? id

  it('不拦，但要说清会把 TA 加进来', () => {
    const check = checkMentions(['u2', 'u3'], ['u1', 'u2'], nameOf)
    expect(check.outsiders).toEqual(['u3'])
    expect(check.warning).toBe('周其还不在这个话题里，发出后会把 TA 加进来')
  })

  it('都在里面就不啰嗦', () => {
    expect(checkMentions(['u2'], ['u1', 'u2'], nameOf).warning).toBe('')
  })

  it('同一个人 @ 两次只算一次', () => {
    expect(checkMentions(['u3', 'u3'], ['u1'], nameOf).outsiders).toEqual(['u3'])
  })
})

describe('发失败的评论', () => {
  const entries: ThreadEntry[] = [
    comment({ id: 'c1', createdAt: at(1) }),
    comment({ id: 'c2', createdAt: at(2), body: '三百字的长评', sendState: 'failed', sendError: '' }),
    comment({ id: 'c3', createdAt: at(3), sendState: 'sending' })
  ]

  it('留在原地，带着原文与原因', () => {
    const failed = failedComments(entries)
    expect(failed).toHaveLength(1)
    expect(failed[0].body).toBe('三百字的长评')
    // 原因留空时也要有一句人话，不能只是一个红点
    expect(failed[0].reason).toBe('网络没连上')
  })

  it('重发把那一条改回「发送中」，不新建一条', () => {
    const next = retryComment(entries, 'c2')
    expect(next).toHaveLength(3)
    const target = next.find((e) => e.id === 'c2') as ThreadComment
    expect(target.sendState).toBe('sending')
    expect(target.sendError).toBeUndefined()
    expect(target.body).toBe('三百字的长评')
  })

  it('只有明确放弃才丢掉用户写的字', () => {
    expect(discardComment(entries, 'c2').map((e) => e.id)).toEqual(['c1', 'c3'])
  })
})
