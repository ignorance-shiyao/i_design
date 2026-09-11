import { countdownInterval, countdownRemaining, formatCountdown } from '@i-design/common'

/**
 * 倒计时。
 *
 * 每一跳都从绝对截止时刻重算，而不是把上一次的值减掉一个间隔：
 * 小程序页面被切到后台时定时器会被挂起，回来再按「减一个间隔」算就直接错了。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Number, value: 0 },
    format: { type: String, value: 'HH:mm:ss' },
    title: { type: String, value: '' },
    prefix: { type: String, value: '' },
    suffix: { type: String, value: '' },
    type: { type: String, value: 'default' },
    size: { type: String, value: 'md' },
    running: { type: Boolean, value: true }
  },
  data: { text: '', finished: false },
  observers: {
    'value, format, running': function () {
      this.restart()
    }
  },
  lifetimes: {
    attached() {
      this.restart()
    },
    detached() {
      this.stop()
    }
  },
  pageLifetimes: {
    // 回到前台时重算一次：挂起期间没跳过表，界面停在离开时的那个数
    show() {
      this.restart()
    },
    hide() {
      this.stop()
    }
  },
  methods: {
    stop() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
    },
    restart() {
      this.stop()
      const left = countdownRemaining(this.data.value, Date.now())
      this.setData({ text: formatCountdown(left, this.data.format), finished: left <= 0 })
      if (!this.data.running || left <= 0) return
      this.timer = setTimeout(this.tick.bind(this), countdownInterval(left, /S/.test(this.data.format)))
    },
    tick() {
      const left = countdownRemaining(this.data.value, Date.now())
      this.setData({ text: formatCountdown(left, this.data.format), finished: left <= 0 })
      this.triggerEvent('change', { remaining: left })
      if (left <= 0) {
        this.stop()
        this.triggerEvent('finish')
        return
      }
      this.timer = setTimeout(this.tick.bind(this), countdownInterval(left, /S/.test(this.data.format)))
    }
  }
})
