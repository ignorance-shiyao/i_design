/**
 * Dropdown —— 下拉菜单，收纳次级操作。
 *
 * 小程序里拿不到同步的元素尺寸，位置要用 boundingClientRect 异步查询。
 * 定位规则本身与 Web 端共用 resolveOverlay，因此「贴边推回视口」这类判断
 * 不会因为换了一端就丢掉。
 */
import { firstMenuActive, resolveOverlay } from '@i-design/common'

Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: {
    items: { type: Array, value: [] },
    placement: { type: String, value: 'bottom' },
    disabled: { type: Boolean, value: false }
  },
  data: { visible: false, left: 0, top: 0, active: -1 },
  methods: {
    onToggle() {
      if (this.data.disabled) return
      if (this.data.visible) return this.close()
      this.setData(
        { visible: true, active: firstMenuActive(this.selectableFlags()) },
        () => this.place()
      )
    },

    close() {
      this.setData({ visible: false, active: -1 })
    },

    /** 分隔线与分组标题不参与导航 */
    selectableFlags() {
      return this.data.items.map((item) => ({
        disabled: item.disabled,
        divider: !!item.divider || !!item.group
      }))
    },

    place() {
      const query = this.createSelectorQuery()
      query.select('.i-overlay-trigger').boundingClientRect()
      query.select('.i-dropdown').boundingClientRect()
      query.selectViewport().boundingClientRect()
      query.exec((res) => {
        const [trigger, popup, viewport] = res
        if (!trigger || !popup || !viewport) return
        const pos = resolveOverlay({
          trigger,
          popup,
          viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
          placement: this.data.placement,
          offset: 4,
          // 菜单通常比触发按钮宽，居中会向左溢出压住旁边的内容
          align: 'start'
        })
        this.setData({ left: pos.x, top: pos.y })
      })
    },

    onSelect(event) {
      const index = event.currentTarget.dataset.index
      const item = this.data.items[index]
      if (!item || item.disabled || item.divider || item.group) return
      this.close()
      this.triggerEvent('select', { key: item.key })
    }
  }
})
