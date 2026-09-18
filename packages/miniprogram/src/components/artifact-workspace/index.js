/**
 * 智能体产物工作区：版本、采纳状态和只读预览全部复用 common 逻辑。
 * 生成的文档与代码只交给 text 节点，不能当作富文本或脚本注入页面。
 */
import {
  artifactAdoptableIds,
  artifactPayload,
  artifactPreview,
  artifactContentDiff,
  openArtifact,
  toggleArtifactAdoption
} from '@i-design/common'

/** 把差异摊成 WXML 能直接渲染的形状；只保留有增删的行，全同的正文不必再铺一遍 */
function diffView(diff) {
  const changed = diff.mode === 'lines' && diff.added + diff.removed > 0
  return {
    summary: diff.summary,
    changed,
    // 符号与文字一起给：只靠颜色的话，灰度打印与色觉障碍下读不出增删
    lines: changed
      ? diff.lines
          .filter((line) => line.kind !== 'same')
          .map((line) => ({
            kind: line.kind,
            sign: line.kind === 'add' ? '+' : '−',
            no: line.kind === 'add' ? line.after : line.before,
            text: line.text
          }))
      : []
  }
}

Component({
  options: { addGlobalClass: true },
  properties: {
    artifacts: { type: Array, value: [] },
    artifactId: { type: String, value: '' },
    version: { type: Number, value: 0 },
    adopted: { type: Array, value: [] },
    title: { type: String, value: '产物工作区' }
  },
  data: { workspace: { revisions: [], adopted: [] }, current: null, preview: {}, payload: null, diff: null, ids: [] },
  observers: {
    'artifacts, artifactId, version, adopted': function () { this.refresh() }
  },
  lifetimes: {
    attached() { this.refresh() }
  },
  methods: {
    refresh() {
      const workspace = openArtifact(
        this.data.artifacts,
        this.data.artifactId,
        this.data.version || undefined,
        this.data.adopted
      )
      this.setData({
        workspace,
        current: workspace.current || null,
        preview: artifactPreview(workspace.current),
        payload: artifactPayload(workspace.current) || null,
        /*
         * 差异不止说「变了」，还要说清改了哪几行：一句「内容有变化」等于没说，
         * 用户要么逐字重读一遍，要么干脆不看。
         * WXML 里跑不了函数，逐行的展示数据在这儿摊平。
         */
        diff: diffView(
          artifactContentDiff(this.data.artifacts, this.data.artifactId, workspace.current?.version)
        ),
        ids: artifactAdoptableIds(workspace.current)
      })
    },
    onVersion(e) { this.triggerEvent('versionchange', { version: e.currentTarget.dataset.version }) },
    onToggle(e) {
      const id = e.currentTarget.dataset.id
      const adopted = toggleArtifactAdoption(this.data.current, this.data.workspace.adopted, id)
      this.triggerEvent('adoptedchange', { adopted })
    },
    onDownload() { if (this.data.current) this.triggerEvent('download', { artifact: this.data.current }) }
  }
})
