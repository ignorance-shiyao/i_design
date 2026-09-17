import { describe, expect, it } from 'vitest'
import {
  aggregateField,
  allRows,
  bodyCellSpans,
  buildHeaderLayout,
  expandAll,
  flattenRows,
  grandTotal,
  groupSummary,
  leafRows,
  pruneSelection,
  renderRows,
  rowSelectable,
  selectAllState,
  selectionSummary,
  sortTree,
  summaryLabel,
  toggleExpanded,
  toggleRow,
  toggleSelectAll,
  type TreeRow
} from './treetable'

/* 两个分组、四条明细。金额故意让「子行更大」，好验出排序没有打平层级 */
const rows: TreeRow[] = [
  {
    key: 'g1',
    name: '华东',
    amount: 300,
    children: [
      { key: 'a', name: '明远制造', amount: 100 },
      { key: 'b', name: '合力重工', amount: 200 }
    ]
  },
  {
    key: 'g2',
    name: '华北',
    amount: 500,
    children: [
      { key: 'c', name: '远大科技', amount: 500 },
      { key: 'd', name: '未填金额的那条', selectableReason: '没有该客户的查看权限' }
    ]
  }
]

describe('排序只在兄弟之间排', () => {
  it('子行不会跑到别人家下面去', () => {
    const sorted = sortTree(rows, 'amount', 'desc')
    expect(sorted.map((r) => r.key)).toEqual(['g2', 'g1'])
    // 华北的两条还在华北下面，而且它们自己也排了
    expect(sorted[0].children?.map((r) => r.key)).toEqual(['c', 'd'])
    expect(sorted[1].children?.map((r) => r.key)).toEqual(['b', 'a'])
  })

  it('不排序时原样返回', () => {
    expect(sortTree(rows, null, 'asc').map((r) => r.key)).toEqual(['g1', 'g2'])
  })
})

describe('折叠', () => {
  it('折叠的分支整段不出现', () => {
    expect(flattenRows(rows, []).map((r) => r.key)).toEqual(['g1', 'g2'])
    expect(flattenRows(rows, ['g1']).map((r) => r.key)).toEqual(['g1', 'a', 'b', 'g2'])
  })

  it('层级与「有没有子行」跟着出来', () => {
    const flat = flattenRows(rows, ['g1'])
    expect(flat[0]).toMatchObject({ level: 0, hasChildren: true, expanded: true })
    expect(flat[1]).toMatchObject({ level: 1, hasChildren: false, parentKey: 'g1' })
  })

  it('toggle 只动这一个 key', () => {
    expect([...toggleExpanded(['g1'], 'g2')].sort()).toEqual(['g1', 'g2'])
    expect([...toggleExpanded(['g1', 'g2'], 'g1')]).toEqual(['g2'])
  })

  it('展开全部只收有子行的那些', () => {
    expect([...expandAll(rows)].sort()).toEqual(['g1', 'g2'])
  })
})

describe('折叠不丢选择，但要数出来', () => {
  it('收起分组之后选择还在，并且说清有几项看不见', () => {
    const selected = ['a', 'b', 'g2']
    const open = selectionSummary(selected, flattenRows(rows, ['g1', 'g2']))
    expect(open.text).toBe('已选 3 项')
    expect(open.hidden).toBe(0)

    // 收起华东：a、b 还选着，但屏幕上已经看不见了
    const folded = selectionSummary(selected, flattenRows(rows, ['g2']))
    expect(folded.total).toBe(3)
    expect(folded.hidden).toBe(2)
    expect(folded.text).toBe('已选 3 项，其中 2 项在收起的分组里')
  })

  it('一项没选时说的是「未选择任何行」，不是「已选 0 项」', () => {
    expect(selectionSummary([], flattenRows(rows, [])).text).toBe('未选择任何行')
  })
})

describe('表头复选框', () => {
  it('口径是整棵树，不随折叠变化', () => {
    const all = toggleSelectAll(rows, [])
    // 没权限的那条不在里面
    expect([...all].sort()).toEqual(['a', 'b', 'c', 'g1', 'g2'])
    expect(selectAllState(rows, all)).toBe('all')
    // 全都收起来，表头还是「全选」——折叠没有改变选择
    expect(selectionSummary(all, flattenRows(rows, [])).hidden).toBe(3)
    expect(selectAllState(rows, all)).toBe('all')
  })

  it('再点一次清空', () => {
    const all = toggleSelectAll(rows, [])
    expect(toggleSelectAll(rows, all).size).toBe(0)
  })

  it('部分选中是 some', () => {
    expect(selectAllState(rows, ['a'])).toBe('some')
    expect(selectAllState(rows, [])).toBe('none')
  })
})

describe('勾选单行', () => {
  it('父行与子行各选各的，不联动', () => {
    const next = toggleRow(rows, [], 'g1')
    expect([...next]).toEqual(['g1'])
  })

  it('不可选的行点不动，理由是给用户看的', () => {
    expect(rowSelectable(rows[1].children![1])).toBe(false)
    expect(toggleRow(rows, [], 'd').size).toBe(0)
  })

  it('数据换了才摘掉已经不存在的 key', () => {
    expect([...pruneSelection(rows, ['a', '已经不在了'])]).toEqual(['a'])
  })
})

