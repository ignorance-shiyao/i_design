import type { ComputedRef, InjectionKey, Ref } from 'vue'

/** RadioGroup 向后代 Radio 下发的上下文 */
export interface RadioGroupContext {
  value: Ref<string | number | boolean | undefined> | ComputedRef<string | number | boolean | undefined>
  disabled: ComputedRef<boolean>
  variant: ComputedRef<'default' | 'button'>
  name: string
  change: (value: string | number | boolean) => void
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('IRadioGroup')

/** CheckboxGroup 向后代 Checkbox 下发的上下文 */
export interface CheckboxGroupContext {
  value: ComputedRef<(string | number)[]>
  disabled: ComputedRef<boolean>
  /** 已达 max 时未选中项应禁用 */
  atMax: ComputedRef<boolean>
  toggle: (value: string | number, checked: boolean) => void
}

export const checkboxGroupKey: InjectionKey<CheckboxGroupContext> = Symbol('ICheckboxGroup')
