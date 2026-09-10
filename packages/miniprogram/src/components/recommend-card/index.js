/** RecommendCard —— 智能体的主动建议，带置信度分档。 */
import { confidenceOf } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    confidence: { type: Number, value: 0.8 },
    acceptText: { type: String, value: '采纳' },
    alternativeText: { type: String, value: '换一个' },
    showAlternative: { type: Boolean, value: true }
  },
  data: { level: null, bars: [] },
  observers: {
    confidence: function (v) {
      const level = confidenceOf(v)
      // 三格的点亮状态在这里算好：WXML 里做不了比较运算
      this.setData({ level, bars: [1, 2, 3].map((n) => ({ n, on: n <= level.bars })) })
    }
  },
  methods: {
    onAccept() { this.triggerEvent('accept') },
    onAlternative() { this.triggerEvent('alternative') }
  }
})
