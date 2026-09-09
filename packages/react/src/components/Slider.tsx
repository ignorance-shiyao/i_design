import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ratioOf, valueFromRatio } from '@i-design/common'

export interface SliderMark {
  value: number
  label?: string
}

export interface SliderProps {
  value?: number
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  marks?: SliderMark[]
  onChange?: (value: number) => void
  className?: string
}

export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  precision = 0,
  disabled = false,
  marks = [],
  onChange,
  className = ''
}: SliderProps) {
  const track = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const ratio = ratioOf(value, min, max)

  /** 指针位置 → 取值：换算与步长对齐都在公共层，与其他端同一套 */
  function apply(clientX: number) {
    const rect = track.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const next = valueFromRatio((clientX - rect.left) / rect.width, min, max, step, precision)
    if (next !== value) onChange?.(next)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return
    setDragging(true)
    // 捕获指针：拖到轨道之外也继续跟随
    event.currentTarget.setPointerCapture(event.pointerId)
    apply(event.clientX)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? step
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -step
          : 0
    if (!delta) return
    event.preventDefault()
    onChange?.(valueFromRatio(ratioOf(value + delta, min, max), min, max, step, precision))
  }

  return (
    <div
      className={['i-slider', disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ')}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => dragging && apply(e.clientX)}
      onPointerUp={(e) => {
        if (!dragging) return
        setDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
    >
      <div ref={track} className="i-slider__track">
        <div className="i-slider__fill" style={{ left: 0, width: `${ratio * 100}%` }} />

        {marks.map((mark) => (
          <span
            key={`mark-${mark.value}`}
            className={['i-slider__mark', mark.value <= value ? 'is-passed' : '']
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${ratioOf(mark.value, min, max) * 100}%` }}
          />
        ))}
        {marks
          .filter((m) => m.label)
          .map((mark) => (
            <span
              key={`label-${mark.value}`}
              className="i-slider__label"
              style={{ left: `${ratioOf(mark.value, min, max) * 100}%` }}
            >
              {mark.label}
            </span>
          ))}

        <div
          className="i-slider__handle"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-disabled={disabled}
          style={{ left: `${ratio * 100}%` }}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
