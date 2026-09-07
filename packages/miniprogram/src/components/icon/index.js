/**
 * Icon —— 小程序实现。
 * WXML 不渲染内联 SVG，因此改用 CSS mask：图标形状来自遮罩，颜色来自 currentColor，
 * 于是仍然「跟着文字色走」，与 Web 端一致。图标样式由 build-icons.mjs 从公共层生成。
 */
Component({
  options: { addGlobalClass: true, virtualHost: true },
  properties: {
    name: { type: String, value: '' },
    size: { type: null, value: '1em' }
  },
  data: { px: '1em' },
  observers: {
    size(value) {
      this.setData({ px: typeof value === 'number' ? `${value}px` : value })
    }
  }
})
