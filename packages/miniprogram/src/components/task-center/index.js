/**
 * TaskCenter —— 异步任务中心（astra.md 的 B18）。
 *
 * 任务怎么跑、通知怎么发、点过去落到哪个页面，都在页面手里——组件不碰任何 IO。
 * 它摆出三件事：任务号与影响对象（追踪行里逐条写着）、只数「要人处理的」的角标、
 * 结束的任务那个点得下去的出口。
 *
 * 判断走 logic/taskcenter.ts，五端共用一份。
 */
import {
  isActive,
  markAllSeen,
  markSeen,
  taskBadge,
  taskNotice,
  taskOrder,
  taskTrail
} from '@i-design/common'

/* 状态图标同时给形状与文字：灰度打印下失败与完成是同一个灰 */
const ICONS = {
  queued: 'clock',
  running: 'refresh',
  succeeded: 'check',
  failed: 'error-circle',
  cancelled: 'close'
}
const STATE_LABELS = {
  queued: '排队中',
  running: '进行中',
  succeeded: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

Component({
  options: { addGlobalClass: true },
  properties: {
    tasks: { type: Array, value: [] },
    title: { type: String, value: '任务中心' },
    showTrail: { type: Boolean, value: false }
  },
  data: { rows: [], badgeCount: 0, badgeText: '', opened: [] },
  observers: {
    'tasks, showTrail': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const d = this.data
      const badge = taskBadge(d.tasks)
      /* WXML 里跑不了函数，每一行要的东西都在这儿摊平 */
      const rows = taskOrder(d.tasks).map((task) => {
        const notice = taskNotice(task)
        const active = isActive(task)
        return {
          id: task.id,
          title: task.title,
          state: task.state,
          icon: ICONS[task.state],
          stateLabel: STATE_LABELS[task.state],
          detail:
            (notice && notice.description) ||
            (task.target ? task.target.kind + '「' + task.target.label + '」' : '任务 ' + task.id),
          actionLabel: (notice && notice.actionLabel) || '查看任务详情',
          active,
          running: task.state === 'running',
          failed: task.state === 'failed',
          unseen: !active && !task.seen,
          trailOpen: d.showTrail || d.opened.indexOf(task.id) >= 0,
          // 时区是各端从系统拿的，转换留在这一端
          trail: taskTrail(task, (ms) => new Date(ms).toLocaleString('zh-CN'))
        }
      })
      this.setData({ rows, badgeCount: badge.count, badgeText: badge.text })
    },
    onToggleTrail(e) {
      const id = e.currentTarget.dataset.id
      const opened = this.data.opened.slice()
      const index = opened.indexOf(id)
      if (index >= 0) opened.splice(index, 1)
      else opened.push(id)
      this.setData({ opened }, () => this.refresh())
    },
    onOpen(e) {
      const id = e.currentTarget.dataset.id
      const task = this.data.tasks.filter((t) => t.id === id)[0]
      if (!task) return
      // 看过了就从角标里去掉——「看过」不等于「处理完了」，失败的也照样标
      this.triggerEvent('taskschange', { tasks: markSeen(this.data.tasks, id) })
      if (task.target) this.triggerEvent('open', { target: task.target, task })
      else this.triggerEvent('inspect', { task })
    },
    onRetry(e) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('retry', { task: this.data.tasks.filter((t) => t.id === id)[0] })
    },
    onCancel(e) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('cancel', { task: this.data.tasks.filter((t) => t.id === id)[0] })
    },
    onMarkAll() {
      this.triggerEvent('taskschange', { tasks: markAllSeen(this.data.tasks) })
    }
  }
})
