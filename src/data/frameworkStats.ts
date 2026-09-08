/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 63,
  "vue": 63,
  "react": 63,
  "miniprogram": 64,
  "mobile-vue": 74,
  "mobile-react": 74,
  "flutter": 59
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 63
