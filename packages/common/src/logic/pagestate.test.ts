/**
 * 页面状态判定的回归测试。
 *
 * 判定顺序是这一层唯一的复杂度，所以测的全是「两种状态同时成立时该显示哪个」。
 */
import { describe, expect, it } from 'vitest'
import { pageState } from './pagestate'

describe('页面状态', () => {
  it('断网时先说没网——其余每一种在断网时都会同时成立', () => {
    const state = pageState({ online: false, error: { code: 500 }, loading: true, loaded: 3 })
    expect(state.kind).toBe('offline')
    expect(state.keepsContent).toBe(true)
    expect(state.action).toBe('go-online')
  })

  it('部分成功不被判成失败——否则界面会把已经成功的那批清空', () => {
    const state = pageState({ loaded: 18, failed: 2, error: { message: '有 2 行没进去' } })
    expect(state.kind).toBe('partial')
    expect(state.keepsContent).toBe(true)
    expect(state.reason).toBe('18 条成功，2 条失败')
  })

  it('一条都没成功时就是失败，不是部分成功', () => {
    expect(pageState({ loaded: 0, failed: 5, error: { message: '全挂了' } }).kind).toBe('failed')
  })

  it('403 单独成一态：它要给的是申请入口，不是重试按钮', () => {
    const state = pageState({ error: { code: 403 } })
    expect(state.kind).toBe('forbidden')
    expect(state.action).toBe('request-access')
  })

  it('失败原因带上错误码，排查时不用再去翻日志', () => {
    expect(pageState({ error: { code: 502, message: '网关错误' } }).reason).toBe('网关错误（502）')
  })

  it('加载中但已有数据时，内容不清空——刷新列表不该先变成一片白', () => {
    expect(pageState({ loading: true, loaded: 20 }).keepsContent).toBe(true)
    expect(pageState({ loading: true, loaded: 0 }).keepsContent).toBe(false)
  })

  it('有数据且超过保鲜期时提示过期，但照常显示', () => {
    const state = pageState({ loaded: 5, fetchedAt: 0, staleAfter: 60_000, now: 5 * 60_000 })
    expect(state.kind).toBe('stale')
    expect(state.keepsContent).toBe(true)
    expect(state.reason).toBe('数据是 5 分钟前的')
  })

  it('什么都正常时是 ready，没有多余的提示', () => {
    const state = pageState({ loaded: 5 })
    expect(state.kind).toBe('ready')
    expect(state.reason).toBe('')
  })
})
