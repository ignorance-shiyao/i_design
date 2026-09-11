/**
 * 由 scripts/build-framework-stats.mjs 统计各端对外导出的组件名生成，请勿手改。
 * 手填的覆盖数字必然会和代码对不上。
 */
export const frameworkStats: Record<string, number> = {
  "vue-next": 109,
  "vue": 109,
  "react": 109,
  "miniprogram": 110,
  "mobile-vue": 125,
  "mobile-react": 125,
  "flutter": 101
}

/** 以 vue-next 为基准的组件总数 */
export const totalComponents = 109
