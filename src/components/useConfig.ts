import { computed, inject } from 'vue'
import { configKey } from './context'
import { bridgedLocale } from './localeBridge'

/**
 * 读取 ConfigProvider 下发的配置。
 *
 * 没有 Provider 时回落到默认值，而不是报错——绝大多数应用一份中文字典就够了，
 * 不该为此逼所有人在根节点套一层。
 */
export function useConfig() {
  const injected = inject(configKey, null)
  return {
    /*
     * 树内走 inject，内层覆盖外层。没有 Provider 时退到 bridge——
     * 对普通组件来说那就是默认中文字典；对挂在 body 上的浮层来说，
     * 那是 Provider 顺手留下的那一份，否则它们会永远说中文。
     */
    locale: computed(() => injected?.locale.value ?? bridgedLocale.value),
    size: computed(() => injected?.size.value ?? 'md')
  }
}
