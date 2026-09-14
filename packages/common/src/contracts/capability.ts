/**
 * 能力声明：哪个组件在哪个端确实做不到，以及替代路径是什么。
 *
 * pro 层定为全端（astra.md §3.0 选项 B）之后，这份声明是那个决策的配套：
 * 「某端确实不支持」必须写成一条声明，并指名替代路径——不是「该端暂不支持」
 * 一句了事，更不是拿一个空壳去满足 parity。
 *
 * 声明只登记**例外**。没写进来的组合，默认就是「该端要有真实现」，
 * 由覆盖矩阵去管。scripts/check-capability.mjs 从两个方向校验：
 *
 * - 声明写着不支持，那个端就不许存在同名实现（存在就说明声明过期了）；
 * - 声明里的组件必须真的存在于别的端（否则这条是删组件时漏掉的陈旧声明）；
 * - 不支持必须同时给出 reason 与 fallback，两者都不能是空话。
 *
 * 为什么不允许「先声明不支持，以后再补」：那样声明会变成待办清单，
 * 而待办清单上的东西没人会回头看。要么现在做，要么写清楚替代路径。
 */

export type EndName = 'vue-next' | 'vue' | 'react' | 'miniprogram' | 'flutter'

export const END_NAMES: readonly EndName[] = [
  'vue-next',
  'vue',
  'react',
  'miniprogram',
  'flutter'
]

export const END_LABELS: Record<EndName, string> = {
  'vue-next': 'Vue 3',
  vue: 'Vue 2.7',
  react: 'React',
  miniprogram: '小程序',
  flutter: 'Flutter'
}

export interface CapabilityException {
  /** 组件名，如 IQueryFilter */
  component: string
  end: EndName
  /** 这个端为什么做不到——要说清是平台限制还是取舍 */
  reason: string
  /** 用户在这个端上改用什么完成同一件事 */
  fallback: string
}

/**
 * 当前的例外清单。
 *
 * 空清单是好事，不是没写：意味着到目前为止每个组件在五端都有真实现。
 */
export const capabilityExceptions: CapabilityException[] = []

export const exceptionFor = (component: string, end: EndName) =>
  capabilityExceptions.find((e) => e.component === component && e.end === end)
