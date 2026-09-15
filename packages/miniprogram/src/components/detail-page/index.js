/**
 * DetailPage —— 一条记录摊开之后的页面骨架（astra.md 的 B12）。
 *
 * 它不管字段怎么排，管的是四件事：这条记录现在能做什么、看到的这一份还作不作数、
 * 从哪儿来回哪儿去、上一条 / 下一条。判断走 logic/detail.ts，五端共用一份。
 *
 * 归并后的停用理由要在 JS 里算好：WXML 里没有 Map，也拼不出这种分组。
 */
import {
  detailActions,
  detailNeighbours,
  noActionHint,
  recordFreshness,
  returnLabel,
  unpackReturn
} from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    /** 状态的显示名。同时也是「没有可执行操作」那句话里的那个词 */
    status: { type: String, value: '' },
    statusTone: { type: String, value: 'default' },
    summary: { type: String, value: '' },
    /** 这一页有哪些动作。状态不允许的不会出现，没权限的出现但停用 */
    actions: { type: Array, value: [] },
    permissions: { type: Array, value: [] },
    seenRevision: { type: Number, value: 0 },
    currentRevision: { type: Number, value: 0 },
    exists: { type: Boolean, value: true },
    denied: { type: Object, value: {} },
    siblingIds: { type: Array, value: [] },
    currentId: { type: String, value: '' },
    returnTicket: { type: String, value: '' }
  },
  data: {
    resolved: [], reasons: [], emptyHint: '',
    staleKind: 'fresh', staleLabel: '', staleDetail: '', staleAction: 'none', staleIcon: 'history',
    position: '', prevId: '', nextId: '', edgeHint: '', backText: '返回列表'
  },
  observers: {
    'actions, status, permissions, seenRevision, currentRevision, exists, denied, siblingIds, currentId, returnTicket':
      function () {
        this.refresh()
      }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const d = this.data
      const freshness = recordFreshness({
        seenRevision: d.seenRevision,
        currentRevision: d.currentRevision,
        exists: d.exists
      })
      const resolved = detailActions(d.actions, {
        status: d.status,
        permissions: d.permissions,
        freshness: freshness.kind,
        denied: d.denied
      })
      // 按原因归并：同一个原因挡住三个动作时不说三遍
      const grouped = {}
      const order = []
      for (const action of resolved) {
        if (!action.disabled) continue
        if (!grouped[action.reason]) { grouped[action.reason] = []; order.push(action.reason) }
        grouped[action.reason].push(action.label)
      }
      const neighbours = detailNeighbours(d.siblingIds, d.currentId)
      this.ticket = unpackReturn(d.returnTicket)
      this.setData({
        resolved: resolved.map((a) => ({
          ...a,
          variant: a.kind === 'primary' ? 'primary' : a.kind === 'danger' ? 'danger' : 'secondary'
        })),
        reasons: order.map((reason) => ({ reason, labels: grouped[reason].join('、') })),
        emptyHint: noActionHint(d.status),
        staleKind: freshness.kind,
        staleLabel: freshness.label,
        staleDetail: freshness.detail,
        staleAction: freshness.action,
        staleIcon: freshness.kind === 'deleted' ? 'error-circle' : 'history',
        position: neighbours.position,
        prevId: neighbours.prevId || '',
        nextId: neighbours.nextId || '',
        edgeHint: neighbours.edgeHint,
        backText: returnLabel(this.ticket)
      })
    },
    onAction(e) {
      const action = this.data.resolved.find((a) => a.key === e.currentTarget.dataset.key)
      if (!action || action.disabled) return
      this.triggerEvent('action', { key: action.key })
    },
    onBack() { this.triggerEvent('back', { ticket: this.ticket }) },
    onRefresh() { this.triggerEvent('refresh') },
    onPrev() { if (this.data.prevId) this.triggerEvent('navigate', { id: this.data.prevId }) },
    onNext() { if (this.data.nextId) this.triggerEvent('navigate', { id: this.data.nextId }) }
  }
})
