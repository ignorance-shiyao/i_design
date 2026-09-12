import { computed, inject } from 'vue'
import { zhCN } from '@i-design/common'
import { configKey } from './context'

/**
 * 读取 ConfigProvider 下发的配置。
 *
 * 没有 Provider 时回落到默认值，而不是报错——绝大多数应用一份中文字典就够了，
 * 不该为此逼所有人在根节点套一层。
 */
export function useConfig() {
  const injected = inject(configKey, null)
  return {
    locale: computed(() => injected?.locale.value ?? zhCN),
    size: computed(() => injected?.size.value ?? 'md')
  }
}
