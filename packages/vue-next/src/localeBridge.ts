import { shallowRef } from 'vue'
import { zhCN, type Locale } from '@i-design/common'

/**
 * 给「挂在 body 上」的那几层用的字典。
 *
 * message()、confirm()、notification() 的宿主是命令式 API 自己创建的，
 * 挂在 document.body 下面，根本不在组件树里——inject 到不了那里。
 * ConfigProvider 在解析出字典时顺手写一份到这里，那几层再从这里读。
 *
 * 嵌套多个 Provider 时这里存的是「最后渲染的那一个」。对树内组件没有影响
 * （它们走 inject，内层照样覆盖外层）；而对树外的浮层来说，
 * 本来就不存在「它属于哪一层」这个问题——它属于整个页面。
 */
/* 用 ref 而不是普通变量：读它的是 computed，普通变量变了不会让它重算 */
export const bridgedLocale = shallowRef<Locale>(zhCN)

export function setBridgedLocale(locale: Locale) {
  bridgedLocale.value = locale
}
