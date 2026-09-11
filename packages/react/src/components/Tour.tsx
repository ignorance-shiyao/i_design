import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  rafThrottle,
  resolveOverlay,
  tourHole,
  tourNeedsScroll,
  tourNext,
  tourPrev,
  tourScrollTo,
  type TourHole,
  type TourStep
} from '@i-design/common'
import { Button } from './Button'
import { Icon } from './Icon'

export interface TourProps {
  steps: TourStep[]
  /** 当前步；-1 表示不显示 */
  index?: number
  onIndexChange?: (index: number) => void
  /** 高亮框向外扩多少 */
  padding?: number
  onFinish?: () => void
  onSkip?: () => void
}

export function Tour({
  steps,
  index = -1,
  onIndexChange,
  padding = 6,
  onFinish,
  onSkip
}: TourProps) {
  const pop = useRef<HTMLDivElement>(null)
  const [hole, setHole] = useState<TourHole | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'bottom' as string })

  const step = steps[index] ?? null
  const isLast = index === steps.length - 1

  const locate = useCallback(async () => {
    const current = steps[index]
    if (!current) {
      setHole(null)
      return
    }
    const target = document.querySelector(current.target)
    if (!target) {
      // 目标不存在（页面还没渲染到那一块）：不画洞，气泡居中，引导仍然能走完
      setHole(null)
      return
    }

    let rect = target.getBoundingClientRect()
    // 目标不在视口里就先滚到正中：滚到刚好露出来的话，气泡多半没地方放
    if (tourNeedsScroll(rect, { height: window.innerHeight })) {
      window.scrollTo({
        top: tourScrollTo(rect, { height: window.innerHeight }, window.scrollY),
        behavior: 'smooth'
      })
      await new Promise((r) => setTimeout(r, 320))
      rect = target.getBoundingClientRect()
    }

    setHole(tourHole(rect, { padding }))

    const box = pop.current
    if (!box) return
    const resolved = resolveOverlay({
      trigger: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
      // 用带变换的尺寸算出来的位置会偏几个像素
      popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
      viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      placement: current.placement ?? 'bottom',
      offset: padding + 10
    })
    setPosition({ x: resolved.x, y: resolved.y, placement: resolved.placement })
  }, [steps, index, padding])

  const next = useCallback(() => {
    const target = tourNext(index, steps.length)
    onIndexChange?.(target)
    if (target === -1) onFinish?.()
  }, [index, steps.length, onIndexChange, onFinish])

  const prev = useCallback(() => onIndexChange?.(tourPrev(index)), [index, onIndexChange])

  const skip = useCallback(() => {
    onIndexChange?.(-1)
    onSkip?.()
  }, [onIndexChange, onSkip])

  useEffect(() => {
    locate()
  }, [locate])

  /*
   * 键盘监听挂在 document 上，而不是浮层元素上。
   * 挂在元素上要求它先拿到焦点，而用户是点页面上某个按钮把引导打开的，
   * 焦点还在那个按钮上——Esc 会毫无反应，而这在开发时最容易漏测，
   * 因为写测试的人总会先点一下浮层。
   */
  useEffect(() => {
    if (index < 0) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip()
      else if (event.key === 'ArrowRight' || event.key === 'Enter') next()
      else if (event.key === 'ArrowLeft') prev()
    }
    // 引导开着时页面仍可能滚动，高亮框要跟着走；合并到每帧一次，别拖累滚动
    const onResize = rafThrottle(() => locate())
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('scroll', onResize, { passive: true })
    // 焦点挪进浮层：读屏与 Tab 顺序都应当落在当前这一步上
    pop.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
      onResize.cancel()
    }
  }, [index, skip, next, prev, locate])

  if (!step) return null

  return createPortal(
    <div className="i-tour" role="dialog" aria-modal="true">
      {/*
        遮罩用一个带「洞」的 SVG，而不是四条挡板拼出来的：
        四条挡板对不上圆角，目标是圆角按钮时四个角会漏出暗色的直角，很显眼。
      */}
      <svg className="i-tour__mask" onClick={skip}>
        <defs>
          <mask id="i-tour-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && (
              <rect x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx={hole.radius} fill="black" />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" mask="url(#i-tour-hole)" />
      </svg>

      {/* 高亮框自己再描一圈：只挖洞的话，浅色背景上洞与页面几乎看不出边界 */}
      {hole && (
        <div
          className="i-tour__ring"
          style={{
            left: hole.x,
            top: hole.y,
            width: hole.width,
            height: hole.height,
            borderRadius: hole.radius
          }}
        />
      )}

      <div
        ref={pop}
        className={['i-tour__pop', `is-${position.placement}`, hole ? '' : 'is-center']
          .filter(Boolean)
          .join(' ')}
        style={hole ? { left: position.x, top: position.y } : undefined}
        tabIndex={-1}
      >
        <header className="i-tour__head">
          <h3 className="i-tour__title">{step.title}</h3>
          <button className="i-tour__close" aria-label="跳过引导" onClick={skip}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <p className="i-tour__desc">{step.description}</p>
        <footer className="i-tour__foot">
          {/* 进度写成「2 / 5」而不是画一排点：引导通常不长，数字比点更省认知 */}
          <span className="i-tour__count">
            {index + 1} / {steps.length}
          </span>
          <div className="i-tour__actions">
            {index > 0 && (
              <Button size="sm" variant="text" onClick={prev}>
                上一步
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={next}>
              {isLast ? '我知道了' : '下一步'}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  )
}
