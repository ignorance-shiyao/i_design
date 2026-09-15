/**
 * ExportJob —— 导出任务卡（astra.md 的 B11 后半）。
 *
 * 任务怎么排队、文件怎么生成、下载走哪个地址，都在页面手里——
 * 这个组件不碰任何 IO。进度条只在总数已知时出现（假进度条是谎）；
 * 出处永远在，它是这份文件能不能拿去对账的前提。
 *
 * 判断走 logic/exportjob.ts，五端共用一份。
 */
import { describeExport, exportFileName, exportProvenance } from '@i-design/common'

/* 图标名与 Web 端同一张表 */
const ICONS = {
  queued: 'clock',
  running: 'refresh',
  ready: 'download',
  expired: 'history',
  failed: 'error-circle',
  cancelled: 'close'
}

Component({
  options: { addGlobalClass: true },
  properties: {
    status: { type: String, value: 'queued' },
    /** 队列里前面还有几个。-1 表示服务端没给队列信息 */
    queuePosition: { type: Number, value: -1 },
    /** 已处理行数。-1 表示还没有数字 */
    processed: { type: Number, value: -1 },
    /** 总行数。-1 表示不知道——**不要猜一个填进来**，那就成了假进度条 */
    total: { type: Number, value: -1 },
    /** 文件的过期时刻（毫秒时间戳）。0 表示没有有效期 */
    expiresAt: { type: Number, value: 0 },
    error: { type: String, value: '' },
    /** 这份导出的出处。null 表示不显示 */
    meta: { type: null, value: null },
    /** 当前时间，受控。0 表示用系统时间 */
    now: { type: Number, value: 0 }
  },
  data: {
    tone: 'neutral', icon: 'clock', label: '', detail: '',
    percent: -1, action: 'none', provenance: [], fileName: ''
  },
  observers: {
    'status, queuePosition, processed, total, expiresAt, error, meta, now': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const d = this.data
      const view = describeExport({
        status: d.status,
        queuePosition: d.queuePosition < 0 ? undefined : d.queuePosition,
        processed: d.processed < 0 ? undefined : d.processed,
        total: d.total < 0 ? undefined : d.total,
        expiresAt: d.expiresAt || undefined,
        error: d.error,
        now: d.now || Date.now()
      })
      this.setData({
        tone: view.tone,
        icon: ICONS[view.status],
        label: view.label,
        detail: view.detail,
        // WXML 里没法判断 null，用 -1 表示「不画进度条」
        percent: view.percent === null ? -1 : view.percent,
        action: view.action,
        provenance: d.meta ? exportProvenance(d.meta) : [],
        fileName: d.meta ? exportFileName(d.meta) : ''
      })
    },
    onCancel() { this.triggerEvent('cancel') },
    onDownload() { this.triggerEvent('download', { fileName: this.data.fileName }) },
    onRegenerate() { this.triggerEvent('regenerate') },
    onRetry() { this.triggerEvent('retry') }
  }
})
