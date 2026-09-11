import type { ReactNode } from 'react'

export interface CheckTagProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  round?: boolean
  disabled?: boolean
  children?: ReactNode
}

/**
 * 可选中的标签：长得像标签，行为像多选框。
 * 选中态用填充色而不是加一圈粗边——粗边会让选中项的视觉面积变大，
 * 一排标签选中几个之后间距看起来就不匀了。
 */
export function CheckTag({
  checked = false,
  onChange,
  round = false,
  disabled = false,
  children
}: CheckTagProps) {
  const classes = [
    'i-check-tag',
    round ? 'i-check-tag--round' : '',
    checked ? 'is-checked' : '',
    disabled ? 'is-disabled' : ''
  ]
    .filter(Boolean)
    .join(' ')

  // button + aria-pressed 而不是 div：读屏要能说出「已按下」，键盘要能用空格切换
  return (
    <button
      className={classes}
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      {children}
    </button>
  )
}
