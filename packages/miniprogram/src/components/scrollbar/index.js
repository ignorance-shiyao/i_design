/**
 * Scrollbar —— 滚动容器。
 *
 * 这一端不自绘滚动条：小程序用的是系统滚动视图，滚动条由平台绘制且无法替换，
 * 自己画一条只会和系统那条同时出现。组件在这里退化成一个统一的滚动容器，
 * 保证跨端的用法与类名一致。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    height: { type: String, value: '' },
    maxHeight: { type: String, value: '' }
  },
  methods: {
    onScroll(e) {
      this.triggerEvent('scroll', e.detail)
    }
  }
})
