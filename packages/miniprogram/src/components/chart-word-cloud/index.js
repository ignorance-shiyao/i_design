/**
 * ChartWordCloud —— 词云。
 * 字号映射与螺线避让走共享的 logic/wordcloud，
 * 各端不会一个把权重线性映射成字号、一个开平方。
 */
import { WORD_MAX_SIZE, wordLayout, wordOverflow, wordTone } from '@i-design/common'

/*
 * 小程序 canvas 取不到 CSS 变量，只能写成常量——值与令牌保持一致。
 * 三档颜色只强化「大小」这一个已有的编码，不承担独立含义，
 * 因此色觉障碍下不丢信息。品牌色只给最大的那几个词：
 * 它作为大字达到 3:1，落到小字上就不够了。
 */
const TONE = { strong: '#5e7ce0', base: '#1d2129', muted: '#575d6c' }

Component({
  options: { addGlobalClass: true },
  properties: {
    words: { type: Array, value: [] },
    title: { type: String, value: '' },
    width: { type: Number, value: 640 },
    height: { type: Number, value: 320 },
    rotate: { type: Boolean, value: true }
  },
  data: { rows: [], dropped: 0 },
  observers: { words: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      this.setData(
        {
          rows: [...this.data.words].sort((a, b) => b.value - a.value)
        },
        () => this.draw()
      )
    },

    draw() {
      const { words, width, height, rotate } = this.data
      if (!words.length) return
      this.createSelectorQuery()
        .select('.i-wordcloud__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, width, height)

          /*
           * 先按基准字号量一遍宽度，布局全靠它——
           * 按「字数 × 字号」估的话，中文尚可、拉丁字母能差出一倍，
           * 直接后果是词叠在一起。
           */
          ctx.font = WORD_MAX_SIZE + 'px sans-serif'
          // 高度取实际行盒：字号是 em 方框，字形连同升部降部要比它高一成多，
          // 拿字号当高度，上下相邻的两个词会啃掉那一成压在一起
          const m = ctx.measureText('设计Ag')
          const lineHeight =
            (m.fontBoundingBoxAscent || 0) + (m.fontBoundingBoxDescent || 0) || WORD_MAX_SIZE * 1.2

          const measured = words.map((w) => ({
            text: w.text,
            value: w.value,
            width: ctx.measureText(w.text).width,
            height: lineHeight
          }))

          const placed = wordLayout(measured, width, height, { rotate })
          this.setData({ dropped: wordOverflow(words, placed) })

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          for (const word of placed) {
            ctx.save()
            ctx.translate(word.x, word.y)
            // 竖排只给短词：长词竖过来会戳出画布上下沿
            if (word.rotated) ctx.rotate(-Math.PI / 2)
            ctx.font = word.fontSize + 'px sans-serif'
            ctx.fillStyle = TONE[wordTone(word.slot, placed.length)]
            ctx.fillText(word.text, 0, 0)
            ctx.restore()
          }
        })
    }
  }
})
