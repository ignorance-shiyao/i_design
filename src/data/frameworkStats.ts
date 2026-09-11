/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 115,
  "vue": 115,
  "react": 115,
  "miniprogram": 116,
  "mobile-vue": 134,
  "mobile-react": 134,
  "flutter": 107
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 115
