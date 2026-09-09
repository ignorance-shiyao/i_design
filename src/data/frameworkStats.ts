/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 66,
  "vue": 66,
  "react": 66,
  "miniprogram": 67,
  "mobile-vue": 78,
  "mobile-react": 78,
  "flutter": 62
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 66
