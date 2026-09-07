import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { runRules, type FormRule } from '@i-design/common'
import { useForm } from './Form'

export interface FormItemRenderProps {
  id: string
  invalid: boolean
}

export interface FormItemProps {
  /** 对应 model 中的字段名；不传则只做布局，不参与校验 */
  prop?: string
  label?: string
  rules?: FormRule[]
  /** 仅控制必填星号的显示；是否真的必填由规则决定 */
  required?: boolean
  help?: string
  labelWidth?: string
  children?: ReactNode | ((props: FormItemRenderProps) => ReactNode)
}

export function FormItem({
  prop = '',
  label = '',
  rules,
  required,
  help = '',
  labelWidth = '',
  children
}: FormItemProps) {
  const form = useForm()
  const [error, setError] = useState<string | null>(null)
  const id = `i-form-item-${useId()}`

  const activeRules = rules ?? (prop ? form?.rules[prop] ?? [] : [])
  const showRequired = required !== undefined ? required : activeRules.some((r) => r.required)
  const value = prop ? form?.model[prop] : undefined

  // 用 ref 保存最新值，避免把 validate 绑死在某次渲染的闭包上
  const latest = useRef({ value, rules: activeRules })
  latest.current = { value, rules: activeRules }

  const validate = useCallback(
    async (trigger?: 'change' | 'blur') => {
      if (!prop || !latest.current.rules.length) return null
      const next = await runRules(latest.current.value, latest.current.rules, trigger)
      setError(next)
      return next
    },
    [prop]
  )

  const clear = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!prop || !form) return
    form.register({ prop, validate, clear })
    return () => form.unregister(prop)
  }, [prop, form, validate, clear])

  // 值变化时：首次提交前不主动报错，只在已有错误时重新校验让它尽快消失
  const prevValue = useRef(value)
  useEffect(() => {
    if (prevValue.current === value) return
    prevValue.current = value
    if (form?.submitted || error) validate('change')
  }, [value, form?.submitted, error, validate])

  const placement = form?.labelPlacement ?? 'left'

  return (
    <div
      className={['i-form-item', `is-${placement}`, error ? 'is-error' : ''].filter(Boolean).join(' ')}
      onBlur={() => validate('blur')}
    >
      {label ? (
        <label
          className="i-form-item__label"
          htmlFor={id}
          style={{ width: placement === 'left' ? labelWidth || form?.labelWidth : undefined }}
        >
          {showRequired && <span className="i-form-item__required" aria-hidden="true">*</span>}
          {label}
        </label>
      ) : (
        placement === 'left' && (
          // 无 label 的项留出同宽占位，保持控件左边线对齐
          <span
            className="i-form-item__spacer"
            style={{ width: labelWidth || form?.labelWidth }}
            aria-hidden="true"
          />
        )
      )}
      <div className="i-form-item__control">
        {typeof children === 'function' ? children({ id, invalid: !!error }) : children}
        {error ? (
          <p className="i-form-item__error" role="alert">{error}</p>
        ) : help ? (
          <p className="i-form-item__help">{help}</p>
        ) : null}
      </div>
    </div>
  )
}
