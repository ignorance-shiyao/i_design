/**
 * 洞察卡：一句结论配一条趋势线，左右翻页看下一条。
 *
 * 与 Vue 端同一份逻辑（`@i-design/common` 的 insight.ts）：分页在边界上停住、
 * 擦洗按最近的点判定。两端各写一遍的话，同一份数据在网页上能翻回去、
 * 在另一端不能，而这种偏离不会让任何构建失败。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INSIGHT_DOT_R,
  areaPath,
  domainOf,
  insightPage,
  insightPlot,
  insightTrend,
  linePath,
  scrubIndex,
  scrubReadout,
  scrubX,
  trendIcon,
  trendLabel,
  type InsightItem
} from '@i-design/common'
import { Icon } from './Icon'

export interface InsightCardsProps {
  items: InsightItem[]
  /** 当前是第几条 */
  index?: number
  onIndexChange?: (value: number) => void
}

const PLOT_H = 84

export function InsightCards({ items, index = 0, onIndexChange }: InsightCardsProps) {
  /** 擦洗到第几个点。null 表示没在擦——此时读数显示最后一个点 */
  const [scrubbed, setScrubbed] = useState<number | null>(null)

  /*
   * viewBox 的宽度取元素的实际宽度，而不是写死一个数再让 SVG 拉伸。
   * 非等比缩放会把标记的圆画成椭圆——320 的框铺到 380px 宽时那个圆横向胖近两成。
   */
  const svgRef = useRef<SVGSVGElement>(null)
  const [plotW, setPlotW] = useState(320)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setPlotW(Math.max(1, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /** 曲线往里缩一圈，首尾的标记圆才是整圆而不是被边裁掉一半 */
  const plot = insightPlot(plotW)

  const current = items[index]
  const series = current?.series ?? []
  const activeIndex = scrubbed ?? (series.length ? series.length - 1 : 0)

  // fromZero 关掉：洞察看的是这段时间的起伏，从 0 起会把一条明显的波动压成直线
  const scale = useMemo(() => domainOf([{ name: '', data: series }], { fromZero: false }), [series])

  const line = linePath(series, scale.min, scale.max, plot.inner, PLOT_H)
  const area = areaPath(series, scale.min, scale.max, plot.inner, PLOT_H)

  const markerX = scrubX(activeIndex, plot.inner, series.length)
  const value = series[activeIndex]
  const span = scale.max - scale.min || 1
  const markerY = value === undefined ? 0 : PLOT_H - ((value - scale.min) / span) * PLOT_H

  const readout = current ? scrubReadout(current, activeIndex) : { label: '', value: '' }
  const trend = insightTrend(series)

  if (!current) return null

  const go = (delta: number) => {
    setScrubbed(null)
    onIndexChange?.(insightPage(items.length, index, delta))
  }

  const onScrub = (event: React.PointerEvent<SVGSVGElement>) => {
    // buttons 为 0 表示只是掠过：指针端允许悬停擦洗，触摸端只有按住才会有 buttons
    if (event.pointerType !== 'mouse' && !event.buttons) return
    const box = event.currentTarget.getBoundingClientRect()
    // 减掉留边：曲线是缩进去画的，不减的话手指在左边缘时算出来的是负数
    setScrubbed(scrubIndex(event.clientX - box.left - plot.inset, plot.inner, series.length))
  }

  const onScrubKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!series.length) return
    if (event.key === 'ArrowLeft') setScrubbed(Math.max(0, activeIndex - 1))
    else if (event.key === 'ArrowRight') setScrubbed(Math.min(series.length - 1, activeIndex + 1))
    else if (event.key === 'Home') setScrubbed(0)
    else if (event.key === 'End') setScrubbed(series.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <section className="i-insight">
      <header className="i-insight__head">
        <h3 className="i-insight__title">{current.title}</h3>
        {/*
          涨跌同时给出图标与文字：只给箭头和红绿，色觉障碍用户与灰度打印都读不出来，
          而且也说不清涨了多少。
        */}
        <span className={`i-insight__trend i-insight__trend--${trend.direction}`}>
          <Icon name={trendIcon(trend)} size={13} />
          {trendLabel(trend)}
        </span>
      </header>

      <p className="i-insight__summary">{current.summary}</p>

      <div className="i-insight__plot">
        <svg
          ref={svgRef}
          className="i-insight__svg"
          viewBox={`0 0 ${plotW} ${PLOT_H}`}
          role="img"
          tabIndex={0}
          aria-label={`${current.title} 趋势，${trendLabel(trend)}，当前读数 ${readout.label} ${readout.value}`}
          onPointerMove={onScrub}
          onPointerDown={onScrub}
          onPointerLeave={() => setScrubbed(null)}
          onKeyDown={onScrubKey}
        >
          <g transform={`translate(${plot.inset} 0)`}>
            <path className="i-insight__area" d={area} />
            <path className="i-insight__line" d={line} />
            <line className="i-insight__cursor" x1={markerX} x2={markerX} y1={0} y2={PLOT_H} />
            <circle className="i-insight__dot" cx={markerX} cy={markerY} r={INSIGHT_DOT_R} />
          </g>
        </svg>
        {/* 读数用文字写在图外面，而不是画进 SVG：画进去的字不会跟着页面字号走 */}
        <p className="i-insight__readout" aria-live="polite">
          <span className="i-insight__readout-label">{readout.label}</span>
          <span className="i-insight__readout-value">{readout.value}</span>
        </p>
      </div>

      <footer className="i-insight__foot">
        <button
          className="i-insight__nav"
          type="button"
          aria-label="上一条洞察"
          disabled={index <= 0}
          onClick={() => go(-1)}
        >
          <Icon name="chevron-left" size={15} />
        </button>
        {/* 位置用文字而不是一排点：点只说得清「有几条」，说不清「现在是第几条」 */}
        <span className="i-insight__pager">
          {index + 1} / {items.length}
        </span>
        <button
          className="i-insight__nav"
          type="button"
          aria-label="下一条洞察"
          disabled={index >= items.length - 1}
          onClick={() => go(1)}
        >
          <Icon name="chevron-right" size={15} />
        </button>
      </footer>
    </section>
  )
}
