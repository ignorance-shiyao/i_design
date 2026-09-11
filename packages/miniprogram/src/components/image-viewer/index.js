/**
 * ImageViewer —— 全屏图片预览。
 *
 * 与 Image 一样，预览交给 wx.previewImage：系统预览自带缩放、保存与分享，
 * 自己用 movable-view 重做一个，手感永远差一截，还多一份要维护的手势代码。
 * 因此这一端不引 logic/image 的变换函数——那是给自绘预览用的。
 *
 * 组件本身不渲染任何东西：它是一个「打开系统预览」的入口，
 * 由外部把 open 置为 true 触发，关闭由系统预览自己负责。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    images: { type: Array, value: [] },
    /** 打开时定位到第几张 */
    startIndex: { type: Number, value: 0 },
    open: { type: Boolean, value: false }
  },
  observers: {
    open(value) {
      if (!value || !this.data.images.length) return
      const list = this.data.images
      const index = Math.min(Math.max(this.data.startIndex, 0), list.length - 1)
      wx.previewImage({
        urls: list,
        current: list[index],
        // 系统预览关闭后要把 open 复位，否则第二次置 true 不会再触发 observer
        complete: () => {
          this.setData({ open: false })
          this.triggerEvent('close')
        }
      })
    }
  }
})
