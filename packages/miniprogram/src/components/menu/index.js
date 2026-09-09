/** Menu —— 导航菜单。展开与手风琴规则复用 logic/menu，与 Web 端同一份判断。 */
import { accordionOpenKeys, menuEntities, openKeysFor } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    items: { type: Array, value: [] },
    value: { type: String, value: '' },
    accordion: { type: Boolean, value: false },
    collapsed: { type: Boolean, value: false }
  },
  data: { rows: [], open: [] },
  observers: {
    'items, value': function () { this.rebuild() }
  },
  lifetimes: { attached() { this.rebuild() } },
  methods: {
    rebuild() {
      const entities = menuEntities(this.data.items)
      this.entities = entities
      // 选中项的祖先必须展开，否则它藏在收起的分组里
      const open = this.data.value ? openKeysFor(entities, this.data.value, this.data.open) : this.data.open
      this.setData({
        open,
        rows: this.data.items.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon || '',
          disabled: !!item.disabled,
          active: this.data.value === item.key,
          isGroup: !!(item.children && item.children.length),
          expanded: open.indexOf(item.key) !== -1,
          children: (item.children || []).map((child) => ({
            key: child.key,
            label: child.label,
            icon: child.icon || '',
            disabled: !!child.disabled,
            active: this.data.value === child.key
          }))
        }))
      })
    },
    onToggle(e) {
      const key = e.currentTarget.dataset.key
      const open = this.data.accordion
        ? accordionOpenKeys(this.entities, this.data.open, key)
        : this.data.open.indexOf(key) !== -1
          ? this.data.open.filter((k) => k !== key)
          : this.data.open.concat(key)
      this.setData({ open }, () => this.rebuild())
    },
    onSelect(e) {
      const { key, disabled } = e.currentTarget.dataset
      if (disabled) return
      this.triggerEvent('change', { key })
    }
  }
})
