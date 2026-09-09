import type { TextareaHTMLAttributes } from 'react'

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
  invalid?: boolean
  /** 显示 已输入/上限 计数，需配合 maxLength */
  showCount?: boolean
  resize?: 'none' | 'vertical' | 'both'
}

export function Textarea({
  value = '',
  onChange,
  rows = 3,
  maxLength,
  invalid = false,
  showCount = false,
  resize = 'vertical',
  disabled,
  className = '',
  ...rest
}: TextareaProps) {
  const overLimit = maxLength !== undefined && value.length > maxLength

  return (
    <div className={['i-textarea', disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ')}>
      <textarea
        className={['i-textarea__inner', invalid || overLimit ? 'is-invalid' : ''].filter(Boolean).join(' ')}
        value={value}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={invalid || overLimit || undefined}
        style={{ resize }}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      />
      {showCount && maxLength !== undefined && (
        <span className={['i-textarea__count', overLimit ? 'is-over' : ''].filter(Boolean).join(' ')}>
          {value.length} / {maxLength}
        </span>
      )}
    </div>
  )
}
