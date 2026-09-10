/**
 * Image —— 图片。
 *
 * 预览直接交给 wx.previewImage：系统预览自带缩放、保存与分享，
 * 自己用 movable-view 重做一个，手感永远差一截，还多一份要维护的手势代码。
 * 因此这一端不引 logic/image 的变换函数——那是给自绘预览用的。
 * 「到头不循环」「翻页归零」这些规则由系统预览负责，不在这里重复实现。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    src: { type: String, value: '' },
    alt: { type: String, value: '' },
    width: { type: null, value: '' },
    height: { type: null, value: '' },
    /** 点击后全屏预览 */
    preview: { type: Boolean, value: true },
    /** 同组图片，预览时可左右翻页。不传则只预览自己 */
    group: { type: Array, value: [] },
    fit: { type: String, value: 'cover' }
  },
  data: { status: 'loading', boxStyle: '' },
  observers: {
    'src': function () { this.setData({ status: 'loading' }) },
    'width, height': function (w, h) {
      const size = (v) => (typeof v === 'number' ? v + 'px' : v || '')
      const parts = []
      if (size(w)) parts.push('width:' + size(w))
      if (size(h)) parts.push('height:' + size(h))
      this.setData({ boxStyle: parts.join(';') })
    }
  },
  methods: {
    onLoad() { this.setData({ status: 'loaded' }) },
    onError() { this.setData({ status: 'error' }) },
    openPreview() {
      if (!this.data.preview || this.data.status === 'error') return
      const urls = this.data.group.length ? this.data.group : [this.data.src]
      wx.previewImage({ urls, current: this.data.src })
      this.triggerEvent('preview', { src: this.data.src })
    }
  }
})
