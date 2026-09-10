import { useRef, type PointerEvent } from 'react'
import { keyLabel, keypadRows, pressKey, type KeypadKey } from '@i-design/common'
import { Icon } from './Icon'

export interface NumberKeypadProps {
  value?: string
  onChange?: (value: string) => void
  /** 最多几位小数。0 表示不允许小数点 */
  decimals?: number
  /** 最大长度，按字符数算（含小数点与负号） */
  maxLength?: number
  /** 允许负数，键盘上多一个 +/- 键 */
  negative?: boolean
  /** 右侧的确认列。金额场景常见，验证码场景不需要 */
  confirmText?: string
  onConfirm?: (value: string) => void
  className?: string
}

export function NumberKeypad({
  value = '',
  onChange,
  decimals = 2,
  maxLength = 12,
  negative = false,
  confirmText = '',
  onConfirm,
  className = ''
}: NumberKeypadProps) {
  const rows = keypadRows({ decimals, negative })
  const latest = useRef(value)
  latest.current = value

  function press(key: KeypadKey) {
    if (!key) return
    const next = pressKey(latest.current, key, { decimals, maxLength, negative })
    latest.current = next
    onChange?.(next)
  }

  /** 长按删除键连续退格：输错一长串时一下一下点太慢 */
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null)
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null)

  function holdStart(key: KeypadKey) {
    if (key !== 'backspace') return
    delay.current = setTimeout(() => {
      repeat.current = setInterval(() => press('backspace'), 80)
    }, 400)
  }

  function holdEnd() {
    if (delay.current) clearTimeout(delay.current)
    if (repeat.current) clearInterval(repeat.current)
    delay.current = null
    repeat.current = null
  }

  const stop = (_: PointerEvent) => holdEnd()

  return (
    // role="group" 而不是一堆裸按钮：读屏进来时先念出「数字键盘」，
    // 使用者才知道接下来这十几个按钮是一组
    <div className={['i-keypad', className].filter(Boolean).join(' ')} role="group" aria-label="数字键盘">
      <div className="i-keypad__pad">
        {rows.map((row, r) =>
          row.map((key, k) => (
            <button
              key={`${r}-${k}`}
              className={[
                'i-keypad__key',
                key === 'backspace' || key === 'sign' ? 'i-keypad__key--fn' : '',
                key === '' ? 'is-empty' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={key === ''}
              aria-label={keyLabel(key)}
              type="button"
              onClick={() => press(key)}
              onPointerDown={() => holdStart(key)}
              onPointerUp={stop}
              onPointerLeave={stop}
              onPointerCancel={stop}
            >
              {key === 'backspace' ? <Icon name="close" size={18} /> : key === 'sign' ? '+/−' : key}
            </button>
          ))
        )}
      </div>

      {/* 确认键竖跨整列：它是这块键盘上唯一一个「结束输入」的键，得比数字键显眼 */}
      {confirmText && (
        <button className="i-keypad__confirm" type="button" onClick={() => onConfirm?.(value)}>
          {confirmText}
        </button>
      )}
    </div>
  )
}
