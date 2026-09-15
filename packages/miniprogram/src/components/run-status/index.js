/**
 * RunStatus —— 一次运行停在哪儿。
 *
 * 出字之前那段静止有好几种原因——在排队、在连接、断了正在重连、在等人点一下。
 * 判定走 logic/lifecycle.ts，各端共用一份：同一个运行不该在网页上还能取消、
 * 在小程序里按钮已经灰了。
 *
 * 秒数在 JS 里先算成字符串：WXML 不能调函数，直接绑毫秒数只会显示一串数字。
 */
import { describeRun, elapsedInterval, elapsedParts, shouldShowElapsed } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    status: { type: String, value: 'queued' },
    /** 队列里前面还有几个。-1 表示服务端没给队列信息，界面就不编一个出来 */
    queuePosition: { type: Number, value: -1 },
    connection: { type: String, value: '' },
    attempt: { type: Number, value: 0 },
    /** 下一次重试的时刻（毫秒时间戳）。0 表示没有 */
    retryAt: { type: Number, value: 0 },
    /** 这次运行开始等待的时刻。0 表示不显示「已等 N 秒」 */
    startedAt: { type: Number, value: 0 },
    cancelText: { type: String, value: '取消' }
  },
  data: { tone: 'neutral', icon: 'clock', label: '', detail: '', busy: false, cancelable: false, waited: '' },
  observers: {
    'status, queuePosition, connection, attempt, retryAt, startedAt': function () {
      this.sync()
    }
  },
  lifetimes: {
    attached() {
      this.sync()
    },
    // 定时器必须跟着组件一起收：页面退了还在跳，等于每秒白跑一次 setData
    detached() {
      this.stopClock()
    }
  },
  methods: {
    sync() {
      const { status, queuePosition, connection, attempt, retryAt, startedAt } = this.data
      const now = Date.now()
      const notice = describeRun({
        status,
        queuePosition: queuePosition < 0 ? undefined : queuePosition,
        connection: connection || undefined,
        attempt,
        retryAt: retryAt || undefined,
        startedAt: startedAt || undefined,
        now
      })
      this.setData({
        tone: notice.tone,
        icon: notice.icon,
        label: notice.label,
        detail: notice.detail,
        busy: notice.busy,
        cancelable: notice.cancelable,
        /* 三秒以内不挂计时：那点时间还来不及让人怀疑是不是卡了 */
        waited:
          startedAt && shouldShowElapsed(notice.waited) ? this.formatWaited(notice.waited) : ''
      })
      this.stopClock()
      if (notice.busy) {
        // 对齐到整秒而不是固定 1000ms：固定间隔会累积漂移，等久了秒数会明显偏慢
        this.timer = setTimeout(() => this.sync(), elapsedInterval(now))
      }
    },
    formatWaited(ms) {
      const { minutes, seconds } = elapsedParts(ms)
      return minutes > 0 ? `已等 ${minutes} 分 ${seconds} 秒` : `已等 ${seconds} 秒`
    },
    stopClock() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
    },
    onCancel() {
      this.triggerEvent('cancel')
    }
  }
})
