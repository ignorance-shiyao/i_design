/**
 * Rate —— 评分。
 *
 * 小程序没有 hover，因此没有悬停预览；半星靠点击位置判断——
 * 需要 x 坐标与元素宽度，这里用一次布局查询拿到。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    value: { type: Number, value: 0 },
    count: { type: Number, value: 5 },
    half: { type: Boolean, value: false },
    readonly: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    text: { type: String, value: '' },
    size: { type: Number, value: 18 }
  },
  data: { stars: [] },
  observers: {
    'value, count, half': function (value, count, half) {
      this.setData({
        stars: Array.from({ length: count }, (_, i) => ({
          index: i + 1,
          on: value >= i + 1,
          halfOn: half && value >= i + 0.5 && value < i + 1
        }))
      })
    }
  },
  methods: {
    onTap(e) {
      const { readonly, disabled, half, value } = this.data
      if (readonly || disabled) return
      const index = Number(e.currentTarget.dataset.index)

      const pick = (next) => {
        // 再点一次同一个值即清零，与 Web 端一致
        this.triggerEvent('change', { value: next === value ? 0 : next })
      }

      if (!half) {
        pick(index)
        return
      }
      this.createSelectorQuery()
        .select(`#star-${index}`)
        .boundingClientRect((rect) => {
          if (!rect) return pick(index)
          const x = e.detail.x ?? e.changedTouches?.[0]?.clientX ?? rect.left + rect.width
          pick(x - rect.left < rect.width / 2 ? index - 0.5 : index)
        })
        .exec()
    }
  }
})
