/**
 * PageState —— 小程序实现。
 *
 * 判定逻辑不在这里：它与 Web 端共用 @i-design/common 的 pageState，
 * 由构建注入到 dist/logic 里。同一批条件在五个端各判一次的话，
 * 一定会有某个端把「部分成功」判成「失败」，然后清空已经成功的那批数据。
 */
import { pageState, PAGE_STATE_ACTIONS } from '@i-design/common'

const ICONS = {
  offline: 'offline',
  forbidden: 'lock',
  failed: 'error-circle',
  partial: 'warning-triangle',
  stale: 'history'
}
const TONE = { offline: 'muted', forbidden: 'warning', failed: 'danger', partial: 'warning', stale: 'muted' }
const LABELS = { offline: '离线', forbidden: '无权限', failed: '加载失败', partial: '部分成功', stale: '数据已过期' }

Component({
  options: { addGlobalClass: true },
  properties: {
    loading: { type: Boolean, value: false },
    online: { type: Boolean, value: true },
    error: { type: Object, value: null },
    loaded: { type: Number, value: 0 },
    failed: { type: Number, value: 0 },
    fetchedAt: { type: Number, optionalTypes: [null], value: 0 },
    staleAfter: { type: Number, optionalTypes: [null], value: 0 },
    emptyType: { type: String, value: 'empty' },
    title: { type: String, value: '' }
  },
  data: { kind: 'ready', reason: '', keepsContent: true, action: '', actionLabel: '', icon: '', tone: '', label: '' },
  observers: {
    'loading, online, error, loaded, failed, fetchedAt, staleAfter': function () {
      const { loading, online, error, loaded, failed, fetchedAt, staleAfter } = this.data
      const state = pageState({
        loading,
        online,
        error,
        loaded,
        failed,
        fetchedAt: fetchedAt || undefined,
        staleAfter: staleAfter || undefined
      })
      this.setData({
        kind: state.kind,
        reason: state.reason,
        keepsContent: state.keepsContent,
        action: state.action || '',
        actionLabel: state.action ? PAGE_STATE_ACTIONS[state.action] : '',
        icon: ICONS[state.kind] || '',
        tone: TONE[state.kind] || 'muted',
        label: LABELS[state.kind] || ''
      })
    }
  },
  methods: {
    onAction() {
      this.triggerEvent('action', this.data.action)
    }
  }
})
