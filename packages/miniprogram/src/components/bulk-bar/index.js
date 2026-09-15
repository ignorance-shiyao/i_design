/**
 * BulkBar —— 列表页上方的批量操作条（astra.md 的 B07）。
 *
 * 第一职责是把「对谁做」说清楚：列表页上「全选」这个词有三种含义，
 * 三者在屏幕上差别极小而后果差着数量级。第二职责是把部分失败摊开——
 * 失败的那几条还要照着去处理，重试也只能发这几条。
 *
 * 判断走 logic/bulk.ts，五端共用一份。
 */
import { bulkSelection, canEscalate, escalateLabel } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    /** 当前作用域。受控：这是整条的核心状态，不能由组件自己猜 */
    scope: { type: String, value: 'selected' },
    pageIds: { type: Array, value: [] },
    selectedIds: { type: Array, value: [] },
    /** 符合当前筛选的总条数，由服务端给 */
    matchedTotal: { type: Number, value: 0 },
    filtered: { type: Boolean, value: false },
    /** 上一轮的执行结果。null 表示还没执行过 */
    outcome: { type: null, value: null },
    busy: { type: Boolean, value: false },
    maxFailures: { type: Number, value: 5 }
  },
  data: {
    visible: false, count: 0, summary: '', needsConfirm: false, confirmMessage: '',
    escalatable: false, escalateText: '', selectedCount: 0,
    asking: false, failures: [], hiddenFailures: 0, outcomeOk: false
  },
  observers: {
    'scope, pageIds, selectedIds, matchedTotal, filtered, outcome, maxFailures': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const { scope, pageIds, selectedIds, matchedTotal, filtered, outcome, maxFailures } = this.data
      const selection = bulkSelection({ scope, pageIds, selectedIds, matchedTotal, filtered })
      const failed = outcome ? outcome.failed : []
      this.selection = selection
      this.setData({
        visible: selection.count > 0 || !!outcome,
        count: selection.count,
        summary: selection.summary,
        needsConfirm: selection.needsConfirm,
        confirmMessage: selection.confirmMessage,
        escalatable:
          scope !== 'matched' && canEscalate({ pageIds, selectedIds, matchedTotal }),
        escalateText: escalateLabel(matchedTotal, filtered),
        selectedCount: selectedIds.length,
        // 范围一变，之前那次确认就不作数了——它复述的条数已经不对
        asking: false,
        failures: failed.slice(0, maxFailures),
        hiddenFailures: Math.max(0, failed.length - maxFailures),
        outcomeOk: !!outcome && outcome.kind === 'all-ok'
      })
    },
    onEscalate() { this.triggerEvent('scopechange', { scope: 'matched' }) },
    onShrink() { this.triggerEvent('scopechange', { scope: 'selected' }) },
    onClear() { this.triggerEvent('clear') },
    onKeepLooking() { this.setData({ asking: false }) },
    onRun() {
      if (this.data.needsConfirm && !this.data.asking) {
        this.setData({ asking: true })
        return
      }
      this.setData({ asking: false })
      this.triggerEvent('execute', { selection: this.selection })
    },
    onRetry() {
      const { outcome } = this.data
      if (outcome) this.triggerEvent('retry', { ids: outcome.retryIds })
    }
  }
})
