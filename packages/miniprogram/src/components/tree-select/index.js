/**
 * TreeSelect —— 从树里挑一个或多个节点。
 *
 * 触发器沿用 select 的外观，面板里装的就是 tree 组件本身——
 * 树的展开、半选、搜索都不在这里重写。
 */
import { flattenTree, labelPath, leafKeys } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    data: { type: Array, value: [] },
    value: { type: String, value: '' },
    checked: { type: Array, value: [] },
    multiple: { type: Boolean, value: false },
    placeholder: { type: String, value: '请选择' },
    disabled: { type: Boolean, value: false },
    searchable: { type: Boolean, value: true },
    showPath: { type: Boolean, value: true },
    separator: { type: String, value: ' / ' },
    maxDisplay: { type: Number, value: 2 }
  },
  data: { visible: false, display: '' },
  observers: {
    'data, value, checked, multiple': function () {
      this.refresh()
    }
  },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    refresh() {
      const entities = flattenTree(this.data.data)
      this.entities = entities
      this.setData({ display: this.computeDisplay(entities) })
    },

    /*
     * 多选时只展示叶子：父节点在选中集合里只是「它的子节点都选了」的推论，
     * 把它也列出来会让用户以为多选了一项。
     */
    computeDisplay(entities) {
      const { multiple, checked, value, showPath, separator, maxDisplay } = this.data
      if (multiple) {
        const leaves = leafKeys(entities, checked)
        if (!leaves.length) return ''
        const labels = leaves.map((key) => (entities.get(key) || {}).node?.label || key)
        if (labels.length <= maxDisplay) return labels.join('、')
        return `${labels.slice(0, maxDisplay).join('、')} 等 ${labels.length} 项`
      }
      if (!value) return ''
      return showPath
        ? labelPath(entities, value).join(separator)
        : (entities.get(value) || {}).node?.label || value
    },

    onToggle() {
      if (this.data.disabled) return
      this.setData({ visible: !this.data.visible })
    },

    close() {
      this.setData({ visible: false })
    },

    onSelect(event) {
      const { key, node } = event.detail
      // 单选选完即收起；多选要留着让用户继续勾
      this.setData({ visible: false })
      this.triggerEvent('change', { value: key, node })
    },

    onCheckChange(event) {
      this.triggerEvent('checkchange', { keys: event.detail.keys })
    }
  }
})
