/**
 * Cascader —— 级联选择，省市区这类层级数据。
 *
 * 列的生成与「换列时截断右侧旧列」都用共享的 cascaderColumns / cascaderActivate：
 * 只往路径尾部追加而不截断，是级联选择最常见的错误，各端不该各错一遍。
 */
import {
  cascaderActivate,
  cascaderColumns,
  flattenTree,
  labelPath,
  nodePath
} from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    data: { type: Array, value: [] },
    value: { type: String, value: '' },
    placeholder: { type: String, value: '请选择' },
    disabled: { type: Boolean, value: false },
    changeOnSelect: { type: Boolean, value: false },
    separator: { type: String, value: ' / ' }
  },
  data: { visible: false, columns: [], display: '', active: [] },
  observers: {
    'data, value': function () {
      this.rebuild()
    }
  },
  lifetimes: { attached() { this.rebuild() } },
  methods: {
    rebuild() {
      const entities = flattenTree(this.data.data)
      this.entities = entities
      // 打开时从当前值恢复路径，用户看到的是上次停在哪儿
      const active = this.data.active.length
        ? this.data.active
        : this.data.value
          ? nodePath(entities, this.data.value)
          : []
      const columns = cascaderColumns(this.data.data, entities, active).map((column, level) =>
        column.map((node) => ({
          key: node.key,
          label: node.label,
          disabled: !!node.disabled,
          hasChildren: !!(node.children && node.children.length),
          active: active[level] === node.key,
          selected: this.data.value === node.key
        }))
      )
      this.setData({
        active,
        columns,
        display: this.data.value ? labelPath(entities, this.data.value).join(this.data.separator) : ''
      })
    },

    onToggle() {
      if (this.data.disabled) return
      this.setData({ visible: !this.data.visible })
    },

    close() {
      this.setData({ visible: false })
    },

    onPick(event) {
      const { key, disabled, leaf } = event.currentTarget.dataset
      if (disabled) return
      const active = cascaderActivate(this.entities, this.data.active, key)
      this.setData({ active }, () => this.rebuild())
      if (leaf || this.data.changeOnSelect) {
        this.triggerEvent('change', { key, path: nodePath(this.entities, key) })
      }
      // 只有选到叶子才算完成，收起面板；中间层级要留着让用户继续往下走
      if (leaf) this.setData({ visible: false })
    }
  }
})