describe('汇总', () => {
  it('按叶子算，父行自己那份金额不会被加两遍', () => {
    expect(leafRows(rows).map((r) => r.key)).toEqual(['a', 'b', 'c', 'd'])
    expect(allRows(rows)).toHaveLength(6)
    expect(grandTotal(rows, [{ field: 'amount', kind: 'sum' }]).values.amount).toBe(800)
  })

  it('折叠不改变汇总', () => {
    const spec = [{ field: 'amount', kind: 'sum' as const }]
    expect(groupSummary(rows[0], spec).values.amount).toBe(300)
    // 视图状态与这个分组一共多少钱无关，折叠时这里依然是 300
    expect(groupSummary(rows[0], spec).count).toBe(2)
  })

  it('空值不参与平均，也不当成 0', () => {
    const avg = groupSummary(rows[1], [{ field: 'amount', kind: 'avg' }])
    // 华北只有一条填了金额：平均是 500，不是 250
    expect(avg.values.amount).toBe(500)
    expect(avg.count).toBe(2)
  })

  it('count 数的是行数，不是有值的个数', () => {
    expect(aggregateField(rows[1].children!, { field: 'amount', kind: 'count' })).toBe(2)
  })

  it('一条都没填时给 null，不给 0', () => {
    const empty: TreeRow[] = [{ key: 'x' }, { key: 'y' }]
    expect(aggregateField(empty, { field: 'amount', kind: 'sum' })).toBeNull()
    expect(aggregateField(empty, { field: 'amount', kind: 'min' })).toBeNull()
  })

  it('min / max 取的是填了的那些', () => {
    expect(aggregateField(leafRows(rows), { field: 'amount', kind: 'min' })).toBe(100)
    expect(aggregateField(leafRows(rows), { field: 'amount', kind: 'max' })).toBe(500)
  })

  it('汇总行明写算了几条明细', () => {
    expect(summaryLabel(groupSummary(rows[0], []))).toBe('小计（2 条明细）')
    expect(summaryLabel(grandTotal(rows, []), '合计')).toBe('合计（4 条明细）')
  })
})

describe('小计摆在哪儿', () => {
  it('跟在这个分组最后一条子行之后，不是紧跟在标题下面', () => {
    const seq = renderRows(rows, ['g1', 'g2']).map((entry) =>
      entry.kind === 'row' ? entry.row.key : `小计:${entry.groupKey}`
    )
    expect(seq).toEqual(['g1', 'a', 'b', '小计:g1', 'g2', 'c', 'd', '小计:g2'])
  })

  it('收起的分组不出小计：那一行自己就代表它', () => {
    const seq = renderRows(rows, ['g1']).map((entry) =>
      entry.kind === 'row' ? entry.row.key : `小计:${entry.groupKey}`
    )
    expect(seq).toEqual(['g1', 'a', 'b', '小计:g1', 'g2'])
  })

  it('不要小计时与 flattenRows 等价', () => {
    expect(renderRows(rows, ['g1'], false).map((e) => (e.kind === 'row' ? e.row.key : ''))).toEqual(
      flattenRows(rows, ['g1']).map((r) => r.key)
    )
  })
})

describe('多级表头', () => {
  it('分组列横跨全部叶子列，叶子列补满剩余表头高度', () => {
    const layout = buildHeaderLayout([
      { title: '客户', key: 'name' },
      {
        title: '经营数据',
        children: [
          { title: '本月', children: [{ title: '金额', key: 'amount' }, { title: '数量', key: 'count' }] },
          { title: '同比', key: 'growth' }
        ]
      }
    ])
    expect(layout.depth).toBe(3)
    expect(layout.rows.map((row) => row.map((cell) => [cell.column.title, cell.colSpan, cell.rowSpan]))).toEqual([
      [['客户', 1, 3], ['经营数据', 3, 1]],
      [['本月', 2, 1], ['同比', 1, 2]],
      [['金额', 1, 1], ['数量', 1, 1]]
    ])
    expect(layout.leaves.map((column) => column.key)).toEqual(['name', 'amount', 'count', 'growth'])
  })
})

describe('合并单元格只认排序后的连续同级行', () => {
  const mergeColumns = [
    { key: 'name', title: '客户' },
    { key: 'owner', title: '负责人', merge: 'vertical' as const }
  ]
  const mergeRows: TreeRow[] = [
    { key: 'g', name: '华东', children: [
      { key: 'a', name: '甲', owner: '林岚', amount: 1 },
      { key: 'b', name: '乙', owner: '林岚', amount: 3 },
      { key: 'c', name: '丙', owner: '沈野', amount: 2 }
    ] }
  ]

  it('连续相同值只渲染一个锚点，后面的格子为 0', () => {
    const spans = bodyCellSpans(renderRows(mergeRows, ['g']), mergeColumns)
    expect(spans.get('a:owner')).toEqual({ rowSpan: 2 })
    expect(spans.get('b:owner')).toEqual({ rowSpan: 0 })
    expect(spans.get('c:owner')).toEqual({ rowSpan: 1 })
    // 父行与子行即使同值也不能跨层合并
    expect(spans.get('g:owner')).toEqual({ rowSpan: 1 })
  })

  it('排序把同值行打散后，合并随当前顺序断开，不再声称它们是一组', () => {
    const sorted = sortTree(mergeRows, 'amount', 'asc')
    const spans = bodyCellSpans(renderRows(sorted, ['g']), mergeColumns)
    expect(spans.get('a:owner')).toEqual({ rowSpan: 1 })
    expect(spans.get('b:owner')).toEqual({ rowSpan: 1 })
  })
})
