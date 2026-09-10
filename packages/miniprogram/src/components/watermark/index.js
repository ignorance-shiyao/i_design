/**
 * Watermark —— 水印。
 *
 * 用 SVG 数据 URI 平铺，而不是 canvas 画一张位图：
 * 高分屏上不会糊，也不必等一帧再取图——canvas 方案在慢设备上会有一小段
 * 「先看到没水印的内容」的窗口，而那正是要防的场景。
 */
import { watermarkDataUri, watermarkTile } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    /** 一行或多行文字。多行时逐行往下排 */
    text: { type: null, value: '' },
    fontSize: { type: Number, value: 14 },
    rotate: { type: Number, value: -22 },
    gapX: { type: Number, value: 100 },
    gapY: { type: Number, value: 100 },
    opacity: { type: Number, value: 0.12 },
    /** 不传时跟随文字色，深浅主题都能看见 */
    color: { type: String, value: '' }
  },
  data: { image: '', tileWidth: 0, tileHeight: 0 },
  observers: {
    'text, fontSize, rotate, gapX, gapY, opacity, color': function () { this.build() }
  },
  lifetimes: { attached() { this.build() } },
  methods: {
    build() {
      const tile = watermarkTile({
        text: this.data.text,
        fontSize: this.data.fontSize,
        rotate: this.data.rotate,
        gapX: this.data.gapX,
        gapY: this.data.gapY,
        opacity: this.data.opacity,
        // 不写死黑色：深色主题上黑水印等于没有
        color: this.data.color || 'currentColor'
      })
      this.setData({
        image: watermarkDataUri(tile),
        tileWidth: tile.width,
        tileHeight: tile.height
      })
    }
  }
})
