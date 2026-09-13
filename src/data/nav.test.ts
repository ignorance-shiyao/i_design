/**
 * 导航顺序的回归测试。
 *
 * 「上一页 / 下一页」看着简单，错了却很难发现：跨组的接缝、首尾两端、
 * 以及导航里根本没有的路径，这三处都是点下去才知道不对。
 */
import { describe, expect, it } from 'vitest'
import { docNav, docNeighbours, flatNav } from './nav'

describe('文档导航的上一页 / 下一页', () => {
  it('压平后的条数等于各组条数之和，且顺序与侧栏一致', () => {
    expect(flatNav.length).toBe(docNav.reduce((sum, g) => sum + g.items.length, 0))
    expect(flatNav[0].to).toBe(docNav[0].items[0].to)
    expect(flatNav[0].group).toBe(docNav[0].title)
  })

  it('跨组也连着走：一组的最后一页接下一组的第一页', () => {
    // 按组切断的话，读到组尾会突然没有下一页，而侧栏里明明还有内容
    const firstGroup = docNav[0]
    const lastOfFirst = firstGroup.items[firstGroup.items.length - 1]
    const { next } = docNeighbours(lastOfFirst.to)
    expect(next?.to).toBe(docNav[1].items[0].to)
    expect(next?.group).toBe(docNav[1].title)
  })

  it('到头就没有，不绕回另一端', () => {
    // 从最后一页跳回第一页不是「下一页」，读者按下去只会以为自己点错了
    expect(docNeighbours(flatNav[0].to).prev).toBeNull()
    expect(docNeighbours(flatNav[flatNav.length - 1].to).next).toBeNull()
  })

  it('不在导航里的路径两边都没有，调用方据此整块不渲染', () => {
    expect(docNeighbours('/')).toEqual({ prev: null, next: null })
    expect(docNeighbours('/不存在')).toEqual({ prev: null, next: null })
  })

  it('每一项都带着自己的分组名，供上一页 / 下一页显示层级', () => {
    expect(flatNav.every((item) => item.group.length > 0)).toBe(true)
  })
})
