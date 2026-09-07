import type { ComputedRef, InjectionKey } from 'vue'
import type { FormRule } from './validate'

export interface FormContext {
  model: ComputedRef<Record<string, any>>
  rules: ComputedRef<Record<string, FormRule[]>>
  labelWidth: ComputedRef<string>
  labelPlacement: ComputedRef<'left' | 'top'>
  disabled: ComputedRef<boolean>
  /** 提交前不打扰用户：只有提交过一次后，change 才立即报错 */
  submitted: ComputedRef<boolean>
  /** FormItem 挂载时登记自己，供 Form 统一校验与重置 */
  register: (item: FormItemHandle) => void
  unregister: (prop: string) => void
}

export interface FormItemHandle {
  prop: string
  validate: (trigger?: 'change' | 'blur') => Promise<string | null>
  clear: () => void
}

export const formKey: InjectionKey<FormContext> = Symbol('IForm')
