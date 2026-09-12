import { useMemo, useState } from 'react'
import {
  daysBetween,
  ganttBars,
  ganttCycle,
  ganttDomain,
  ganttLinks,
  ganttTicks,
  ganttTodayX,
  type GanttTask
} from '@i-design/common'

export interface ChartGanttProps {
  tasks: GanttTask[]
  title?: string
  /** 一天占多少像素。周期长的排期调小它，一屏就能看全 */
  dayWidth?: number
  rowHeight?: number
  /** 覆盖「今天」，主要用于文档与测试里让截图稳定 */
  today?: string
  className?: string
}

const NAME_W = 132
const HEADER_H = 28
const BAR_H = 18

/**
 * 甘特图。
 *
 * 排期图回答的是「谁挡着谁、现在落后了没有」，因此依赖线与今天这条竖线是主体，
 * 横条只是把工期画出来。时间域、条形坐标与依赖折线全部来自 logic/gantt。
 */
export function ChartGantt({
  tasks,
  title = '',
  dayWidth = 18,
  rowHeight = 34,
  today = '',
  className = ''
}: ChartGanttProps) {
  const [active, setActive] = useState(-1)
  const [showTable, setShowTable] = useState(false)

  const day = today || new Date().toISOString().slice(0, 10)
  const domain = useMemo(() => ganttDomain(tasks), [tasks])
  const bars = useMemo(
    () => ganttBars(tasks, domain, { dayWidth, rowHeight, barHeight: BAR_H, today: day }),
    [tasks, domain, dayWidth, rowHeight, day]
  )
  const links = useMemo(() => ganttLinks(bars), [bars])
  const ticks = useMemo(() => ganttTicks(domain, dayWidth, day), [domain, dayWidth, day])
  const todayX = ganttTodayX(domain, dayWidth, day)
  /*
   * 依赖成环时不画依赖线。成环的排期画出来是一团互相指的箭头，
   * 看图的人只会以为是渲染坏了——与其画一张读不出结论的图，不如明说数据有环。
   */
  const cycle = useMemo(() => ganttCycle(tasks), [tasks])

  const chartW = domain.days * dayWidth
  const chartH = tasks.length * rowHeight
  const percent = (v?: number) => `${Math.round((v ?? 0) * 100)}%`

  return (
    <figure className={`i-chart i-gantt ${className}`.trim()}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      {cycle.length > 0 && (
        <p className="i-gantt__warn" role="status">
          {/* 图标 + 文字，颜色不是唯一线索 */}
          <span className="i-gantt__warn-icon" aria-hidden="true">!</span>
          任务 {cycle.join(' → ')} 的依赖构成了环，已不画依赖线
        </p>
      )}

      <div className="i-gantt__frame">
        {/* 任务名固定在左侧，横向滚动时不跟着走：滚出去之后就对不上是哪一行了 */}
        <div className="i-gantt__names" style={{ width: NAME_W }}>
          <div className="i-gantt__names-head" style={{ height: HEADER_H }}>任务</div>
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`i-gantt__name${active === i ? ' is-active' : ''}`}
              style={{ height: rowHeight }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(-1)}
            >
              {task.name}
            </div>
          ))}
        </div>

        <div className="i-gantt__scroll">
          <svg
            className="i-gantt__svg"
            width={chartW}
            height={chartH + HEADER_H}
            viewBox={`0 0 ${chartW} ${chartH + HEADER_H}`}
            role="img"
            aria-label={title || '甘特图'}
            onMouseLeave={() => setActive(-1)}
          >
            {/* 周分隔线在最底层，压不住任何数据 */}
            {ticks.map((tick) => (
              <line
                key={tick.iso}
                className="i-chart__grid"
                x1={tick.x}
                x2={tick.x}
                y1={0}
                y2={chartH + HEADER_H}
              />
            ))}
            {ticks.map((tick) => (
              <text
                key={`t-${tick.iso}`}
                className={`i-chart__tick${tick.current ? ' is-current' : ''}`}
                x={tick.x + 4}
                y={18}
              >
                {tick.label}
              </text>
            ))}

            {/* 今天：一条竖线，位置本身就是信息，不需要文字标注 */}
            {todayX >= 0 && (
              <line className="i-gantt__today" x1={todayX} x2={todayX} y1={HEADER_H} y2={chartH + HEADER_H} />
            )}

            {/* 依赖线走折线：直线会斜穿过中间几行的横条，读者分不清连的是哪两根 */}
            {cycle.length === 0 &&
              links.map((link) => (
                <polyline
                  key={link.id}
                  className="i-gantt__link"
                  points={link.points.map((v, i) => (i % 2 ? v + HEADER_H : v)).join(',')}
                />
              ))}

            {bars.map((bar, i) => {
              const cy = bar.y + HEADER_H + BAR_H / 2
              return (
                <g
                  key={bar.id}
                  className={`i-gantt__bar${active === i ? ' is-active' : ''}${bar.overdue ? ' is-overdue' : ''}`}
                  onMouseEnter={() => setActive(i)}
                >
                  {/* 里程碑是零工期的时点，画成菱形：一天宽的横条会被当成一天的工作量 */}
                  {bar.milestone ? (
                    <polygon
                      className="i-gantt__milestone"
                      points={`${bar.x},${cy - 8} ${bar.x + 8},${cy} ${bar.x},${cy + 8} ${bar.x - 8},${cy}`}
                    />
                  ) : (
                    <>
                      <rect
                        className="i-gantt__track"
                        x={bar.x}
                        y={bar.y + HEADER_H}
                        width={bar.width}
                        height={BAR_H}
                        rx={3}
                      />
                      {/* 进度层叠在轨道上，同色更深；只用长度表示完成度，不另起一种颜色 */}
                      {bar.progressWidth > 0 && (
                        <rect
                          className="i-gantt__progress"
                          x={bar.x}
                          y={bar.y + HEADER_H}
                          width={bar.progressWidth}
                          height={BAR_H}
                          rx={3}
                        />
                      )}
                    </>
                  )}
                  <title>{`${bar.name}：${bar.start} → ${bar.end}，完成 ${percent(bar.progress)}`}</title>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="i-chart__legend">
        <span className="i-chart__legend-item"><span className="i-gantt__swatch is-track" />计划</span>
        <span className="i-chart__legend-item"><span className="i-gantt__swatch is-progress" />已完成</span>
        <span className="i-chart__legend-item"><span className="i-gantt__swatch is-overdue" />已逾期</span>
        <span className="i-chart__legend-item"><span className="i-gantt__swatch is-milestone" />里程碑</span>
      </div>

      <button className="i-chart__table-toggle" onClick={() => setShowTable((v) => !v)}>
        {showTable ? '收起数据表' : '查看数据表'}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>任务</th><th>开始</th><th>结束</th><th>工期</th><th>完成</th><th>状态</th></tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={task.id}>
                <td>{task.name}</td>
                <td>{task.start}</td>
                <td>{task.end}</td>
                <td>{task.milestone ? '里程碑' : `${daysBetween(task.start, task.end) + 1} 天`}</td>
                <td>{percent(task.progress)}</td>
                <td>{bars[i]?.overdue ? '已逾期' : '正常'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
