import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { Locale } from '@i-design/common'

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

/**
 * ConfigProvider 向整棵子树下发的全局配置。
 *
 * 用 inject 而不是模块级单例：同一个页面里可能嵌着一块另一种语言的内容
 * （例如英文合同原文旁边配中文说明），单例表达不了「这一块用另一份字典」。
 */
export interface ConfigContext {
  locale: ComputedRef<Locale>
  /** 表单类组件的默认尺寸。组件自己传了 size 就以自己的为准 */
  size: ComputedRef<'sm' | 'md' | 'lg'>
}

export const configKey: InjectionKey<ConfigContext> = Symbol('IConfigProvider')
