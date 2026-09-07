/**
 * Upload —— 文件大小格式化与状态模型来自公共层。
 *
 * 小程序没有 <input type="file">，选文件走 wx.chooseMessageFile / chooseImage，
 * 而这两个 API 的可用范围随宿主而变，因此本组件不自己调它们：
 * 点击触发区只抛 pick 事件，由页面决定用哪个 API，选完把文件列表回传。
 * 这样组件在小游戏、企业微信等环境里同样可用。
 */
import { formatSize } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    files: { type: Array, value: [] },
    tip: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
    text: { type: String, value: '点击选择文件' }
  },
  data: { items: [] },
  observers: {
    files: function (files) {
      this.setData({
        items: files.map((f) => ({
          ...f,
          status: f.status || 'ready',
          percent: f.percent || 0,
          sizeText: formatSize(f.size || 0)
        }))
      })
    }
  },
  methods: {
    onPick() {
      if (this.data.disabled) return
      this.triggerEvent('pick')
    },
    onRemove(e) {
      this.triggerEvent('remove', { uid: e.currentTarget.dataset.uid })
    },
    onRetry(e) {
      this.triggerEvent('retry', { uid: e.currentTarget.dataset.uid })
    }
  }
})
