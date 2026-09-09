import { createContext, useCallback, useContext, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { FormRule } from '@i-design/common'

export interface FormItemHandle {
  prop: string
  validate: (trigger?: 'change' | 'blur') => Promise<string | null>
  clear: () => void
}

export interface FormContextValue {
  model: Record<string, any>
  rules: Record<string, FormRule[]>
  labelWidth: string
  labelPlacement: 'left' | 'top'
  disabled: boolean
  /** 提交前不打扰用户：只有提交过一次后，change 才立即报错 */
  submitted: boolean
  register: (item: FormItemHandle) => void
  unregister: (prop: string) => void
}

export const FormContext = createContext<FormContextValue | null>(null)
export const useForm = () => useContext(FormContext)

export interface FormProps {
  model: Record<string, any>
  rules?: Record<string, FormRule[]>
  labelWidth?: string
  labelPlacement?: 'left' | 'top'
  disabled?: boolean
  onSubmit?: (model: Record<string, any>) => void
  /** 校验失败时抛出逐字段错误，便于埋点或滚动定位 */
  onInvalid?: (errors: Record<string, string>) => void
  children?: ReactNode
}

export function Form({
  model,
  rules = {},
  labelWidth = '96px',
  labelPlacement = 'left',
  disabled = false,
  onSubmit,
  onInvalid,
  children
}: FormProps) {
  const items = useRef(new Map<string, FormItemHandle>())
  const [submitted, setSubmitted] = useState(false)

  const register = useCallback((item: FormItemHandle) => {
    items.current.set(item.prop, item)
  }, [])
  const unregister = useCallback((prop: string) => {
    items.current.delete(prop)
  }, [])

  /** 并行校验全部字段，返回是否通过与逐字段错误 */
  const validate = useCallback(async () => {
    setSubmitted(true)
    const entries = await Promise.all(
      [...items.current.values()].map(async (item) => [item.prop, await item.validate()] as const)
    )
    const errors: Record<string, string> = {}
    for (const [prop, error] of entries) if (error) errors[prop] = error
    return { valid: Object.keys(errors).length === 0, errors }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const { valid, errors } = await validate()
    if (valid) onSubmit?.(model)
    else onInvalid?.(errors)
  }

  return (
    <FormContext.Provider
      value={{ model, rules, labelWidth, labelPlacement, disabled, submitted, register, unregister }}
    >
      <form className={`i-form is-${labelPlacement}`} noValidate onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  )
}
