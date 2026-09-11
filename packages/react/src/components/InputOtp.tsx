import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react'
import {
  isOtpChar,
  otpBackspace,
  otpFromText,
  otpNextIndex,
  otpValue,
  type OtpMode
} from '@i-design/common'

export interface InputOtpProps {
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  /** 可接受的字符：纯数字或数字加字母 */
  mode?: OtpMode
  /** 用圆点遮住已输入的字符，格数仍然可见 */
  password?: boolean
  /** 在第几格之后插入分隔符，如 3 表示「前三位 - 后三位」 */
  separatorAt?: number
  disabled?: boolean
  invalid?: boolean
}

/**
 * 验证码输入。粘贴、删除、自动填充的规则在 logic/otp，各端共用——
 * 一端粘贴能自动分配、另一端只填进第一格的话，同一条短信在两端上体验完全不同。
 */
export function InputOtp({
  value = '',
  onChange,
  onComplete,
  length = 6,
  mode = 'numeric',
  password = false,
  separatorAt = 0,
  disabled = false,
  invalid = false
}: InputOtpProps) {
  const [cells, setCells] = useState(() => otpFromText(value, length, mode))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  /* 外部改值（清空重填、自动填充）时同步进来 */
  useEffect(() => {
    setCells((current) => (value === otpValue(current) ? current : otpFromText(value, length, mode)))
  }, [value, length, mode])

  const focusCell = (index: number) => {
    const el = inputs.current[index]
    el?.focus()
    el?.select()
  }

  const commit = (next: string[]) => {
    setCells(next)
    const full = otpValue(next)
    onChange?.(full)
    if (full) onComplete?.(full)
  }

  const onInput = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    // 取最后一个字符：格子已有值时再键入，浏览器给的是两个字符
    const char = [...event.target.value].reverse().find((c) => isOtpChar(c, mode)) ?? ''
    const next = [...cells]
    next[index] = char
    commit(next)
    if (char) focusCell(otpNextIndex(index, length))
  }

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const result = otpBackspace(cells, index)
      commit(result.cells)
      focusCell(result.index)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusCell(Math.max(index - 1, 0))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusCell(Math.min(index + 1, length - 1))
    }
  }

  /* 短信里的验证码常带空格或连字符，逐字填会把空格也占掉一格 */
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (!text) return
    event.preventDefault()
    const next = otpFromText(text, length, mode)
    commit(next)
    focusCell(Math.min(next.filter(Boolean).length, length - 1))
  }

  const classes = [
    'i-input-otp',
    password ? 'i-input-otp--password' : '',
    invalid ? 'is-invalid' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="group" aria-label={`${length} 位验证码`}>
      {cells.map((cell, index) => (
        <span key={index}>
          {separatorAt > 0 && index === separatorAt && (
            <span className="i-input-otp__separator">-</span>
          )}
          <input
            ref={(el) => {
              inputs.current[index] = el
            }}
            className="i-input-otp__cell"
            value={cell}
            disabled={disabled}
            aria-label={`第 ${index + 1} 位`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={2}
            onChange={onInput(index)}
            onKeyDown={onKeyDown(index)}
            onPaste={onPaste}
            onFocus={(event) => event.target.select()}
          />
        </span>
      ))}
    </div>
  )
}
