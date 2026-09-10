import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { colorReadout, hexToHsv, hsvToHex, parseColor, resolveOverlay, type Hsv } from '@i-design/common'
import { Icon } from './Icon'

export interface ColorPickerProps {
  value?: string
  onChange?: (hex: string) => void
  /** 常用色，点一下直接取用 */
  presets?: string[]
  disabled?: boolean
  /** 显示对比度读数：挑主色时最该看的就是这个 */
  showContrast?: boolean
  className?: string
}

const DEFAULT_PRESETS = [
  '#5e7ce0', '#0f8a68', '#b7622a', '#c2413d',
  '#7a4ee0', '#1f86b8', '#1d2129', '#86909c'
]

export function ColorPicker({
  value = '#5e7ce0',
  onChange,
  presets = DEFAULT_PRESETS,
  disabled = false,
  showContrast = true,
  className = ''
}: ColorPickerProps) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)
  const picking = useRef(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const [text, setText] = useState(value)

  useEffect(() => {
    setHsv(hexToHsv(value))
    setText(value)
  }, [value])

  useLayoutEffect(() => {
    if (!open) return
    const trigger = root.current?.getBoundingClientRect()
    const box = panel.current
    if (!trigger || !box) return
    const resolved = resolveOverlay({
      trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
      // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale
      popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
      viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      placement: 'bottom',
      align: 'start',
      offset: 6
    })
    setPosition({ x: resolved.x, y: resolved.y })
  }, [open])

  const readout = colorReadout(value)

  function commit(next: Hsv) {
    setHsv(next)
    const hex = hsvToHex(next)
    setText(hex)
    onChange?.(hex)
  }

  /* 饱和度-明度方块：横轴是饱和度，纵轴是明度（上亮下暗） */
  function pickFromArea(event: ReactPointerEvent) {
    const rect = area.current?.getBoundingClientRect()
    if (!rect) return
    const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const v = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    commit({ ...hsv, s, v })
  }

  /*
   * 输入框失焦时才解析。
   * 边打边解析的话，用户删到只剩 "#5" 时会被当成一个合法的颜色（或直接清空），
   * 光标还在框里颜色就已经跳了几次——他没法安心把值改完。
   */
  function commitText() {
    const parsed = parseColor(text)
    if (parsed) {
      setHsv(hexToHsv(parsed))
      onChange?.(parsed)
    } else {
      // 解析不出来就退回原值，而不是留一个红框让人猜哪里错了
      setText(value)
    }
  }

  return (
    <div
      ref={root}
      className={['i-colorpicker', disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ')}
    >
      <button
        className="i-colorpicker__trigger"
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="i-colorpicker__swatch" style={{ background: value }} />
        <span className="i-colorpicker__value">{value}</span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open &&
        createPortal(
          <div ref={panel} className="i-colorpicker__panel" style={{ left: position.x, top: position.y }}>
            <div
              ref={area}
              className="i-colorpicker__area"
              style={{ background: `hsl(${hsv.h} 100% 50%)` }}
              onPointerDown={(e) => {
                picking.current = true
                ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
                pickFromArea(e)
              }}
              onPointerMove={(e) => picking.current && pickFromArea(e)}
              onPointerUp={() => (picking.current = false)}
              onPointerCancel={() => (picking.current = false)}
            >
              <span
                className="i-colorpicker__thumb"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </div>

            <input
              className="i-colorpicker__hue"
              type="range"
              min={0}
              max={359}
              value={Math.round(hsv.h)}
              aria-label="色相"
              onChange={(e) => commit({ ...hsv, h: Number(e.target.value) })}
            />

            <div className="i-colorpicker__row">
              <input
                className="i-colorpicker__text"
                value={text}
                aria-label="色值"
                spellCheck={false}
                onChange={(e) => setText(e.target.value)}
                onBlur={commitText}
                onKeyDown={(e) => e.key === 'Enter' && commitText()}
              />
              {/*
                对比度当场说出来。用户挑的是「好看的颜色」，
                而好不好看和上面的字能不能读是两件事。
              */}
              {showContrast && (
                <span
                  className="i-colorpicker__contrast"
                  style={{ background: value, color: readout.ink }}
                >
                  {readout.ratio}:1
                </span>
              )}
            </div>
            {showContrast && (
              <p className="i-colorpicker__hint">
                {readout.passesText
                  ? '正文与控件文字都够读'
                  : readout.passesUi
                    ? '够做控件文字，正文偏低'
                    : '对比度不足，文字会看不清'}
              </p>
            )}

            <div className="i-colorpicker__presets">
              {presets.map((preset) => (
                <button
                  key={preset}
                  className="i-colorpicker__preset"
                  type="button"
                  style={{ background: preset }}
                  aria-label={preset}
                  aria-pressed={preset.toLowerCase() === value.toLowerCase()}
                  onClick={() => onChange?.(preset)}
                >
                  {preset.toLowerCase() === value.toLowerCase() && <Icon name="check" size={12} />}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
