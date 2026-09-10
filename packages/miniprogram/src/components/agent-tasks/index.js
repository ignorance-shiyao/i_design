/** AgentTasks —— 智能体任务的实时状态。汇总走共享的 summarizeTasks。 */
import { summarizeTasks } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    tasks: { type: Array, value: [] },
    variant: { type: String, value: 'capsule' },
    showSummary: { type: Boolean, value: true }
  },
  data: { rows: [], summary: null, open: [] },
  observers: { tasks: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const open = this.data.open
      this.setData({
        summary: summarizeTasks(this.data.tasks),
        rows: this.data.tasks.map((t) => ({ ...t, expanded: open.indexOf(t.id) !== -1 }))
      })
    },
    onToggle(e) {
      const { id, detail } = e.currentTarget.dataset
      this.triggerEvent('select', { id })
      if (!detail) return
      const open = this.data.open.indexOf(id) !== -1
        ? this.data.open.filter((k) => k !== id)
        : this.data.open.concat(id)
      this.setData({ open }, () => this.refresh())
    }
  }
})
