/**
 * InsightCards —— 洞察卡。
 *
 * 一句结论配一条趋势线，左右翻页看下一条。分页的边界行为与擦洗的取点规则
 * 走公共层：这一端能翻回第一条、Web 端不能的话，读者会以为是两个功能。
 *
 * 小程序没有 SVG，趋势线画在 canvas 上；WXML 不能调用函数，
 * 所以标题、读数、涨跌文字都在 JS 里算好再塞进 data。
 */
import {
  INSIGHT_DOT_R,
  domainOf,
  insightPage,
  insightPlot,
  insightTrend,
  scrubIndex,
  scrubReadout,
  trendIcon,
  trendLabel
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    /** 当前是第几条 */
    index: { type: Number, value: 0 }
  },
  data: {
    title: '',
    summary: '',
    trendText: '',
    trendIcon: 'minus',
    direction: 'flat',
    readoutLabel: '',
    readoutValue: '',
    pager: '',
    atStart: true,
    atEnd: true
  },
  lifetimes: {
    attached() {
      // 擦洗位置。null 表示没在擦——此时读数显示最后一个点
      this.scrubbed = null
      this.setup()
    }
  },
  observers: {
    'items, index': function () {
      this.scrubbed = null
      this.build()
    }
  },
  methods: {
    setup() {
      this.createSelectorQuery()
        .select('.i-insight__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          this.canvas = item.node
          this.box = { width: item.width, height: item.height }
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          this.canvas.width = item.width * dpr
          this.canvas.height = item.height * dpr
          this.dpr = dpr
          this.build()
        })
    },

    current() {
      return this.data.items[this.data.index] || null
    },

    activeIndex() {
      const item = this.current()
      const count = item ? item.series.length : 0
      if (!count) return 0
      return this.scrubbed === null ? count - 1 : this.scrubbed
    },

    build() {
      const item = this.current()
      if (!item) return
      const trend = insightTrend(item.series)
      const readout = scrubReadout(item, this.activeIndex())
      this.setData({
        title: item.title,
        summary: item.summary,
        trendText: trendLabel(trend),
        trendIcon: trendIcon(trend),
        direction: trend.direction,
        readoutLabel: readout.label,
        readoutValue: readout.value,
        pager: `${this.data.index + 1} / ${this.data.items.length}`,
        atStart: this.data.index <= 0,
        atEnd: this.data.index >= this.data.items.length - 1
      })
      this.draw()
    },

    draw() {
      const item = this.current()
      if (!this.canvas || !this.box || !item) return
      const ctx = this.canvas.getContext('2d')
      const { width, height } = this.box
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      // fromZero 关掉：洞察看的是这段时间的起伏，从 0 起会把波动压成直线
      const scale = domainOf([{ name: '', data: item.series }], { fromZero: false })
      const span = scale.max - scale.min || 1
      // 曲线往里缩一圈，首尾的标记圆才是整圆而不是被边裁掉一半
      const { inner, inset } = insightPlot(width)
      const pointAt = (i) => ({
        x: inset + (i / Math.max(1, item.series.length - 1)) * inner,
        y: height - ((item.series[i] - scale.min) / span) * height
      })

      // 面积是氛围底，不是元素色：淡一层填充说明「线以下这片」，不参与纯色约定
      ctx.beginPath()
      ctx.moveTo(inset, height)
      for (let i = 0; i < item.series.length; i++) {
        const p = pointAt(i)
        ctx.lineTo(p.x, p.y)
      }
      ctx.lineTo(inset + inner, height)
      ctx.closePath()
      ctx.fillStyle = 'rgba(94, 124, 224, 0.14)'
      ctx.fill()

      ctx.beginPath()
      for (let i = 0; i < item.series.length; i++) {
        const p = pointAt(i)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = '#5e7ce0'
      ctx.lineWidth = 2
      ctx.stroke()

      const at = this.activeIndex()
      const marker = pointAt(at)
      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.moveTo(marker.x, 0)
      ctx.lineTo(marker.x, height)
      ctx.strokeStyle = '#c3c6cd'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.arc(marker.x, marker.y, INSIGHT_DOT_R, 0, Math.PI * 2)
      ctx.fillStyle = '#5e7ce0'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    },

    /** 触摸端只有按住才擦洗：掠过在这里不存在，move 事件本身就意味着手指在图上 */
    onScrub(e) {
      const item = this.current()
      if (!item || !this.box) return
      const touch = e.touches[0]
      // 减掉留边：曲线是缩进去画的，不减的话手指在左边缘时算出来的是负数
      const { inner, inset } = insightPlot(this.box.width)
      this.scrubbed = scrubIndex(touch.x - inset, inner, item.series.length)
      this.build()
    },

    onScrubEnd() {
      this.scrubbed = null
      this.build()
    },

    go(e) {
      const delta = Number(e.currentTarget.dataset.delta)
      this.scrubbed = null
      this.triggerEvent('indexchange', {
        index: insightPage(this.data.items.length, this.data.index, delta)
      })
    }
  }
})
