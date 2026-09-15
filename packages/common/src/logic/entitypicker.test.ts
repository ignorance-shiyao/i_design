/**
 * 人员 / 组织 / 资源选择的回归测试。
 *
 * 测的全是「翻页之后还在不在」「为什么点不动」「停用的怎么办」——
 * 判错的代价是旧单据上的负责人变成一个空格，或者用户被自己选满的十个人锁死。
 */
import { describe, expect, it } from 'vitest'
import {
  inactiveChosen,
  offPageChosen,
  pickerHint,
  pickerRows,
  pickerSummary,
  removePick,
  togglePick
} from './entitypicker'

const page = [
  { id: 'p1', label: '张三', hint: '销售一部' },
  { id: 'p2', label: '李四', hint: '销售二部', blockedReason: '没有该部门的查看权限' },
  { id: 'p3', label: '王五', hint: '已离职', inactive: true }
]

describe('每一行能不能点', () => {
  it('没权限的不可选，但留在列表里说清原因', () => {
    // 过滤掉的话，用户会一直搜一直搜，怀疑是自己名字打错了
    const rows = pickerRows({ page, chosen: [] })
    expect(rows.map((r) => r.id)).toEqual(['p1', 'p2', 'p3'])
    expect(rows[1].disabled).toBe(true)
    expect(rows[1].reason).toBe('没有该部门的查看权限')
  })

  it('停用的不能新选，理由与没权限不是同一句', () => {
    const rows = pickerRows({ page, chosen: [] })
    expect(rows[2].disabled).toBe(true)
    expect(rows[2].reason).toContain('已停用')
  })

  it('已经选上的永远可以点——否则选满之后连取消都点不动', () => {
    const chosen = [{ id: 'p3', label: '王五', inactive: true }]
    const rows = pickerRows({ page, chosen, multiple: true, max: 1 })
    const p3 = rows.find((r) => r.id === 'p3')!
    expect(p3.selected).toBe(true)
    expect(p3.disabled).toBe(false)
  })

  it('到上限之后其余项不可选，理由是上限本身', () => {
    const rows = pickerRows({ page, chosen: [{ id: 'p9', label: '赵六' }], multiple: true, max: 1 })
    expect(rows[0].disabled).toBe(true)
    expect(rows[0].reason).toBe('最多选 1 个')
  })

  it('没权限压过上限：先说那条改了上限也没用的', () => {
    const rows = pickerRows({ page, chosen: [{ id: 'p9', label: '赵六' }], multiple: true, max: 1 })
    expect(rows[1].reason).toBe('没有该部门的查看权限')
  })
})

describe('点一下之后', () => {
  it('多选是追加，且按先后保持顺序——重排会让人以为自己点错了', () => {
    const first = togglePick({ page, chosen: [], multiple: true }, 'p1')
    const second = togglePick({ page, chosen: first, multiple: true }, 'p3')
    // p3 停用，不能新选
    expect(second.map((c) => c.id)).toEqual(['p1'])
  })

  it('单选是替换，不是追加', () => {
    const next = togglePick({ page, chosen: [{ id: 'p9', label: '赵六' }] }, 'p1')
    expect(next.map((c) => c.id)).toEqual(['p1'])
  })

  it('再点一次就是取消选择', () => {
    const chosen = [{ id: 'p1', label: '张三', hint: '销售一部' }]
    expect(togglePick({ page, chosen, multiple: true }, 'p1')).toEqual([])
  })

  it('点不动的项点了也不变', () => {
    expect(togglePick({ page, chosen: [], multiple: true }, 'p2')).toEqual([])
  })

  it('存的是完整对象而不是 id——不然翻页之后只剩一串编号', () => {
    const next = togglePick({ page, chosen: [], multiple: true }, 'p1')
    expect(next[0]).toMatchObject({ id: 'p1', label: '张三', hint: '销售一部' })
  })

  it('移除不经过当前页：要移除的那个多半已经不在这一页了', () => {
    const chosen = [{ id: 'zz', label: '不在本页的人' }]
    expect(removePick(chosen, 'zz')).toEqual([])
  })
})

describe('翻页之后', () => {
  it('已选里不在当前页的那些要单独拿出来显示', () => {
    // 数据没丢，是看不见了——这正是「分页选择丢失」最常见的表现
    const chosen = [{ id: 'p1', label: '张三' }, { id: 'zz', label: '远处的人' }]
    expect(offPageChosen(chosen, page).map((c) => c.label)).toEqual(['远处的人'])
  })

  it('整页都不在已选里时，全部都要额外显示', () => {
    const chosen = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
    expect(offPageChosen(chosen, page)).toHaveLength(2)
  })
})

describe('摘要', () => {
  it('有上限时把上限一起写出来，那句话本身就是解释', () => {
    const s = pickerSummary([{ id: 'a', label: 'A' }], 3, '人')
    expect(s.text).toBe('已选 1 / 3 人')
    expect(s.full).toBe(false)
  })

  it('没有上限就只说选了几个', () => {
    expect(pickerSummary([{ id: 'a', label: 'A' }]).text).toBe('已选 1 项')
  })

  it('已选里含停用项时提醒一句，但不叫人去移除', () => {
    // 历史记录里的停用项本来就该留着
    const s = pickerSummary([{ id: 'p3', label: '王五', inactive: true }], undefined, '人')
    expect(s.notice).toContain('已停用')
    expect(s.notice).not.toContain('移除')
    expect(inactiveChosen([{ id: 'p3', label: '王五', inactive: true }])).toHaveLength(1)
  })

  it('没有停用项时不说话', () => {
    expect(pickerSummary([{ id: 'a', label: 'A' }]).notice).toBe('')
  })
})

describe('检索框的提示', () => {
  it('还没开始搜与搜不到是两件事——说成一句会让人以为库里没人', () => {
    expect(pickerHint('', false, 0)).toContain('开始检索')
    expect(pickerHint('张', false, 0)).toContain('没有匹配')
  })

  it('检索中优先说检索中', () => {
    expect(pickerHint('张', true, 0)).toBe('检索中…')
  })

  it('有结果时不占地方', () => {
    expect(pickerHint('张', false, 3)).toBe('')
  })
})
