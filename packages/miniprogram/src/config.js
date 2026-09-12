import { resolveLocale, zhCN } from '@i-design/common'

/**
 * 这一端的全局配置。
 *
 * 小程序没有 provide/inject 也没有 context，只能落在模块级。
 * 代价是表达不了「页面里这一块换另一种语言」——需要局部覆盖时，
 * 给那几个组件单独传 placeholder / emptyText 这类属性。
 * 这是平台限制，不是取舍：另外三端都用上下文。
 */
let current = zhCN

/** 换字典。只写要改的那几句即可，缺的沿用基准字典 */
export function setLocale(overrides = {}, base = zhCN) {
  current = resolveLocale(overrides, base)
  return current
}

export function getLocale() {
  return current
}
