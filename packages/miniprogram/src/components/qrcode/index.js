/**
 * Qrcode —— 二维码。
 *
 * 小程序没有 SVG，改用 canvas 逐块画。矩阵仍然来自公共层：
 * 同一段文本必须在各端得到同一个版本与掩码，否则模块数对不上，
 * 设计稿里的尺寸与留白就得各端各调一遍。
 */
import { qrMatrix } from '@i-design/common'

/** 静默区四个模块，规范给的下限。留白不够时相机会把旁边的文字当成模块 */
const QUIET = 4

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '' },
    size: { type: Number, value: 160 },
    level: { type: String, value: 'M' },
    color: { type: String, value: '#000000' },
    background: { type: String, value: '#ffffff' },
    label: { type: String, value: '' }
  },
  data: { failed: false, canvasId: `i-qrcode-${Math.random().toString(36).slice(2, 8)}` },
  observers: {
    'value, level, size, color, background': function () {
      this.draw()
    }
  },
  lifetimes: {
    attached() {
      this.draw()
    }
  },
  methods: {
    draw() {
      const matrix = qrMatrix(this.data.value, this.data.level)
      if (!matrix) {
        // 装不下就据实说明，不画一张残缺的码：残码扫出来是另一个地址
        this.setData({ failed: true })
        return
      }
      this.setData({ failed: false })

      const ctx = wx.createCanvasContext(this.data.canvasId, this)
      const side = matrix.size + QUIET * 2
      const unit = this.data.size / side
      ctx.setFillStyle(this.data.background)
      ctx.fillRect(0, 0, this.data.size, this.data.size)
      ctx.setFillStyle(this.data.color)
      for (let r = 0; r < matrix.size; r++) {
        for (let c = 0; c < matrix.size; c++) {
          if (!matrix.modules[r][c]) continue
          // 多画半像素盖住缝：逐块画时相邻块之间会露出底色，扫描器把那当成浅色模块
          ctx.fillRect((c + QUIET) * unit, (r + QUIET) * unit, unit + 0.5, unit + 0.5)
        }
      }
      ctx.draw()
    }
  }
})
