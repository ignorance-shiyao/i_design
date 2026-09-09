/**
 * Toast —— 小程序自带 wx.showToast，但它只支持有限的图标与文案长度，
 * 且样式无法跟随设计体系。这里用自绘组件保证与其他端观感一致。
 * 排队与超时规则来自公共层的 resolveDuration。
 */
import { nextToastId, resolveDuration } from '@i-design/common'

const ICONS = {
  success: 'check-circle',
  warning: 'warning-triangle',
  error: 'error-circle',
  loading: 'refresh'
}

Component({
  options: { addGlobalClass: true },
  data: { record: null },
  lifetimes: {
    attached() {
      // 挂到页面实例上，供 page.selectComponent 或全局方法调用
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      if (page) page.$iToast = this
    }
  },
  methods: {
    show(content, type = 'text', duration) {
      clearTimeout(this._timer)
      const record = {
        id: nextToastId(),
        content,
        type,
        icon: ICONS[type] || '',
        duration: resolveDuration(type, duration)
      }
      this.setData({ record })
      // loading 型不自动消失，必须由调用方 hide()，否则会永远盖住界面
      if (record.duration > 0) {
        this._timer = setTimeout(() => this.setData({ record: null }), record.duration)
      }
    },
    success(content, duration) { this.show(content, 'success', duration) },
    error(content, duration) { this.show(content, 'error', duration) },
    loading(content) { this.show(content, 'loading') },
    hide() {
      clearTimeout(this._timer)
      this.setData({ record: null })
    }
  }
})
