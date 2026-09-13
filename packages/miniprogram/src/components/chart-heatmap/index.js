/**
 * ChartHeatmap —— 二维密度。
 *
 * 用 view 而不是 canvas 画：格子里的数字要能被读屏读到，
 * 画进 canvas 就只剩一张图片。单色阶而不是彩虹——彩虹会让读者以为颜色代表类别。
 */
import { contrastText, formatTick, heatLevel } from '@i-design/common'

const SEQ = ['#eef3ff', '#adc4ff', '#7ea1ff', '#5e7ce0', '#3a4da3']

Component({
  options: { addGlobalClass: true },
  properties: {
    matrix: { type: Array, value: [] },
    rows: { type: Array, value: [] },
    columns: { type: Array, value: [] },
    title: { type: String, value: '' },
    unit: { type: String, value: '' }
  },
  data: { grid: [], scale: SEQ, minText: '', maxText: '' },
  observers: {
    'matrix, rows': function (matrix, rows) {
      const flat = matrix.reduce((all, row) => all.concat(row), [])
      if (!flat.length) return
      const min = Math.min(...flat)
      const max = Math.max(...flat)
      this.setData({
        minText: formatTick(min),
        maxText: formatTick(max),
        grid: matrix.map((row, r) => ({
          label: rows[r],
          cells: row.map((value) => {
            const level = heatLevel(value, min, max, 5)
            return {
              text: formatTick(value),
              background: SEQ[level],
              /*
               * 文字色按这一格的实际底色算，而不是按档位硬判。
               * 按档位判断的前提是「档位越高底色越深」，暗色主题的色阶方向是反的——
               * 浅色格子上写浅色字，数字基本看不见。
               */
              color: contrastText(SEQ[level])
            }
          })
        }))
      })
    }
  }
})
