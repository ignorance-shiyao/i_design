/**
 * Avatar —— 小程序实现。
 *
 * 取字与配色直接调用公共层的 initialsOf / tintOf：
 * 同一个人在 Web、小程序、React 上得到完全相同的缩写与底色，
 * 这正是把逻辑抽出来的价值——没有第二处规则可以走偏。
 */
import { initialsOf, tintOf } from '@i-design/common'

const SIZE_MAP = { sm: 24, md: 32, lg: 44 }

Component({
  options: { addGlobalClass: true },
  properties: {
    src: { type: String, value: '' },
    name: { type: String, value: '' },
    size: { type: null, value: 'md' },
    shape: { type: String, value: 'circle' },
    colorful: { type: Boolean, value: true }
  },
  data: { px: 32, fontSize: 12, initials: '', tint: '#5e7ce0', showImage: false },
  observers: {
    'src, name, size, colorful': function (src, name, size, colorful) {
      const px = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md
      this.setData({
        px,
        fontSize: Math.max(11, Math.round(px * 0.38)),
        initials: initialsOf(name),
        tint: colorful ? tintOf(name) : tintOf(''),
        showImage: !!src && !this.data._failed
      })
    }
  },
  methods: {
    onError() {
      // 图片加载失败静默降级到文字，不留破图——与 Web 端行为一致
      this.data._failed = true
      this.setData({ showImage: false })
    }
  }
})
