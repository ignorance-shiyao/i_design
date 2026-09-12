/**
 * ToolChips —— 工具芯片。
 *
 * 把一串工具调用压成一行行芯片：一行里只留「做了什么」与「动了多少」。
 * 统计的写法与折叠汇总走公共层——同一次调用在这一端写「13 增 4 删」、
 * 在 Web 上写「+13 −4」的话，读者会以为是两件事。
 *
 * WXML 不能调用函数，所以每片要显示什么都在 JS 里算好。
 */
import { summarizeToolChips, toolChipIcon, toolChipStat } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    /** 超过这个数量就折叠；0 表示不折叠 */
    max: { type: Number, value: 0 },
    expanded: { type: Boolean, value: false }
  },
  data: { rows: [], clipped: false, moreText: '', hiddenStat: '', failedText: '' },
  lifetimes: {
    attached() {
      this.build()
    }
  },
  observers: {
    'items, max, expanded': function () {
      this.build()
    }
  },
  methods: {
    build() {
      const items = this.data.items || []
      const max = this.data.max
      const clipped = max > 0 && items.length > max && !this.data.expanded
      const shown = clipped ? items.slice(0, max) : items
      const hidden = summarizeToolChips(items.slice(shown.length))
      const locale = getLocale()

      this.setData({
        clipped,
        rows: shown.map((item) => ({
          key: item.key,
          label: item.label,
          status: item.status || 'success',
          icon: toolChipIcon(item.status),
          added: item.added || 0,
          removed: item.removed || 0,
          hasStat: !!toolChipStat(item.added, item.removed)
        })),
        // 折叠时把被藏起来那部分的统计顶在按钮上：折叠不该等于把信息删掉
        moreText: locale.toolMoreText(items.length - shown.length),
        hiddenStat: toolChipStat(hidden.added, hidden.removed),
        failedText: hidden.failed ? locale.toolFailedText(hidden.failed) : ''
      })
    },

    choose(event) {
      const key = event.currentTarget.dataset.key
      const item = (this.data.items || []).find((i) => i.key === key)
      if (item) this.triggerEvent('select', item)
    },

    expand() {
      this.triggerEvent('update:expanded', true)
      this.triggerEvent('expand')
    }
  }
})
