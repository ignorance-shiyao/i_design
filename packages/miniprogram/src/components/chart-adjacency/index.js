/**
 * 档位与口径都来自 common；这里只把模型摊成 WXML 好渲染的形状。
 * 「无边 / 未观测 / 零权」必须在投影时就分好——在 WXML 里再判一次，迟早和 Web 对不上。
 */
import { adjacencyShade } from '@i-design/common'

Component({
  options: { addGlobalClass: true },
  properties: {
    model: { type: Object, value: null },
    title: { type: String, value: '邻接矩阵' },
    selectedRow: { type: Number, value: -1 },
    selectedCol: { type: Number, value: -1 }
  },
  data: {
    headers: [],
    rows: [],
    zeroCount: 0,
    sortLabel: '',
    ready: false
  },
  observers: {
    'model, selectedRow, selectedCol': function () {
      this.project()
    }
  },
  lifetimes: {
    attached() {
      this.project()
    }
  },
  methods: {
    select(event) {
      const { row, col } = event.currentTarget.dataset
      this.triggerEvent('select', { row: Number(row), col: Number(col) })
    },
    project() {
      const model = this.data.model
      if (!model || model.state !== 'ready') {
        this.setData({ headers: [], rows: [], zeroCount: 0, ready: false, sortLabel: '' })
        return
      }
      const headers = model.nodes.map((node) => node.label)
      let zeroCount = 0
      const rows = model.cells.map((row, rowIndex) => ({
        id: model.nodes[rowIndex].id,
        label: model.nodes[rowIndex].label,
        degree: model.nodes[rowIndex].degree,
        cells: row.map((cell, colIndex) => {
          if (cell.state === 'ready' && cell.value === 0) zeroCount += 1
          let shadeClass = 'is-absent'
          let stateLabel = '无边'
          if (cell.state === 'unknown') {
            shadeClass = 'is-unknown'
            stateLabel = '未观测'
          } else if (cell.state === 'ready') {
            const step = adjacencyShade(cell, model.min, model.max)
            shadeClass = step === null ? 'is-absent' : `is-s${step}`
            stateLabel = cell.value === 0 ? '零权' : ''
          }
          return {
            rowIndex,
            colIndex,
            valueText: cell.valueText,
            description: cell.description,
            shadeClass,
            stateLabel,
            selected: this.data.selectedRow === rowIndex && this.data.selectedCol === colIndex
          }
        })
      }))
      const sortLabel =
        model.sort === 'input' ? '输入序' : model.sort === 'degree' ? '度数' : '社群'
      this.setData({
        headers,
        rows,
        zeroCount,
        ready: true,
        sortLabel,
        directed: model.directed,
        counts: model.counts,
        caption: model.caption,
        basis: model.basis,
        excluded: model.excluded
      })
    }
  }
})
