import { describe, expect, it } from 'vitest'
import { artifactAdoptableIds, artifactPayload, artifactPreview, artifactVersionDiff, artifactVersions, openArtifact, toggleArtifactAdoption, type ArtifactRevision } from './artifact'

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
