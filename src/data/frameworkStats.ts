/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 36,
  "vue": 36,
  "react": 36,
  "miniprogram": 37,
  "mobile-vue": 39,
  "mobile-react": 39,
  "flutter": 36
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 36
