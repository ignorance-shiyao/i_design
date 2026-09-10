import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  clampWindow,
  linePath,
  panWindow,
  windowFromRatio,
  windowRatio,
  type ZoomWindow
} from '@i-design/common'

export interface ChartZoomProps {
  /** 全量数据，只用来画缩略走势 */
  values: number[]
  labels?: string[]
  window: ZoomWindow
  /** 窗口最少包含几个点 */
  minSpan?: number
  height?: number
  onChange?: (win: ZoomWindow) => void
}

const W = 640
type DragMode = 'left' | 'right' | 'move' | null

export function ChartZoom({
  values,
  labels = [],
  window: win,
  minSpan = 3,
  height = 48,
  onChange
}: ChartZoomProps) {
  const track = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ mode: DragMode; x: number; win: ZoomWindow }>({
    mode: null,
    x: 0,
    win
  })
  const [, force] = useState(0)

  /* 缩略走势：只表达形状，不需要坐标轴 */
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  // 上下各留 6px：贴着边缘的折线看起来像被裁掉了
  const preview = values.length > 1 ? linePath(values, min, max === min ? min + 1 : max, W, height - 12) : ''

  const ratio = windowRatio(win, values.length)
  const leftPct = `${ratio.from * 100}%`
  const widthPct = `${(ratio.to - ratio.from) * 100}%`

  const rangeText = labels.length
    ? `${labels[win.start] ?? ''} – ${labels[win.end] ?? ''}`
    : `${win.start + 1} – ${win.end + 1}`

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const state = drag.current
      if (!state.mode) return
      const box = track.current?.getBoundingClientRect()
      if (!box) return

      if (state.mode === 'move') {
        // 位移换算成下标增量：按像素直接改下标会让长序列拖不动
        const delta = ((event.clientX - state.x) / box.width) * Math.max(1, values.length - 1)
        onChange?.(panWindow(state.win, delta, values.length))
        return
      }
      const r = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
      const current = windowRatio(win, values.length)
      const other = state.mode === 'left' ? current.to : current.from
      onChange?.(
        windowFromRatio(Math.min(r, other), Math.max(r, other), values.length, minSpan)
      )
    }
    const up = () => {
      drag.current.mode = null
      force((n) => n + 1)
    }
    globalThis.addEventListener('pointermove', move)
    globalThis.addEventListener('pointerup', up)
    return () => {
      globalThis.removeEventListener('pointermove', move)
      globalThis.removeEventListener('pointerup', up)
    }
  }, [values.length, minSpan, onChange, win])

  const down = (mode: DragMode) => (event: PointerEvent) => {
    drag.current = { mode, x: event.clientX, win }
    event.preventDefault()
    event.stopPropagation()
  }

  /* 键盘：手柄要能不靠鼠标操作，方向键移动、Home/End 归位 */
  const key = (which: 'left' | 'right') => (event: KeyboardEvent) => {
    const step = event.shiftKey ? 5 : 1
    const dir = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
    if (!dir && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()

    const next = { ...win }
    const field = which === 'left' ? 'start' : 'end'
    if (event.key === 'Home') next[field] = 0
    else if (event.key === 'End') next[field] = values.length - 1
    else next[field] += dir
    onChange?.(clampWindow(next, values.length, minSpan))
  }

  return (
    <div className="i-zoom">
      <div ref={track} className="i-zoom__track" style={{ height }}>
        <svg
          className="i-zoom__preview"
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={preview} />
        </svg>

        {/* 窗口之外压暗：被排除的区间仍然可见，用户才知道自己漏看了什么 */}
        <div className="i-zoom__mask" style={{ left: 0, width: leftPct }} />
        <div className="i-zoom__mask" style={{ left: `calc(${leftPct} + ${widthPct})`, right: 0 }} />

        <div
          className="i-zoom__window"
          style={{ left: leftPct, width: widthPct }}
          onPointerDown={down('move')}
        >
          <span
            className="i-zoom__handle is-left"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={values.length - 1}
            aria-valuenow={win.start}
            aria-label="起点"
            onPointerDown={down('left')}
            onKeyDown={key('left')}
          />
          <span
            className="i-zoom__handle is-right"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={values.length - 1}
            aria-valuenow={win.end}
            aria-label="终点"
            onPointerDown={down('right')}
            onKeyDown={key('right')}
          />
        </div>
      </div>

      <div className="i-zoom__foot">
        <span className="i-zoom__range">{rangeText}</span>
        <button
          className="i-zoom__reset"
          onClick={() =>
            onChange?.(clampWindow({ start: 0, end: values.length - 1 }, values.length, minSpan))
          }
        >
          重置
        </button>
      </div>
    </div>
  )
}
