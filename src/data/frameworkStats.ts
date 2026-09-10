/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 88,
  "vue": 88,
  "react": 88,
  "miniprogram": 89,
  "mobile-vue": 100,
  "mobile-react": 100,
  "flutter": 80
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 88
