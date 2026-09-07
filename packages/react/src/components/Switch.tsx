export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked = false, onChange, disabled = false, className = '' }: SwitchProps) {
  return (
    <button
      className={['i-switch', checked ? 'is-checked' : '', className].filter(Boolean).join(' ')}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    >
      <span className="i-switch__thumb" />
    </button>
  )
}
