/**
 * 智能体产物工作区：版本、采纳状态和只读预览全部复用 common 逻辑。
 * 生成的文档与代码只交给 text 节点，不能当作富文本或脚本注入页面。
 */
import {
  artifactAdoptableIds,
  artifactPayload,
  artifactPreview,
  artifactVersionDiff,
  openArtifact,
  toggleArtifactAdoption
} from '@i-design/common'

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
        diff: artifactVersionDiff(this.data.artifacts, this.data.artifactId, workspace.current?.version),
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
