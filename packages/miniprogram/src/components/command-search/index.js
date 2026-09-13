/**
 * CommandSearch —— 命令搜索。
 *
 * 一个搜索框，一串实时过滤的结果。排序与匹配走公共层：
 * 同一个词在小程序里给出的第一条与 Web 端不一样的话，搜索就不值得信。
 *
 * 这一端没有真正的键盘导航（软键盘上没有方向键），因此上下键相关的部分
 * 不在这里出现；命中高亮仍然要有——WXML 不能调用函数，所以切片在 JS 里算好。
 */
import { searchCommands } from '@i-design/common'
import { getLocale } from '../../config'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    open: { type: Boolean, value: false },
    placeholder: { type: String, value: '' },
    limit: { type: Number, value: 20 }
  },
  data: { keyword: '', rows: [], searchText: '' },
  lifetimes: {
    attached() {
      this.setData({ searchText: getLocale().search })
      this.build()
    }
  },
  observers: {
    'items, limit': function () {
      this.build()
    },
    open: function (open) {
      // 每次打开都从空查询开始：上一次搜过什么与这一次要找什么没有关系
      if (open) this.setData({ keyword: '' }, () => this.build())
    }
  },
  methods: {
    build() {
      const matches = searchCommands(this.data.items || [], this.data.keyword, this.data.limit)
      this.setData({
        rows: matches.map((match) => ({
          key: match.item.key,
          description: match.item.description || '',
          group: match.item.group || '',
          // 只高亮标题上的命中：把整行都标起来反而看不出重点
          parts: this.parts(match.item.label, match.ranges)
        }))
      })
    },

    parts(label, ranges) {
      if (!ranges.length) return [{ text: label, hit: false }]
      const [from, to] = ranges[0]
      return [
        { text: label.slice(0, from), hit: false },
        { text: label.slice(from, to), hit: true },
        { text: label.slice(to), hit: false }
      ].filter((p) => p.text)
    },

    onInput(event) {
      this.setData({ keyword: event.detail.value }, () => this.build())
    },

    choose(event) {
      const key = event.currentTarget.dataset.key
      const item = (this.data.items || []).find((i) => i.key === key)
      if (item) this.triggerEvent('select', item)
      this.close()
    },

    /* 面板内部的点击不该穿透到遮罩上去，否则点一下列表就把面板关了 */
    noop() {},

    close() {
      this.triggerEvent('update:open', false)
      this.triggerEvent('close')
    }
  }
})
