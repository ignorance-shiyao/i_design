import { describe, expect, it } from 'vitest'
import { artifactContentDiff, artifactAdoptableIds, artifactPayload, artifactPreview, artifactVersionDiff, artifactVersions, openArtifact, toggleArtifactAdoption, type ArtifactRevision } from './artifact'

const versions: ArtifactRevision[] = [
  { id: 'plan', kind: 'document', title: '采购建议', version: 1, createdAt: 1, itemIds: ['a', 'b'] },
  { id: 'plan', kind: 'document', title: '采购建议', version: 2, createdAt: 2, itemIds: ['c'] },
  { id: 'other', kind: 'table', title: '库存', version: 1, createdAt: 3 }
]

describe('产物工作区', () => {
  it('新版本在前，但旧版本仍可回看', () => {
    expect(artifactVersions(versions, 'plan').map((item) => item.version)).toEqual([2, 1])
    expect(openArtifact(versions, 'plan', 1).current?.version).toBe(1)
  })

  it('切换版本不会把旧版的采纳项带到新版', () => {
    expect(openArtifact(versions, 'plan', 2, ['a', 'c']).adopted).toEqual(['c'])
  })

  it('采纳可逐项撤销，非法 id 不会混进状态', () => {
    const current = openArtifact(versions, 'plan').current
    expect(toggleArtifactAdoption(current, [], 'c')).toEqual(['c'])
    expect(toggleArtifactAdoption(current, ['c'], 'c')).toEqual([])
    expect(toggleArtifactAdoption(current, [], 'not-exist')).toEqual([])
  })

  it('未拆项的产物按版本整体采纳', () => {
    expect(artifactAdoptableIds(versions[2])).toEqual(['other@1'])
    expect(openArtifact(versions, 'other', 1, ['other@1']).adopted).toEqual(['other@1'])
  })

  it('文档与代码永远是不可执行的纯文本预览', () => {
    expect(artifactPreview({ ...versions[0], kind: 'code' })).toMatchObject({ mode: 'text', executable: false })
  })

  it('结构化预览只接受与产物种类相符的数据', () => {
    const table = { ...versions[2], payload: { kind: 'table' as const, columns: ['名称'], rows: [['库存']] } }
    expect(artifactPayload(table)).toEqual(table.payload)
    expect(artifactPayload({ ...table, kind: 'chart' })).toBeUndefined()
  })

  it('版本差异只比较紧邻旧版', () => {
    expect(artifactVersionDiff(versions, 'plan', 2).changes).toEqual(['items'])
    expect(artifactVersionDiff(versions, 'plan', 1).changes).toEqual([])
  })
})

describe('具体改了哪几行', () => {
  const texts: ArtifactRevision[] = [
    {
      id: 'memo',
      kind: 'document',
      title: '采购建议',
      version: 1,
      createdAt: 1,
      content: '一、先补库存\n二、再谈价格\n三、月底前签'
    },
    {
      id: 'memo',
      kind: 'document',
      title: '采购建议',
      version: 2,
      createdAt: 2,
      content: '一、先补库存\n二、先谈价格再补\n三、月底前签\n四、抄送财务'
    },
    {
      id: 'memo',
      kind: 'document',
      title: '采购建议',
      version: 3,
      createdAt: 3,
      content: '一、先补库存\n二、先谈价格再补\n三、月底前签\n四、抄送财务'
    }
  ]

  it('逐行报出改了什么，加减各报各的数', () => {
    const diff = artifactContentDiff(texts, 'memo', 2)
    expect(diff.mode).toBe('lines')
    expect(diff.added).toBe(2)
    expect(diff.removed).toBe(1)
    expect(diff.summary).toBe('与 v1 相比，+2 −1 行')
    expect(diff.lines.filter((line) => line.kind === 'remove').map((line) => line.text)).toEqual(['二、再谈价格'])
    expect(diff.lines.filter((line) => line.kind === 'add').map((line) => line.text)).toEqual([
      '二、先谈价格再补',
      '四、抄送财务'
    ])
  })

  it('只跟紧邻旧版比：v3 与 v2 一样，就说没变，不会把 v2 相对 v1 的改动算进来', () => {
    const diff = artifactContentDiff(texts, 'memo', 3)
    expect(diff.previous?.version).toBe(2)
    expect(diff.added).toBe(0)
    expect(diff.removed).toBe(0)
    expect(diff.summary).toBe('与 v2 相比，正文没有变化')
  })

  it('最早的一版不编造差异', () => {
    const diff = artifactContentDiff(texts, 'memo', 1)
    expect(diff.mode).toBe('none')
    expect(diff.lines).toEqual([])
    expect(diff.summary).toBe('这是最早的一版，没有可比对的旧版')
  })

  it('两版不是同一种东西就不逐行比，如实说类型变了', () => {
    const mixed: ArtifactRevision[] = [
      texts[0],
      { id: 'memo', kind: 'table', title: '采购建议', version: 2, createdAt: 2, payload: { kind: 'table', columns: ['名'], rows: [['甲']] } }
    ]
    const diff = artifactContentDiff(mixed, 'memo', 2)
    expect(diff.mode).toBe('none')
    expect(diff.lines).toEqual([])
    expect(diff.summary).toContain('无法逐行比较')
  })

  it('结构化产物只报规模变化，不假装做单元格级比对', () => {
    const tables: ArtifactRevision[] = [
      { id: 'stock', kind: 'table', title: '库存', version: 1, createdAt: 1, payload: { kind: 'table', columns: ['名'], rows: [['甲'], ['乙']] } },
      { id: 'stock', kind: 'table', title: '库存', version: 2, createdAt: 2, payload: { kind: 'table', columns: ['名'], rows: [['甲'], ['乙'], ['丙']] } }
    ]
    const diff = artifactContentDiff(tables, 'stock', 2)
    expect(diff.mode).toBe('summary')
    expect(diff.lines).toEqual([])
    expect(diff.summary).toBe('与 v1 相比，从 2 行变成 3 行')
  })

  it('规模没变但数据变了也要说出来，不能只因为行数一样就报「没变化」', () => {
    const tables: ArtifactRevision[] = [
      { id: 'stock', kind: 'table', title: '库存', version: 1, createdAt: 1, payload: { kind: 'table', columns: ['名'], rows: [['甲']] } },
      { id: 'stock', kind: 'table', title: '库存', version: 2, createdAt: 2, payload: { kind: 'table', columns: ['名'], rows: [['乙']] } }
    ]
    expect(artifactContentDiff(tables, 'stock', 2).summary).toBe('与 v1 相比，数据有改动（规模未变）')
  })
})
