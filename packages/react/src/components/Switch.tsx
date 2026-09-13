export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  /**
   * 无障碍名。
   *
   * 开关本身只是一个圆点，读屏用户听到的是「开关，未选中」——开的是什么全靠猜。
   * 旁边有可见文字时用 label 关联即可；没有时必须给这个属性。
   */
  ariaLabel?: string
  className?: string
}

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel = '',
  className = ''
}: SwitchProps) {
  return (
    <button
      className={['i-switch', checked ? 'is-checked' : '', className].filter(Boolean).join(' ')}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || undefined}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    >
      <span className="i-switch__thumb" />
    </button>
  )
}
