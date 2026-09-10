/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 85,
  "vue": 85,
  "react": 85,
  "miniprogram": 86,
  "mobile-vue": 97,
  "mobile-react": 97,
  "flutter": 77
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 85
