import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SegmentedProps {
  value?: string | number | null
  options: SegmentedOption[]
  size?: 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  onChange?: (value: string | number) => void
  className?: string
}

/**
 * 分段控制器。与 Tabs 的分工：Tabs 切换页面区域，Segmented 切换同一区域内的
 * 数据视角（日/周/月）。
 */
export function Segmented({
  value = null,
  options,
  size = 'md',
  block = false,
  disabled = false,
  onChange,
  className = ''
}: SegmentedProps) {
  const root = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ left: 0, width: 0 })

  /**
   * 滑块位置按选中项的实际尺寸量，而不是按「第 n 项 × 平均宽度」算：
   * 选项文字长短不一时，等分假设会让滑块与文字错位。
   */
  useLayoutEffect(() => {
    const index = options.findIndex((o) => o.value === value)
    const el = root.current?.querySelectorAll('.i-segmented__item')[index] as HTMLElement | undefined
    setThumb(el ? { left: el.offsetLeft, width: el.offsetWidth } : { left: 0, width: 0 })
  }, [value, options, block, size])

  // 字体加载完成后宽度会变，重新量一次
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fonts) return
    let cancelled = false
    fonts.ready.then(() => {
      if (cancelled) return
      const index = options.findIndex((o) => o.value === value)
      const el = root.current?.querySelectorAll('.i-segmented__item')[index] as
        | HTMLElement
        | undefined
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth })
    })
    return () => {
      cancelled = true
    }
  }, [value, options])

  return (
    <div
      ref={root}
      className={[
        'i-segmented',
        `i-segmented--${size}`,
        block ? 'is-block' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      role="radiogroup"
    >
      {thumb.width > 0 && (
        <span
          className="i-segmented__thumb"
          style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
          aria-hidden="true"
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          className={[
            'i-segmented__item',
            option.value === value ? 'is-active' : '',
            disabled || option.disabled ? 'is-disabled' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          role="radio"
          aria-checked={option.value === value}
          disabled={disabled || option.disabled}
          onClick={() => option.value !== value && onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
