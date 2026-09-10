/**
 * ColorPicker —— 取色器。
 *
 * 色彩换算全部走公共层：同一个仓库里出现两份「什么叫更亮一点」，
 * 迟早会在某个组件上对不上。这一端只负责把手势换成饱和度与明度。
 */
import { colorReadout, hexToHsv, hsvToHex, parseColor } from '@i-design/common'

const DEFAULT_PRESETS = [
  '#5e7ce0', '#0f8a68', '#b7622a', '#c2413d',
  '#7a4ee0', '#1f86b8', '#1d2129', '#86909c'
]

Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: String, value: '#5e7ce0' },
    /** 常用色，点一下直接取用 */
    presets: { type: Array, value: DEFAULT_PRESETS },
    disabled: { type: Boolean, value: false },
    /** 显示对比度读数：挑主色时最该看的就是这个 */
    showContrast: { type: Boolean, value: true }
  },
  data: {
    open: false, hue: 0, thumbX: 0, thumbY: 0,
    text: '#5e7ce0', ink: '#ffffff', ratio: 0, hint: ''
  },
  observers: {
    'value': function (v) { this.sync(v) }
  },
  lifetimes: { attached() { this.sync(this.data.value) } },
  methods: {
    sync(hex) {
      const hsv = hexToHsv(hex)
      const readout = colorReadout(hex)
      this.hsv = hsv
      this.setData({
        hue: Math.round(hsv.h),
        thumbX: hsv.s * 100,
        thumbY: (1 - hsv.v) * 100,
        text: hex,
        ink: readout.ink,
        ratio: readout.ratio,
        hint: readout.passesText
          ? '正文与控件文字都够读'
          : readout.passesUi
            ? '够做控件文字，正文偏低'
            : '对比度不足，文字会看不清'
      })
    },

    toggle() {
      if (this.data.disabled) return
      this.setData({ open: !this.data.open })
    },

    commit(hsv) {
      const hex = hsvToHex(hsv)
      this.setData({ value: hex })
      this.sync(hex)
      this.triggerEvent('change', { value: hex })
    },

    onArea(e) {
      const touch = e.touches[0]
      this.createSelectorQuery()
        .select('.i-colorpicker__area')
        .boundingClientRect((rect) => {
          if (!rect) return
          const s = Math.min(1, Math.max(0, (touch.clientX - rect.left) / rect.width))
          const v = 1 - Math.min(1, Math.max(0, (touch.clientY - rect.top) / rect.height))
          this.commit({ h: this.hsv.h, s, v })
        })
        .exec()
    },

    onHue(e) { this.commit({ h: e.detail.value, s: this.hsv.s, v: this.hsv.v }) },

    onInput(e) { this.setData({ text: e.detail.value }) },

    /*
     * 失焦或回车时才解析。边打边解析的话，用户删到只剩 "#5" 时
     * 颜色就已经跳了几次，他没法安心把值改完。
     */
    onTextCommit() {
      const parsed = parseColor(this.data.text)
      if (parsed) {
        this.setData({ value: parsed })
        this.sync(parsed)
        this.triggerEvent('change', { value: parsed })
      } else {
        // 解析不出来就退回原值，而不是留一个红框让人猜哪里错了
        this.setData({ text: this.data.value })
      }
    },

    onPreset(e) {
      const hex = e.currentTarget.dataset.color
      this.setData({ value: hex })
      this.sync(hex)
      this.triggerEvent('change', { value: hex })
    }
  }
})
