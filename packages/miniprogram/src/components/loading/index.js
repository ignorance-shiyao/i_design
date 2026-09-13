/**
 * Loading —— 加载态。
 *
 * 带 elapsed 时显示已等多久：智能体的一次调用动辄十几秒，只转圈不给数字的话，
 * 三秒和三十秒看起来一样，于是有人反复点，或者以为卡死了退出重进。
 * 阈值与进位规则走公共层，各端给出的秒数完全一致。
 */
import { elapsedInterval, elapsedParts, shouldShowElapsed } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true },
  properties: {
    size: { type: String, value: 'md' },
    text: { type: String, value: '' },
    elapsed: { type: Boolean, value: false }
  },
  data: { elapsedText: '', label: '' },
  lifetimes: {
    attached() {
      // 无障碍名也走字典：读屏用户听到的就是这一句
      this.setData({ label: this.data.text || getLocale().loading })
      if (this.data.elapsed) this.startTimer()
    },
    detached() {
      this.stopTimer()
    }
  },
  observers: {
    elapsed(on) {
      if (on) this.startTimer()
      else this.stopTimer()
    }
  },
  methods: {
    startTimer() {
      this.stopTimer()
      this.since = Date.now()
      this.tick()
    },
    stopTimer() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
      this.setData({ elapsedText: '' })
    },
    tick() {
      // 按目标时刻反算而不是累加间隔：小程序把页面切到后台时定时器同样会被节流
      const ms = Date.now() - this.since
      const locale = getLocale()
      const { minutes, seconds } = elapsedParts(ms)
      this.setData({
        elapsedText: shouldShowElapsed(ms)
          ? (minutes ? minutes + locale.minuteUnit + ' ' : '') + seconds + locale.secondUnit
          : ''
      })
      this.timer = setTimeout(() => this.tick(), elapsedInterval(ms))
    }
  }
})
