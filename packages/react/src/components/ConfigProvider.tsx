import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { resolveLocale, zhCN, type Locale } from '@i-design/common'

export interface ConfigValue {
  locale: Locale
  /** 表单类组件的默认尺寸。组件自己传了 size 就以自己的为准 */
  size: 'sm' | 'md' | 'lg'
}

/*
 * 用 context 而不是模块级单例：同一个页面里可能嵌着一块另一种语言的内容
 * （英文合同原文旁边配中文说明），单例表达不了「这一块用另一份字典」。
 * 嵌套时内层覆盖外层——这正是 context 天然的行为。
 */
const ConfigContext = createContext<ConfigValue>({ locale: zhCN, size: 'md' })

/**
 * 读取 ConfigProvider 下发的配置。
 *
 * 没有 Provider 时回落到默认值，而不是报错——绝大多数应用一份中文字典就够了，
 * 不该为此逼所有人在根节点套一层。
 */
export function useConfig(): ConfigValue {
  return useContext(ConfigContext)
}

export interface ConfigProviderProps {
  /** 完整字典，或只写要改的那几句 */
  locale?: Partial<Locale>
  /** 换一份基准字典，例如 enUS。不传则以中文为基准 */
  base?: Locale
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
}

/**
 * 全局配置。包住一棵子树，里面的组件就用这里给的字典与默认尺寸。
 *
 * 不额外包一层元素：配置是纯粹的上下文，多出来的 div 会打断 flex/grid 的父子关系，
 * 接上去才发现布局塌了。
 */
export function ConfigProvider({ locale = {}, base = zhCN, size = 'md', children }: ConfigProviderProps) {
  const value = useMemo<ConfigValue>(
    () => ({ locale: resolveLocale(locale, base), size }),
    [locale, base, size]
  )
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}
