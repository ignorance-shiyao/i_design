/**
 * ChartGantt —— 甘特图。
 * 时间域、条形坐标与依赖折线全部走共享的 logic/gantt，
 * 各端不会在「工期含不含首尾」「时间域裁到哪」上分叉。
 */
import {
  daysBetween,
  ganttBars,
  ganttCycle,
  ganttDomain,
  ganttLinks,
  ganttTicks,
  ganttTodayX
} from '@i-design/common'

/*
 * 小程序 canvas 取不到 CSS 变量，只能写成常量——值与令牌保持一致。
 * 进度用同色更深的一层，不另起颜色；逾期换警示色，同时表里写明「已逾期」，
 * 颜色不作为唯一线索。
 */
const COLOR = {
  track: '#dbe3fb',
  progress: '#5e7ce0',
  overdueTrack: '#f7dcdb',
  overdue: '#c2413d',
  milestone: '#1d2129',
  grid: '#e5e6eb',
  link: '#8a8e99',
  tick: '#86909c',
  current: '#5e7ce0'
}

const HEADER_H = 28
const BAR_H = 18

Component({
  options: { addGlobalClass: true },
  properties: {
    tasks: { type: Array, value: [] },
    title: { type: String, value: '' },
    /** 一天占多少像素。周期长的排期调小它，一屏就能看全 */
    dayWidth: { type: Number, value: 18 },
    rowHeight: { type: Number, value: 34 },
    /** 覆盖「今天」，主要用于让文档截图稳定 */
    today: { type: String, value: '' }
  },
  data: { rows: [], cycle: '', chartW: 0, chartH: 0 },
  observers: { tasks: function () { this.refresh() } },
  lifetimes: { attached() { this.refresh() } },
  methods: {
    today_() {
      return this.data.today || new Date().toISOString().slice(0, 10)
    },
    refresh() {
      const { tasks, dayWidth, rowHeight } = this.data
      if (!tasks.length) return
      const today = this.today_()
      const domain = ganttDomain(tasks)
      const bars = ganttBars(tasks, domain, { dayWidth, rowHeight, barHeight: BAR_H, today })
      const cycle = ganttCycle(tasks)
      this.setData(
        {
          cycle: cycle.join(' → '),
          chartW: domain.days * dayWidth,
          chartH: tasks.length * rowHeight,
          rows: tasks.map((t, i) => ({
            name: t.name,
            start: t.start,
            end: t.end,
            span: t.milestone ? '里程碑' : daysBetween(t.start, t.end) + 1 + ' 天',
            progress: Math.round((t.progress || 0) * 100) + '%',
            status: bars[i] && bars[i].overdue ? '已逾期' : '正常'
          }))
        },
        () => this.draw()
      )
    },

    draw() {
      const { tasks, dayWidth, rowHeight, chartW, chartH } = this.data
      if (!tasks.length) return
      this.createSelectorQuery()
        .select('.i-gantt__canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const item = res && res[0]
          if (!item || !item.node) return
          const canvas = item.node
          const ctx = canvas.getContext('2d')
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2
          const H = chartH + HEADER_H
          canvas.width = chartW * dpr
          canvas.height = H * dpr
          ctx.scale(dpr, dpr)
          ctx.clearRect(0, 0, chartW, H)

          const today = this.today_()
          const domain = ganttDomain(tasks)
          const bars = ganttBars(tasks, domain, { dayWidth, rowHeight, barHeight: BAR_H, today })
          const ticks = ganttTicks(domain, dayWidth, today)
          const cycle = ganttCycle(tasks)

          // 周分隔线在最底层，压不住任何数据
          ctx.lineWidth = 1
          ctx.font = '11px sans-serif'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          for (const tick of ticks) {
            ctx.strokeStyle = COLOR.grid
            ctx.beginPath()
            ctx.moveTo(tick.x, 0)
            ctx.lineTo(tick.x, H)
            ctx.stroke()
            ctx.fillStyle = tick.current ? COLOR.current : COLOR.tick
            ctx.fillText(tick.label, tick.x + 4, 14)
          }

          // 今天：一条虚线，位置本身就是信息，不需要文字标注
          const todayX = ganttTodayX(domain, dayWidth, today)
          if (todayX >= 0) {
            ctx.strokeStyle = COLOR.progress
            ctx.setLineDash([3, 3])
            ctx.beginPath()
            ctx.moveTo(todayX, HEADER_H)
            ctx.lineTo(todayX, H)
            ctx.stroke()
            ctx.setLineDash([])
          }

          /*
           * 依赖成环时不画依赖线：成环的排期画出来是一团互相指的箭头，
           * 看图的人只会以为是渲染坏了。组件在图上方给出文字说明。
           */
          if (!cycle.length) {
            ctx.strokeStyle = COLOR.link
            ctx.globalAlpha = 0.6
            for (const link of ganttLinks(bars)) {
              const p = link.points
              ctx.beginPath()
              ctx.moveTo(p[0], p[1] + HEADER_H)
              for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1] + HEADER_H)
              ctx.stroke()
            }
            ctx.globalAlpha = 1
          }

          for (const bar of bars) {
            const y = bar.y + HEADER_H
            if (bar.milestone) {
              // 里程碑是零工期的时点，画成菱形：一天宽的横条会被当成一天的工作量
              const cy = y + BAR_H / 2
              ctx.fillStyle = COLOR.milestone
              ctx.beginPath()
              ctx.moveTo(bar.x, cy - 8)
              ctx.lineTo(bar.x + 8, cy)
              ctx.lineTo(bar.x, cy + 8)
              ctx.lineTo(bar.x - 8, cy)
              ctx.closePath()
              ctx.fill()
              continue
            }
            ctx.fillStyle = bar.overdue ? COLOR.overdueTrack : COLOR.track
            ctx.fillRect(bar.x, y, bar.width, BAR_H)
            if (bar.progressWidth > 0) {
              ctx.fillStyle = bar.overdue ? COLOR.overdue : COLOR.progress
              ctx.fillRect(bar.x, y, bar.progressWidth, BAR_H)
            }
          }
        })
    }
  }
})
